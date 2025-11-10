from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models import MessageSender


class UserCreate(BaseModel):
    username: str
    password: str
    email: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None


class ChatSummary(BaseModel):
    id: int
    title: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MessageRead(BaseModel):
    id: int
    chat_id: int
    sender: MessageSender
    content: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
