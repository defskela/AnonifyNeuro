from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import random

app = FastAPI(title="AnonifyNeuro ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BoundingBox(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int
    confidence: float

class DetectionResponse(BaseModel):
    success: bool
    detections: List[BoundingBox]
    image_width: int
    image_height: int

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ml"}

@app.post("/detect", response_model=DetectionResponse)
async def detect_license_plates(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    
    image_width = 1920
    image_height = 1080
    
    num_detections = random.randint(1, 3)
    detections = []
    
    for _ in range(num_detections):
        x1 = random.randint(100, image_width - 300)
        y1 = random.randint(100, image_height - 150)
        width = random.randint(150, 250)
        height = random.randint(40, 80)
        
        detections.append(BoundingBox(
            x1=x1,
            y1=y1,
            x2=x1 + width,
            y2=y1 + height,
            confidence=round(random.uniform(0.7, 0.99), 2)
        ))
    
    return DetectionResponse(
        success=True,
        detections=detections,
        image_width=image_width,
        image_height=image_height
    )
