from fastapi import APIRouter, HTTPException
from app.models import ArticleRequest, ArticleResponse
from app.services.article_scraper import extract_article
from app.services.sentiment import analyse_sentiment, classify_tone_tag
from app.services.tagger import extract_tags
from app.services.summariser import summarise_text

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/analyse", response_model=ArticleResponse)
def analyse_article(req: ArticleRequest):
    text = extract_article(req.url)
    if not text or len(text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Unable to extract usuable article text.")
    
    summary = summarise_text(text)
    sentiment_data = analyse_sentiment(text)
    primary_emotion = max(sentiment_data, key=sentiment_data.get)
    tags = extract_tags(text)
    overall_tone = classify_tone_tag(sentiment_data)

    print("Response Sent")

    return ArticleResponse(
        summary = summary,
        sentiment = sentiment_data,
        primary_emotion = primary_emotion,
        tone = overall_tone,
        tags = tags
    )