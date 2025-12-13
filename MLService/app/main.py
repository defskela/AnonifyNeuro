from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import io
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="AnonifyNeuro ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model =YOLO('license_plate_detector.pt')

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float
    class_name: str

class DetectionResponse(BaseModel):
    success: bool
    detections: List[BoundingBox]
    image_width: int
    image_height: int

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml"}

@app.post("/detect", response_model=DetectionResponse)
async def detect(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    contents = await file.read()
    try:
        image = Image.open(io.BytesIO(contents))
        if image.mode != "RGB":
            image = image.convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image data")

    width, height = image.size

    # Run inference
    results = model(image)

    detections = []
    target_classes = [0] 

    for result in results:
        boxes = result.boxes
        for box in boxes:
            cls_id = int(box.cls[0])
            if cls_id in target_classes:
                coords = box.xyxy[0].tolist()
                detections.append(BoundingBox(
                    x1=int(coords[0]),
                    y1=int(coords[1]),
                    x2=int(coords[2]),
                    y2=int(coords[3]),
                    confidence=round(float(box.conf[0]), 2),
                    class_name=model.names[cls_id]
                ))

    return DetectionResponse(
        success=True,
        detections=detections,
        image_width=width,
        image_height=height
    )
