from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator

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


class UserRead(BaseModel):
    id: int
    username: str
    email: str

    model_config = ConfigDict(from_attributes=True)


class ChatSummary(BaseModel):
    id: int
    title: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatCreate(BaseModel):
    title: Optional[str] = None


class ChatUpdate(BaseModel):
    title: Optional[str] = None


class MessageCreate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None
    sender: MessageSender = MessageSender.user

    @model_validator(mode="after")
    def ensure_content(self):
        if not self.content and not self.image_url:
            raise ValueError("Either content or image_url must be provided")
        return self


class MessageRead(BaseModel):
    id: int
    chat_id: int
    sender: MessageSender
    content: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
