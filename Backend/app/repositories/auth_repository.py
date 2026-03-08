import datetime

from sqlalchemy.orm import Session

from app import models


class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_username(self, username: str) -> models.User | None:
        return self.db.query(models.User).filter(models.User.username == username).first()

    def get_user_by_email(self, email: str) -> models.User | None:
        return self.db.query(models.User).filter(models.User.email == email).first()

    def get_user_by_id(self, user_id: int) -> models.User | None:
        return self.db.query(models.User).filter(models.User.id == user_id).first()

    def create_user(self, username: str, email: str, hashed_password: str) -> models.User:
        user = models.User(username=username, email=email, hashed_password=hashed_password)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def list_users(self) -> list[models.User]:
        return self.db.query(models.User).order_by(models.User.id.asc()).all()

    def set_user_role(self, user: models.User, role: str) -> models.User:
        user.role = role
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user_profile(
        self,
        user: models.User,
        *,
        new_username: str | None = None,
        new_hashed_password: str | None = None
    ) -> models.User:
        if new_username is not None:
            user.username = new_username
        if new_hashed_password is not None:
            user.hashed_password = new_hashed_password
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_refresh_token(self, user_id: int, token_jti: str, expires_at: datetime.datetime) -> models.RefreshToken:
        refresh = models.RefreshToken(
            user_id=user_id,
            token_jti=token_jti,
            expires_at=expires_at,
            revoked_at=None,
        )
        self.db.add(refresh)
        self.db.commit()
        self.db.refresh(refresh)
        return refresh

    def get_refresh_token_by_jti(self, token_jti: str) -> models.RefreshToken | None:
        return self.db.query(models.RefreshToken).filter(models.RefreshToken.token_jti == token_jti).first()

    def revoke_refresh_token(self, refresh: models.RefreshToken) -> None:
        refresh.revoked_at = datetime.datetime.utcnow()
        self.db.commit()

    def revoke_all_user_refresh_tokens(self, user_id: int) -> None:
        now = datetime.datetime.utcnow()
        self.db.query(models.RefreshToken).filter(
            models.RefreshToken.user_id == user_id,
            models.RefreshToken.revoked_at.is_(None)
        ).update({models.RefreshToken.revoked_at: now}, synchronize_session=False)
        self.db.commit()
