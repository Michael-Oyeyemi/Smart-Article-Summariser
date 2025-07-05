***Smart Article Summariser + Emotion & Tone Tagging Chrome Extension***

A browser extension paired with a FastAPI backend that scrapes, summarises, and analyses the emotional tone of articles you're reading — all in real-time!

---

***What It Does***

- Extracts the main content of any article from its URL
- Summarises the article text using a BART-based NLP model
- Detects emotional sentiment with zero-shot classification
- Assigns overall tone and semantic topic tags
- Displays summary, tone, emotions, and tags in a Chrome extension popup

---

***How to Run Locally***

**1. Clone this repository**
<pre>git clone https://github.com/your-username/smart-article-summariser.git</pre>
<pre>cd smart-article-summariser</pre>

**2. Setup and run backend API**

**Note:** Due to PyTorch compatibility, it's recommended to use **Python 3.10 or 3.11** (avoid Python 3.12+ for now) to ensure smooth installation.

<pre>cd backend</pre>
<pre>python3.11 -m venv venv</pre>
<pre>source venv/bin/activate</pre>
<pre>pip install -r requirements.txt</pre>
<pre>uvicorn app.main:app --reload</pre>
<pre>Backend will be running at http://localhost:8000</pre>

You can check health of endpoint by using:

<pre>curl http://localhost:8000/health </pre>

Should return: `{"status":"ok"}`

**3. Load Chrome extension**

- Go to chrome://extensions
- Enable **Developer mode** (toggle)
- Click **Load Unpacked** and seletct the **browser-extension-v1** folder inside this repo

**4. Use it**

- Visit any article page in Chrome
- Click your extension icon to see the summary, tone, emotions, and tags fetched live from your backend

---

***API Endpoints***

**POST** `/analyse`

Accepts JSON body:
<pre>
```
{
  "url": "https://example.com/article-to-analyse"
}</pre>

Returns JSON Response:
<pre>
{
  "summary": "Article summary text...",
  "sentiment": {
    "joy": 0.7,
    "sadness": 0.1,
    "anger": 0.2
  },
  "primary_emotion": "joy",
  "tone": "uplifting",
  "tags": ["technology", "ai", "research"]
}
```
</pre>

---

***Technologies Used***

- Backend: Python, FastAPI, Uvicorn, HuggingFace Transformers, Trafilatura
- Frontend: JavaScript, Chrome Extension APIs, HTML, CSS
- NLP: BART summarisation, Zero-shot emotion classification, semantic tag extraction

---

***License***

MIT License - feel free to use, modify and contribute to.

---

***About***

Created by Michael Oyeyemi, a student passionate about software engineering, AI/ML and open source
