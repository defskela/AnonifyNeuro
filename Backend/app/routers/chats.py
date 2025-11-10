from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import database, models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/chats", tags=["chats"])


@router.get("", response_model=List[schemas.ChatSummary])
def list_chats(
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chats = (
        db.query(models.Chat)
        .filter(models.Chat.user_id == current_user_id)
        .order_by(models.Chat.created_at.desc())
        .all()
    )
    return chats


@router.get("/{chat_id}/messages", response_model=List[schemas.MessageRead])
def get_chat_messages(
    chat_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chat = (
        db.query(models.Chat)
        .filter(
            models.Chat.id == chat_id,
            models.Chat.user_id == current_user_id
        )
        .first()
    )
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")

    messages = (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc(), models.Message.id.asc())
        .all()
    )
    return messages
