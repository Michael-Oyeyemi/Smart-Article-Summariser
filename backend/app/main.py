from fastapi import FastAPI
from app.routes import router

app = FastAPI(
    title = "Smart Article Summariser API",
    version="0.1"
)

app.include_router(router)