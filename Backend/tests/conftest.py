from passlib.context import CryptContext
from app import models
import os

import pytest
from app.database import Base, get_db
from app.main import app
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Test database URL
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={
                       "check_same_thread": False})
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

# Create test user
db = TestingSessionLocal()

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
hashed_password = pwd_context.hash("testpass")
test_user = models.User(
    username="testuser", email="test@example.com", hashed_password=hashed_password)
db.add(test_user)
db.commit()
db.close()


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
def test_app():
    from fastapi.testclient import TestClient
    client = TestClient(app)
    yield client
    # Cleanup
    Base.metadata.drop_all(bind=engine)
