from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import database, models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post("", response_model=schemas.ChatSummary, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_payload: schemas.ChatCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    new_chat = models.Chat(user_id=current_user_id, title=chat_payload.title)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat


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


@router.post(
    "/{chat_id}/messages",
    response_model=schemas.MessageRead,
    status_code=status.HTTP_201_CREATED
)
def send_message(
    chat_id: int,
    message_payload: schemas.MessageCreate,
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

    new_message = models.Message(
        chat_id=chat_id,
        sender=message_payload.sender,
        content=message_payload.content,
        image_url=message_payload.image_url
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    return new_message
