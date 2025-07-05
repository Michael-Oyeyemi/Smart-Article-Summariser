from keybert import KeyBERT

kw_model = KeyBERT('all-MiniLM-L6-v2')

def extract_tags(text: str, top_n=5):
    try:
        keywords = kw_model.extract_keywords(text, stop_words='english', top_n=top_n)
        return [word for word, _ in keywords]
    except Exception as e:
        print("⚠️ Tagging failed:", e)
        return []
