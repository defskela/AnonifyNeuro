from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import database, models, schemas
from app.routers.auth import get_current_user

router = APIRouter(prefix="/chats", tags=["chats"])


@router.post("", response_model=schemas.ChatSummary, status_code=status.HTTP_201_CREATED)
def create_chat(
    chat_payload: schemas.ChatCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    title = chat_payload.title
    if not title:
        count = db.query(models.Chat).filter(models.Chat.user_id == current_user.id).count()
        title = f"New Chat {count + 1}"
    new_chat = models.Chat(user_id=current_user.id, title=title)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat


@router.get("", response_model=List[schemas.ChatSummary])
def list_chats(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Chat)
    if current_user.role != "admin":
        query = query.filter(models.Chat.user_id == current_user.id)
    chats = query.order_by(models.Chat.created_at.desc()).all()
    return chats


@router.patch("/{chat_id}", response_model=schemas.ChatSummary)
def update_chat(
    chat_id: int,
    chat_payload: schemas.ChatUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if current_user.role != "admin" and chat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    if chat_payload.title is not None:
        chat.title = chat_payload.title
    
    db.commit()
    db.refresh(chat)
    return chat


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if current_user.role != "admin" and chat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    db.query(models.Message).filter(models.Message.chat_id == chat_id).delete()
    db.delete(chat)
    db.commit()
    return None


@router.get("/{chat_id}/messages", response_model=List[schemas.MessageRead])
def get_chat_messages(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if current_user.role != "admin" and chat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chat = db.query(models.Chat).filter(models.Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if current_user.role != "admin" and chat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )

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
