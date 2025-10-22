import datetime
import enum

from app.database import Base
from sqlalchemy import Column, DateTime, Enum, Integer, String


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)


class TaskStatus(enum.Enum):
    pending = "pending"
    processing = "processing"
    success = "success"
    error = "error"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow,
                        onupdate=datetime.datetime.utcnow)
