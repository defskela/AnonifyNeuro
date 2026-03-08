import math
from datetime import datetime
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app import database, models, schemas
from app.routers.auth import get_current_user
from app.storage import storage

router = APIRouter(prefix="/chats", tags=["chats"])

ALLOWED_FILE_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


def _check_chat_access(chat: models.Chat | None, current_user: models.User):
    if not chat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat not found")
    if current_user.role != "admin" and chat.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return chat


def _chat_summary_payload(row) -> schemas.ChatSummary:
    chat = row[0]
    return schemas.ChatSummary(
        id=chat.id,
        title=chat.title,
        created_at=chat.created_at,
        owner_id=chat.user_id,
        owner_username=row.owner_username,
        messages_count=int(row.messages_count or 0),
        has_images=bool(row.images_count or 0),
        last_activity_at=row.last_activity_at,
    )


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
    return schemas.ChatSummary.model_validate(new_chat)


@router.get("", response_model=schemas.ChatListResponse)
def list_chats(
    q: str | None = Query(default=None, max_length=100),
    owner_id: int | None = Query(default=None, ge=1),
    created_from: datetime | None = None,
    created_to: datetime | None = None,
    has_images: bool | None = None,
    min_messages: int | None = Query(default=None, ge=0),
    sort_by: str = Query(default="created_at"),
    sort_order: str = Query(default="desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    allowed_sort = {"created_at", "title", "messages_count", "last_activity_at"}
    if sort_by not in allowed_sort:
        raise HTTPException(status_code=422, detail="Invalid sort_by value")
    if sort_order not in {"asc", "desc"}:
        raise HTTPException(status_code=422, detail="Invalid sort_order value")

    messages_count_expr = func.count(models.Message.id)
    images_count_expr = func.sum(case((models.Message.image_url.is_not(None), 1), else_=0))
    last_activity_expr = func.max(models.Message.created_at)

    query = (
        db.query(
            models.Chat,
            models.User.username.label("owner_username"),
            messages_count_expr.label("messages_count"),
            images_count_expr.label("images_count"),
            last_activity_expr.label("last_activity_at"),
        )
        .join(models.User, models.User.id == models.Chat.user_id)
        .outerjoin(models.Message, models.Message.chat_id == models.Chat.id)
        .group_by(models.Chat.id, models.User.username)
    )

    if current_user.role != "admin":
        query = query.filter(models.Chat.user_id == current_user.id)
    elif owner_id is not None:
        query = query.filter(models.Chat.user_id == owner_id)

    if q:
        query = query.filter(models.Chat.title.ilike(f"%{q.strip()}%"))
    if created_from:
        query = query.filter(models.Chat.created_at >= created_from)
    if created_to:
        query = query.filter(models.Chat.created_at <= created_to)
    if min_messages is not None:
        query = query.having(messages_count_expr >= min_messages)
    if has_images is not None:
        query = query.having(images_count_expr > 0 if has_images else images_count_expr == 0)

    sort_map = {
        "created_at": models.Chat.created_at,
        "title": models.Chat.title,
        "messages_count": messages_count_expr,
        "last_activity_at": last_activity_expr,
    }
    order_column = sort_map[sort_by]
    query = query.order_by(order_column.asc() if sort_order == "asc" else order_column.desc())

    total = db.query(func.count()).select_from(query.subquery()).scalar() or 0
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    items = [_chat_summary_payload(row) for row in rows]

    return schemas.ChatListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=max(1, math.ceil(total / page_size)) if total else 1,
    )


@router.get("/{chat_id}", response_model=schemas.ChatSummary)
def get_chat(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chat = _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)

    stats = (
        db.query(
            func.count(models.Message.id).label("messages_count"),
            func.sum(case((models.Message.image_url.is_not(None), 1), else_=0)).label("images_count"),
            func.max(models.Message.created_at).label("last_activity_at"),
            models.User.username.label("owner_username"),
        )
        .select_from(models.Chat)
        .join(models.User, models.User.id == models.Chat.user_id)
        .outerjoin(models.Message, models.Message.chat_id == models.Chat.id)
        .filter(models.Chat.id == chat_id)
        .group_by(models.User.username)
        .first()
    )
    if not stats:
        return schemas.ChatSummary.model_validate(chat)

    class _Row:
        def __init__(self, chat_obj):
            self._chat = chat_obj

        def __getitem__(self, index):
            if index == 0:
                return self._chat
            raise IndexError(index)

    row = _Row(chat)
    row.owner_username = stats.owner_username
    row.messages_count = stats.messages_count
    row.images_count = stats.images_count
    row.last_activity_at = stats.last_activity_at
    return _chat_summary_payload(row)


@router.patch("/{chat_id}", response_model=schemas.ChatSummary)
def update_chat(
    chat_id: int,
    chat_payload: schemas.ChatUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    chat = _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)

    if chat_payload.title is not None:
        chat.title = chat_payload.title

    db.commit()
    db.refresh(chat)
    return schemas.ChatSummary.model_validate(chat)


@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)

    files = db.query(models.ChatFile).filter(models.ChatFile.chat_id == chat_id).all()
    for file_meta in files:
        try:
            storage.delete_file(file_meta.object_key)
        except Exception:
            pass
        db.delete(file_meta)

    db.query(models.Message).filter(models.Message.chat_id == chat_id).delete()
    db.query(models.Chat).filter(models.Chat.id == chat_id).delete()
    db.commit()
    return None


@router.get("/{chat_id}/messages", response_model=List[schemas.MessageRead])
def get_chat_messages(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)

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
    _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)

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


@router.post("/{chat_id}/files", response_model=schemas.ChatFileRead, status_code=status.HTTP_201_CREATED)
async def upload_chat_file(
    chat_id: int,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)

    if not file.content_type or file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    size = len(content)
    if size == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    if size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File is too large")

    safe_name = (file.filename or "uploaded_file").strip() or "uploaded_file"
    object_key = f"chat-files/{chat_id}/{uuid4()}-{safe_name}"
    storage.upload_file(content, object_key, file.content_type)

    meta = models.ChatFile(
        chat_id=chat_id,
        uploaded_by=current_user.id,
        object_key=object_key,
        filename=safe_name,
        content_type=file.content_type,
        size=size,
    )
    db.add(meta)
    db.commit()
    db.refresh(meta)
    return meta


@router.get("/{chat_id}/files", response_model=List[schemas.ChatFileRead])
def list_chat_files(
    chat_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)
    return (
        db.query(models.ChatFile)
        .filter(models.ChatFile.chat_id == chat_id)
        .order_by(models.ChatFile.created_at.desc(), models.ChatFile.id.desc())
        .all()
    )


@router.get("/{chat_id}/files/{file_id}/download", response_model=schemas.ChatFileDownloadResponse)
def get_chat_file_download_url(
    chat_id: int,
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)
    file_meta = (
        db.query(models.ChatFile)
        .filter(models.ChatFile.id == file_id, models.ChatFile.chat_id == chat_id)
        .first()
    )
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")

    return schemas.ChatFileDownloadResponse(url=storage.get_presigned_url(file_meta.object_key))


@router.delete("/{chat_id}/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chat_file(
    chat_id: int,
    file_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    _check_chat_access(db.query(models.Chat).filter(models.Chat.id == chat_id).first(), current_user)
    file_meta = (
        db.query(models.ChatFile)
        .filter(models.ChatFile.id == file_id, models.ChatFile.chat_id == chat_id)
        .first()
    )
    if not file_meta:
        raise HTTPException(status_code=404, detail="File not found")

    storage.delete_file(file_meta.object_key)
    db.delete(file_meta)
    db.commit()
    return None
