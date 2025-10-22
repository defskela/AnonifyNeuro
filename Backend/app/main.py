from app.routers import auth, redact
from fastapi import FastAPI

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(redact.router, tags=["redact"])


@app.get("/")
def read_root():
    return {"Hello": "World"}
