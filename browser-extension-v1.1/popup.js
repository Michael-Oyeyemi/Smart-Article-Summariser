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

function showLoadingUI() {
    document.getElementById("summary").textContent = "Analysing...";
    document.getElementById("tone").textContent = "-";
    document.getElementById("emotions").innerHTML = "";
    document.getElementById("tags").innerHTML = "";
}

getCurrentTabUrl().then((url) => {
    const cacheKey = btoa(url); // Base64-encode the URL so we can use it as a safe key

    // Check for cached analysis result
    chrome.storage.local.get([cacheKey], (result) => {
        if (result[cacheKey]) {
            displayAnalysis(result[cacheKey]);
        } else {
            // Not cached — show loading and trigger analysis
            showLoadingUI();

            chrome.runtime.sendMessage({ type: "startAnalysis", url }, (response) => {
                if (response?.status === "success") {
                    console.log("Analysis started.");
                }
            });

            chrome.runtime.onMessage.addListener((msg) => {
                if (msg.type === "analysisComplete" && msg.url === url) {
                    // Save it for later sessions too
                    chrome.storage.local.set({ [cacheKey]: msg.data });
                    displayAnalysis(msg.data);
                }
            });
        }
    });
});
