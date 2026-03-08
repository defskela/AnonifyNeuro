import os

from fastapi import Depends
from sqlalchemy.orm import Session

from app import database
from app.repositories.auth_repository import AuthRepository
from app.services.auth_service import AuthService

SECRET_KEY = os.getenv("SECRET_KEY", "change_me_super_secret_key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))


def get_auth_service(db: Session = Depends(database.get_db)) -> AuthService:
    repository = AuthRepository(db)
    return AuthService(
        repository,
        secret_key=SECRET_KEY,
        algorithm=ALGORITHM,
        access_token_expire_minutes=ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_days=REFRESH_TOKEN_EXPIRE_DAYS,
    )
