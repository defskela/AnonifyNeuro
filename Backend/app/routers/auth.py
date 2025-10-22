from datetime import datetime, timedelta

from app import database, models, schemas
from fastapi import APIRouter, Depends, HTTPException
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

router = APIRouter()

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


@router.post("/register", status_code=201)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    username = user.username
    password = user.password
    email = user.email

    if not username or not password or not email:
        raise HTTPException(status_code=400, detail="Invalid data")

    db_user = db.query(models.User).filter(
        models.User.username == username).first()
    if db_user:
        raise HTTPException(
            status_code=400, detail="Username already registered")

    db_email = db.query(models.User).filter(models.User.email == email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(password)
    new_user = models.User(username=username, email=email,
                           hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    return {"message": "User created successfully", "jwt_token": access_token}


@router.post("/login")
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    username = user.username
    password = user.password

    db_user = db.query(models.User).filter(
        models.User.username == username).first()
    if not db_user or not verify_password(password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": username}, expires_delta=access_token_expires
    )
    return {"jwt_token": access_token}


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
