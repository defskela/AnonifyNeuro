from collections.abc import Callable

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import models, schemas
from app.dependencies import get_auth_service
from app.services.auth_service import AuthService

router = APIRouter()

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return auth_service.get_current_user_from_access_token(credentials.credentials)
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except LookupError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")


def require_roles(*roles: str) -> Callable:
    def role_dependency(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user

    return role_dependency


@router.post("/register", status_code=201)
def register(
    user: schemas.UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        token_pair = auth_service.register(user)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid data")
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return {
        "message": "User created successfully",
        **token_pair.model_dump(),
    }


@router.post("/login")
def login(
    user: schemas.UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        token_pair = auth_service.login(user)
    except PermissionError:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return token_pair


@router.post("/logout")
def logout(
    payload: schemas.LogoutRequest | None = None,
    current_user: models.User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    refresh_token = payload.refresh_token if payload else None
    auth_service.logout(current_user, refresh_token)
    return {"message": "Logged out successfully"}


@router.post("/refresh")
def refresh(
    payload: schemas.RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return auth_service.refresh(payload.refresh_token)
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except LookupError:
        raise HTTPException(status_code=404, detail="User not found")


@router.get("/profile", response_model=schemas.UserRead)
def read_users_me(
    current_user: models.User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    user = auth_service.repository.get_user_by_id(current_user.id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users", response_model=list[schemas.UserRead])
def list_users(
    _admin_user: models.User = Depends(require_roles("admin")),
    auth_service: AuthService = Depends(get_auth_service)
):
    return auth_service.list_users()


@router.put("/profile")
def update_profile(
    update_payload: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        _, token_pair = auth_service.update_profile(current_user.id, update_payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except LookupError:
        raise HTTPException(status_code=404, detail="User not found")
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    response: dict[str, str] = {"message": "Profile updated successfully"}
    if token_pair:
        response.update(token_pair.model_dump())
    return response


@router.patch("/users/{user_id}/role", response_model=schemas.UserRead)
def update_user_role(
    user_id: int,
    update_payload: schemas.UserRoleUpdate,
    _admin_user: models.User = Depends(require_roles("admin")),
    auth_service: AuthService = Depends(get_auth_service)
):
    try:
        return auth_service.update_user_role(user_id, update_payload.role)
    except LookupError:
        raise HTTPException(status_code=404, detail="User not found")
