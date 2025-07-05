from transformers.pipelines import pipeline
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

EMOTIONS = ["grief", "respect", "joy", "anger", "hope", "love", "shock", "sadness", "happiness"]
TONE_PROTOTYPES = {
    "neutral":     [0.0, 0.2, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.2],
    "tragic":      [0.95, 0.4, 0.0, 0.3, 0.1, 0.1, 0.8, 0.9, 0.0],
    "outraged":    [0.2, 0.3, 0.0, 0.95, 0.1, 0.0, 0.6, 0.7, 0.0],
    "uplifting":   [0.0, 0.3, 0.9, 0.0, 0.85, 0.7, 0.2, 0.0, 0.95],
    "inspirational": [0.1, 0.7, 0.8, 0.0, 0.95, 0.85, 0.1, 0.0, 0.9],
    "hopeful":     [0.1, 0.5, 0.6, 0.1, 0.95, 0.7, 0.1, 0.1, 0.7],
    "devastating": [0.98, 0.2, 0.0, 0.5, 0.0, 0.0, 0.7, 0.95, 0.0],
    "celebratory": [0.0, 0.4, 0.95, 0.0, 0.6, 0.9, 0.1, 0.0, 1.0],
}

classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def analyse_sentiment(text: str, threshold: float = 0.35) -> dict:
    emotions = ["grief", "respect", "joy", "anger", "hope", "love", "shock", "sadness", "happiness"]
    result = classifier(text, candidate_labels=emotions, multi_label=True)
    return {
        label: round(score, 3)
        for label, score in zip(result["labels"], result["scores"]) if score >= threshold
    }


def get_emotion_vectors(sentiment_data: dict[str,float], emotions: list[str] = EMOTIONS) -> list:
    return [sentiment_data.get(emotion, 0.0) for emotion in emotions]

def classify_tone_tag(sentiment_data: dict[str,float], emotions: list[str] = EMOTIONS, tone_prototypes: dict[str,list] = TONE_PROTOTYPES) -> str:
    input_vec = np.array(get_emotion_vectors(sentiment_data)).reshape(1,-1)
    best_tone = None
    best_score = -1

    for tone, prototype in tone_prototypes.items():
        proto_vec = np.array(prototype).reshape(1,-1)
        sim = cosine_similarity(input_vec, proto_vec)[0][0]
        if sim > best_score:
            best_score = sim
            best_tone = tone

    return best_tone