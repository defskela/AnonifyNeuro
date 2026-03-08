import datetime
import uuid

from jose import JWTError, jwt
from passlib.context import CryptContext

from app import models, schemas
from app.repositories.auth_repository import AuthRepository


class AuthService:
    def __init__(
        self,
        repository: AuthRepository,
        *,
        secret_key: str,
        algorithm: str,
        access_token_expire_minutes: int,
        refresh_token_expire_days: int,
    ):
        self.repository = repository
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_days = refresh_token_expire_days
        self.pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def create_access_token(self, user: models.User) -> str:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=self.access_token_expire_minutes)
        payload = {
            "sub": user.username,
            "token_type": "access",
            "exp": expire,
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, user: models.User) -> tuple[str, str, datetime.datetime]:
        refresh_jti = str(uuid.uuid4())
        expire = datetime.datetime.utcnow() + datetime.timedelta(days=self.refresh_token_expire_days)
        payload = {
            "sub": user.username,
            "token_type": "refresh",
            "jti": refresh_jti,
            "exp": expire,
        }
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return token, refresh_jti, expire

    def build_token_pair(self, user: models.User) -> schemas.TokenPair:
        access_token = self.create_access_token(user)
        refresh_token, refresh_jti, refresh_exp = self.create_refresh_token(user)
        self.repository.create_refresh_token(user.id, refresh_jti, refresh_exp)
        return schemas.TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            jwt_token=access_token,
        )

    def decode_token(self, token: str) -> dict:
        return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

    def authenticate_user(self, username: str, password: str) -> models.User | None:
        user = self.repository.get_user_by_username(username)
        if not user or not self.verify_password(password, user.hashed_password):
            return None
        return user

    def register(self, payload: schemas.UserCreate) -> schemas.TokenPair:
        username = payload.username
        password = payload.password
        email = payload.email

        if not username or not password or not email:
            raise ValueError("Invalid data")
        if self.repository.get_user_by_username(username):
            raise RuntimeError("Username already registered")
        existing_email = self.repository.get_user_by_email(email)
        if existing_email:
            raise RuntimeError("Email already registered")

        hashed_password = self.get_password_hash(password)
        user = self.repository.create_user(username, email, hashed_password)
        return self.build_token_pair(user)

    def login(self, payload: schemas.UserLogin) -> schemas.TokenPair:
        user = self.authenticate_user(payload.username, payload.password)
        if not user:
            raise PermissionError("Invalid credentials")

        # Single active session policy: revoke previous refresh sessions on new login.
        self.repository.revoke_all_user_refresh_tokens(user.id)
        return self.build_token_pair(user)

    def get_current_user_from_access_token(self, access_token: str) -> models.User:
        try:
            payload = self.decode_token(access_token)
            username = payload.get("sub")
            token_type = payload.get("token_type")
            if not username or token_type != "access":
                raise PermissionError("Invalid token")
        except JWTError as exc:
            raise PermissionError("Invalid token") from exc

        user = self.repository.get_user_by_username(username)
        if not user:
            raise LookupError("User not found")
        return user

    def refresh(self, refresh_token: str) -> schemas.TokenPair:
        try:
            payload = self.decode_token(refresh_token)
            username = payload.get("sub")
            token_type = payload.get("token_type")
            jti = payload.get("jti")
            if not username or token_type != "refresh" or not jti:
                raise PermissionError("Invalid refresh token")
        except JWTError as exc:
            raise PermissionError("Invalid refresh token") from exc

        stored = self.repository.get_refresh_token_by_jti(jti)
        if not stored or stored.revoked_at is not None:
            raise PermissionError("Refresh token revoked")
        if stored.expires_at <= datetime.datetime.utcnow():
            self.repository.revoke_refresh_token(stored)
            raise PermissionError("Refresh token expired")

        user = self.repository.get_user_by_username(username)
        if not user:
            raise LookupError("User not found")

        # Rotation: revoke used refresh token and issue a new pair.
        self.repository.revoke_refresh_token(stored)
        return self.build_token_pair(user)

    def logout(self, user: models.User, refresh_token: str | None = None) -> None:
        if refresh_token:
            try:
                payload = self.decode_token(refresh_token)
                jti = payload.get("jti")
                if jti:
                    stored = self.repository.get_refresh_token_by_jti(jti)
                    if stored and stored.user_id == user.id and stored.revoked_at is None:
                        self.repository.revoke_refresh_token(stored)
                        return
            except JWTError:
                pass

        self.repository.revoke_all_user_refresh_tokens(user.id)

    def list_users(self) -> list[models.User]:
        return self.repository.list_users()

    def update_user_role(self, user_id: int, role: str) -> models.User:
        user = self.repository.get_user_by_id(user_id)
        if not user:
            raise LookupError("User not found")
        return self.repository.set_user_role(user, role)

    def update_profile(self, user_id: int, payload: schemas.UserUpdate) -> tuple[models.User, schemas.TokenPair | None]:
        if not payload.username and not payload.password:
            raise ValueError("No fields to update")

        user = self.repository.get_user_by_id(user_id)
        if not user:
            raise LookupError("User not found")

        issue_new_tokens = False
        new_username: str | None = None
        new_hashed_password: str | None = None

        if payload.username:
            candidate_username = payload.username.strip()
            if not candidate_username:
                raise ValueError("Invalid username")
            if candidate_username != user.username:
                existing_user = self.repository.get_user_by_username(candidate_username)
                if existing_user:
                    raise RuntimeError("Username already registered")
                new_username = candidate_username
                issue_new_tokens = True

        if payload.password:
            candidate_password = payload.password.strip()
            if not candidate_password:
                raise ValueError("Invalid password")
            new_hashed_password = self.get_password_hash(candidate_password)
            issue_new_tokens = True

        updated_user = self.repository.update_user_profile(
            user,
            new_username=new_username,
            new_hashed_password=new_hashed_password,
        )

        if issue_new_tokens:
            self.repository.revoke_all_user_refresh_tokens(updated_user.id)
            return updated_user, self.build_token_pair(updated_user)

        return updated_user, None
