from fastapi import FastAPI

from app.routers import auth, chats, redact

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(redact.router, tags=["redact"])
app.include_router(chats.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}
