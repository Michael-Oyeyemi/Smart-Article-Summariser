async function getCurrentTabUrl() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url;
}

function displayAnalysis(data) {
    document.getElementById("summary").textContent = data.summary;
    document.getElementById("tone").textContent = data.tone;

    const emoList = document.getElementById("emotions");
    emoList.innerHTML = "";
    for (const [emo, score] of Object.entries(data.sentiment)) {
        const li = document.createElement("li");
        li.textContent = `${emo}: ${score}`;
        emoList.appendChild(li);
    }

    const tagsDiv = document.getElementById("tags");
    tagsDiv.innerHTML = "";
    data.tags.forEach(tag => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = tag;
        tagsDiv.appendChild(span);
    });
}

getCurrentTabUrl().then(async (url) => {
    const response = await fetch("http://localhost:8000/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
    });

    const data = await response.json();
    displayAnalysis(data);
});
