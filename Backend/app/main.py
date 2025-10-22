from app.routers import auth
from fastapi import FastAPI

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])


@app.get("/")
def read_root():
    return {"Hello": "World"}
