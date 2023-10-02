chrome.runtime.onInstalled.addListener((details) => {
	if (details.reason === "install" || details.reason === "update") {
		// Find all open tabs
		chrome.tabs.query({}, (tabs) => {
			tabs.forEach((tab) => {
				if (tab) {
					chrome.scripting.executeScript({
						target: { tabId: tab.id },
						files: ["contentScript.js"], // Replace with your content script file name
					});
				}
			});
		});
	}
});

if (chrome.runtime) {
	// Send the message to the background script
	chrome.runtime.onMessageExternal.addListener(
		(request, sender, sendResponse) => {
			console.log("Received message from " + sender + ": ", request);
			sendResponse({ received: true }); //respond however you like
		}
	);
} else {
	// Handle the case where the extension is not available (e.g., not installed)
	console.error("Extension not available.");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "updateAudioPreference") {
		const { enableAudio } = message;
		chrome.storage.sync.set({ enableAudio });
	} else if (message.action === "updateWebcamPreference") {
		const { enableWebcam } = message;
		chrome.storage.sync.set({ enableWebcam });
	}
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.contentScriptQuery == "postData") {
		fetch(request.url, {
			method: "POST",
			headers: {
				"Content-Type": "multipart/form-data; boundary=<calculated when request is sent>"
			},
			body: request.data,
		})
			.then((response) => response.json())
			.then((response) => sendResponse(response))
			.catch((error) => console.log("Error:", error));
		return true;
	}
});
