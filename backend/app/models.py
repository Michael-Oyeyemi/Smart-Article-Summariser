from pydantic import BaseModel, HttpUrl
from typing import List

class ArticleRequest(BaseModel):
    url: HttpUrl

class ArticleResponse(BaseModel):
    summary: str
    sentiment: dict
    primary_emotion: str
    tone: str
    tags: List[str]