import os
import uuid

from app import database, models
from app.routers.auth import get_current_user
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/redact")
def redact_document(
    file: UploadFile = File(...),
    types: str = Form(None),
    current_user: str = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    # Mock processing
    task_id = str(uuid.uuid4())

    # Save file temporarily
    file_path = f"/tmp/{task_id}_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    # Create task
    task = models.Task(
        id=task_id,
        user_id=1,  # Mock user_id, in real app get from token
        status=models.TaskStatus.processing,
        details="Processing started"
    )
    db.add(task)
    db.commit()

    # Mock processing result
    # In real app, process the file and update task
    task.status = models.TaskStatus.success
    task.details = "Document processed successfully"
    db.commit()

    # Return processed file (mock)
    return {"task_id": task_id, "status": "success"}


@router.get("/entities")
def get_entities(current_user: str = Depends(get_current_user)):
    return {
        "entities": ["name", "email", "phone", "address", "passport", "ssn", "credit_card"]
    }


@router.get("/logs/{task_id}")
def get_task_log(task_id: str, current_user: str = Depends(get_current_user), db: Session = Depends(database.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return {
        "status": task.status.value,
        "details": task.details
    }
