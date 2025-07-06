async function getCurrentTabUrl() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab.url;
}

function displayAnalysis(data) {
    console.log("Popup: Displaying analysis data:", data);
    
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

function showErrorUI(error) {
    document.getElementById("summary").textContent = `Error: ${error}`;
    document.getElementById("tone").textContent = "-";
    document.getElementById("emotions").innerHTML = "";
    document.getElementById("tags").innerHTML = "";
}

getCurrentTabUrl().then((url) => {
    console.log("Popup: Current URL:", url);
    
    const cacheKey = btoa(url);
    const pendingKey = cacheKey + "_pending";

    console.log("Popup: Checking storage for keys:", cacheKey, pendingKey);

    chrome.storage.local.get([cacheKey, pendingKey], (result) => {
        const cached = result[cacheKey];
        const pending = result[pendingKey];

        console.log("Popup: Storage result - cached:", !!cached, "pending:", !!pending);

        if (cached) {
            // Analysis is complete and cached
            console.log("Popup: Found cached result");
            displayAnalysis(cached);
        } else {
            // Set up message listener first
            const messageListener = (msg) => {
                console.log("Popup: Received message:", msg);
                
                if (msg.type === "analysisComplete" && msg.url === url) {
                    console.log("Popup: Analysis complete message received");
                    chrome.storage.local.set({ [cacheKey]: msg.data });
                    chrome.storage.local.remove(pendingKey);
                    displayAnalysis(msg.data);
                    chrome.runtime.onMessage.removeListener(messageListener);
                } else if (msg.type === "analysisError" && msg.url === url) {
                    console.log("Popup: Analysis error message received");
                    chrome.storage.local.remove(pendingKey);
                    showErrorUI(msg.error);
                    chrome.runtime.onMessage.removeListener(messageListener);
                }
            };
            chrome.runtime.onMessage.addListener(messageListener);

            if (pending) {
                console.log("Popup: Request is pending, showing loading UI");
                showLoadingUI();
                
                // Check if this pending state is stale (older than 2 minutes)
                const pendingTimestamp = pending === true ? Date.now() : pending;
                const isStale = (Date.now() - pendingTimestamp) > 120000; // 2 minutes
                
                if (isStale) {
                    console.log("Popup: Pending state is stale, clearing and restarting");
                    chrome.storage.local.remove(pendingKey);
                    startNewAnalysis(url, cacheKey, pendingKey, messageListener);
                } else {
                    // Double-check storage after a brief delay in case analysis completed
                    // while popup was closed
                    setTimeout(() => {
                        chrome.storage.local.get([cacheKey, pendingKey], (result) => {
                            const newCached = result[cacheKey];
                            const newPending = result[pendingKey];
                            
                            console.log("Popup: Recheck - cached:", !!newCached, "pending:", !!newPending);
                            
                            if (newCached) {
                                console.log("Popup: Found cached result after recheck");
                                displayAnalysis(newCached);
                                chrome.runtime.onMessage.removeListener(messageListener);
                            } else if (!newPending) {
                                console.log("Popup: Pending cleared but no result - restarting");
                                // Pending was cleared but no cached result - restart
                                startNewAnalysis(url, cacheKey, pendingKey, messageListener);
                            } else {
                                console.log("Popup: Still pending after recheck, adding timeout");
                                // Still pending after recheck, set a timeout to clear stale state
                                setTimeout(() => {
                                    chrome.storage.local.get([cacheKey, pendingKey], (result) => {
                                        if (result[pendingKey] && !result[cacheKey]) {
                                            console.log("Popup: Timeout reached, clearing stale pending state");
                                            chrome.storage.local.remove(pendingKey);
                                            startNewAnalysis(url, cacheKey, pendingKey, messageListener);
                                        }
                                    });
                                }, 30000); // 30 second timeout
                            }
                        });
                    }, 500); // Increased delay to 500ms
                }
            } else {
                console.log("Popup: Starting new analysis");
                startNewAnalysis(url, cacheKey, pendingKey, messageListener);
            }
        }
    });
});

function startNewAnalysis(url, cacheKey, pendingKey, messageListener) {
    showLoadingUI();
    chrome.storage.local.set({ [pendingKey]: Date.now() }); // Store timestamp instead of just true

    console.log("Popup: Sending startAnalysis message");
    chrome.runtime.sendMessage({ type: "startAnalysis", url }, (response) => {
        console.log("Popup: Response from background:", response);
        
        if (response?.status === "success") {
            console.log("Popup: Analysis started successfully");
        } else {
            console.warn("Popup: Failed to start analysis:", response?.error);
            chrome.storage.local.remove(pendingKey);
            showErrorUI(response?.error || "Unknown error");
            chrome.runtime.onMessage.removeListener(messageListener);
        }
    });
}