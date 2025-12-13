import os
import uuid
import httpx
import base64
from io import BytesIO
from PIL import Image, ImageDraw
from typing import List, Optional

from app import database, models
from app.routers.auth import get_current_user
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

router = APIRouter()

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8001")

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    class_name: str = "unknown"

class DetectionResult(BaseModel):
    success: bool
    detections: List[BoundingBox]
    image_width: int
    image_height: int

class RedactResponse(BaseModel):
    task_id: str
    status: str
    detections_count: int
    detections: List[BoundingBox]
    redacted_image_base64: Optional[str] = None

async def call_ml_service(file_content: bytes, filename: str) -> DetectionResult:
    async with httpx.AsyncClient(timeout=30.0) as client:
        files = {"file": (filename, file_content, "image/jpeg")}
        response = await client.post(f"{ML_SERVICE_URL}/detect", files=files)
        
        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="ML service error")
        
        return DetectionResult(**response.json())

def redact_image(image_bytes: bytes, detections: List[BoundingBox], confidence_threshold: float = 0.5) -> bytes:
    image = Image.open(BytesIO(image_bytes))
    draw = ImageDraw.Draw(image)
    
    for det in detections:
        if det.confidence >= confidence_threshold:
            draw.rectangle([det.x1, det.y1, det.x2, det.y2], fill="black")
    
    output = BytesIO()
    image.save(output, format="PNG")
    output.seek(0)
    return output.getvalue()


@router.post("/redact", response_model=RedactResponse)
async def redact_document(
    file: UploadFile = File(...),
    confidence_threshold: float = Form(0.5),
    return_image: bool = Form(True),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    task_id = str(uuid.uuid4())
    file_content = await file.read()
    
    task = models.Task(
        id=task_id,
        user_id=1,
        status=models.TaskStatus.processing,
        details="Detecting license plates..."
    )
    db.add(task)
    db.commit()
    
    try:
        ml_result = await call_ml_service(file_content, file.filename or "image.jpg")
        
        filtered_detections = [d for d in ml_result.detections if d.confidence >= confidence_threshold]
        
        redacted_image_base64 = None
        if return_image and filtered_detections:
            redacted_bytes = redact_image(file_content, ml_result.detections, confidence_threshold)
            redacted_image_base64 = base64.b64encode(redacted_bytes).decode("utf-8")
        
        task.status = models.TaskStatus.success
        task.details = f"Found {len(filtered_detections)} license plate(s)"
        db.commit()
        
        return RedactResponse(
            task_id=task_id,
            status="success",
            detections_count=len(filtered_detections),
            detections=filtered_detections,
            redacted_image_base64=redacted_image_base64
        )
        
    except httpx.RequestError as e:
        task.status = models.TaskStatus.failed
        task.details = f"ML service unavailable: {str(e)}"
        db.commit()
        raise HTTPException(status_code=503, detail="ML service unavailable")
    except Exception as e:
        task.status = models.TaskStatus.failed
        task.details = f"Processing error: {str(e)}"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entities")
def get_entities(current_user: str = Depends(get_current_user)):
    return {
        "entities": ["license_plate"]
    }


@router.get("/logs/{task_id}")
def get_task_log(task_id: str, current_user: str = Depends(get_current_user), db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "task_id": task_id,
        "status": task.status.value,
        "details": task.details
    }
