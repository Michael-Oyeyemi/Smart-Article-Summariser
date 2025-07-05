// Keep service worker alive during analysis
let keepAliveInterval;

function keepServiceWorkerAlive() {
  keepAliveInterval = setInterval(() => {
    console.log("Background: Keeping service worker alive");
  }, 20000); // Ping every 20 seconds
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
    console.log("Background: Stopped keep-alive");
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "startAnalysis") {
    const { url } = request;
    
    console.log("Background: Starting analysis for:", url);
    
    // Keep service worker alive during fetch
    keepServiceWorkerAlive();

    fetch("http://localhost:8000/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    })
    .then(res => {
      console.log("Background: Got response status:", res.status);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      return res.json();
    })
    .then(data => {
      console.log("Background: Analysis complete for:", url);
      console.log("Background: Data received:", data);
      
      // Stop keep-alive
      stopKeepAlive();
      
      // IMPORTANT: Store the result in storage immediately
      const cacheKey = btoa(url);
      const pendingKey = cacheKey + "_pending";
      
      chrome.storage.local.set({ [cacheKey]: data }, () => {
        console.log("Background: Stored result in cache");
        
        // Clear pending state
        chrome.storage.local.remove(pendingKey, () => {
          console.log("Background: Cleared pending state");
        });
        
        // Send message to popup if it's listening
        chrome.runtime.sendMessage({
          type: "analysisComplete",
          url,
          data
        }).catch(err => {
          // This error is expected if popup is closed - that's fine
          console.log("Background: No listeners for message (popup likely closed)");
        });
      });

      sendResponse({ status: "success" });
    })
    .catch(error => {
      console.error("Background: Error in fetch:", error);
      
      // Stop keep-alive on error
      stopKeepAlive();
      
      // Clear pending state on error
      const cacheKey = btoa(url);
      const pendingKey = cacheKey + "_pending";
      chrome.storage.local.remove(pendingKey);
      
      // Send error message
      chrome.runtime.sendMessage({
        type: "analysisError",
        url,
        error: error.toString()
      }).catch(err => {
        console.log("Background: No listeners for error message");
      });

      sendResponse({ status: "error", error: error.toString() });
    });

    return true; // Keep message channel open for async response
  }
});