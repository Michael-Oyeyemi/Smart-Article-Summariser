from transformers.pipelines import pipeline
from sentence_transformers import SentenceTransformer, util
import nltk
from nltk.tokenize import sent_tokenize

nltk.download('punkt_tab')
summariser = pipeline("summarization", model = "facebook/bart-large-cnn")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

def get_top_k(num_sentences: int) -> int:
    return max(3, min(8, round(num_sentences * 0.23)))


def extract_best_sentences(text: str, top_k: int = 5) -> str:
    sentences = sent_tokenize(text)

    if len(sentences) <= 3:
        return text
    
    top_k = get_top_k(len(sentences))
    print(top_k)
    
    document_embedding = embedder.encode([text], convert_to_tensor=True)
    sentence_embeddings = embedder.encode(sentences, convert_to_tensor=True)

    cosine_scores = util.cos_sim(document_embedding, sentence_embeddings)[0]

    top_indices = cosine_scores.argsort(descending=True)[:top_k]
    top_sentences = [sentences[i] for i in top_indices]

    top_sentences.sort(key=lambda s: sentences.index(s))
    return " ".join(top_sentences)

def summarise_text(text: str) -> str:
    extracted = extract_best_sentences(text)
    summary = summariser(extracted, max_length = 200, min_length = 60, do_sample = False)
    return summary[0]["summary_text"]