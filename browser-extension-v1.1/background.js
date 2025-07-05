chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "startAnalysis") {
    const { url } = request;

    fetch("http://localhost:8000/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    })
    .then(res => res.json())
    .then(data => {
      chrome.runtime.sendMessage({
        type: "analysisComplete",
        url,
        data
      });
      sendResponse({ status: "success" });
    })
    .catch(error => {
      console.error("Analysis failed:", error);
      sendResponse({ status: "error", error: error.toString() });
    });

    return true;
  }
});
