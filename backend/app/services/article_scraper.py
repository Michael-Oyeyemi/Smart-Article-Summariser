import requests
from newspaper import Article
from bs4 import BeautifulSoup
from readability import Document
import trafilatura

def extract_article(url: str) -> str:
    # First try: Trafilatura
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) "
                "Version/14.1 Safari/605.1.15"
            )
        }
        response = requests.get(url, headers=headers, timeout=10)
        html = response.text
        print("[✅ HTML FETCHED]", len(html))

        result = trafilatura.extract(html, include_comments=False)
        if result and len(result.strip()) > 500:
            return result.strip()
        else:
            print("⚠️ Trafilatura returned too little.")
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
    
    # Second try: newspaper3k
    try:
        print("[📰] Using newspaper3k...")
        article = Article(url)
        article.download()
        article.parse()
        final_article = article.text.strip()
        if len(final_article) > 500:
            return final_article
        else:
            print("⚠️ Newspaper3k returned too little content.")
    except Exception as e:
        print(f"⚠️ Newspaper3k failed: {e}")
    
    # Third try: readability + BeautifulSoup
    try:
        print("[🧪] Using readability-lxml...")
        html = requests.get(url, timeout=10).text
        doc = Document(html)
        soup = BeautifulSoup(doc.summary(), "html.parser")
        fallback_text = soup.get_text(separator="\n").strip()
        if len(fallback_text) > 300:
            return fallback_text
        else:
            print("⚠️ Readability fallback also too short.")
    except Exception as e:
        print(f"⚠️ Readability failed: {e}")
    
    # Final fail
    print("❌ All extractors failed.")
    return ""
