// Send a message to the background script once the content script is loaded
chrome.runtime.sendMessage({ contentScriptLoaded: true }, () => {
	console.log("HelpMeOut Screen Recorder");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "startCurrentTabScreenRecording") {
		startCapture(currentTab);
	} else if (message.action === "startFullScreenScreenRecording") {
		startCapture(fullScreen);
	}
});

const currentTab = {
	video: true,
	preferCurrentTab: true,
	surfaceSwitching: "include",
	selfBrowserSurface: "include",
	systemAudio: "include",
};

const fullScreen = {
	video: { displaySurface: "monitor", logicalSurface: true },
	surfaceSwitching: "include",
	systemAudio: "include",
};

const webcam = {
	video: true,
	facingMode: { exact: "user" },
};

const audio = {
	audio: true,
};

let captureStream;
let audioStream;
let webcamStream;
let recorder;

let seconds = 0;
let minutes = 0;
let hours = 0;
let myInterval;

const enableAudio = true;
chrome.runtime.sendMessage({ action: "updateAudioPreference", enableAudio });

const enableWebcam = true;
chrome.runtime.sendMessage({ action: "updateWebcamPreference", enableWebcam });

const getDataFromLink = async (chunks) => {
	const myData = new FormData();

	try {
		myData.append("chunkData", chunks);

		// Issue getting chunks converted to FormData
		chrome.runtime.sendMessage(
			{
				contentScriptQuery: "postData",
				data: myData,
				url: "https://help-me-backend.onrender.com/save-video",
			},
			async function (response) {
				debugger;
				if (response != undefined && response != "") {
					console.log("Response Data:", response);

					return response;
				} else {
					debugger;
					console.log(null);
				}
			}
		);
	} catch (error) {
		console.error("Error:", error);
		// Handle errors here
		throw error;
	}
};

const openExternalLink = () => {
	const externalLink = "https://help-me-out-web.netlify.app/file/345666";
	window.open(externalLink, "_blank");
};

async function startCapture(displayMediaOptions) {
	chrome.storage.sync.get(["enableAudio", "enableWebcam"], async (result) => {
		const { enableAudio, enableWebcam } = result;

		try {
			captureStream = await navigator.mediaDevices.getDisplayMedia(
				displayMediaOptions
			);

			createControlButtons();

			// Get the webcam stream only if it's enabled
			if (enableWebcam) {
				webcamStream = await navigator.mediaDevices.getUserMedia(webcam);
				startWebcam();
			}
			if (enableAudio) {
				// Get the audio stream only if it's enabled
				audioStream = await navigator.mediaDevices.getUserMedia(audio);
			}

			// Create a recorder with the combined stream
			const combinedStream = new MediaStream();
			if (captureStream) {
				captureStream
					.getTracks()
					.forEach((track) => combinedStream.addTrack(track));
			}
			if (enableWebcam) {
				webcamStream
					.getTracks()
					.forEach((track) => combinedStream.addTrack(track));
			}

			if (enableAudio) {
				audioStream
					.getTracks()
					.forEach((track) => combinedStream.addTrack(track));
			}

			recorder = new MediaRecorder(combinedStream);

			const chunks = [];
			recorder.ondataavailable = (e) => chunks.push(e.data);

			recorder.onstop = (e) => {
				getDataFromLink(chunks);
				captureStream.getTracks().forEach((track) => track.stop());
				if (enableAudio) {
					audioStream.getTracks().forEach((track) => track.stop());
				}
				if (enableWebcam) {
					webcamStream.getTracks().forEach((track) => track.stop());
					const element = document.getElementById("webcam-container");
					element?.remove();
				}
				const elementTwo = document.getElementById("stream-control-container");
				elementTwo?.remove();

				openExternalLink()
			};

			// Start the recorder
			recorder.start();

			captureStream.getVideoTracks()[0].addEventListener("ended", () => {
				stopRecording();
			});
		} catch (err) {
			console.error(`Error: ${err}`);
			// Handle errors gracefully and inform the user
		}
	});
}

// Function to stop the recording
function stopRecording() {
	if (recorder && recorder.state !== "inactive") {
		recorder.stop();
		clearInterval(myInterval);
		seconds = 0;
		minutes = 0;
		hours = 0;
	}
}

async function startWebcam() {
	try {
		if (webcamStream) {
			const videoContainer = document.createElement("div");
			videoContainer.id = "webcam-container";
			document.body.appendChild(videoContainer);

			const videoElement = document.createElement("video");
			videoElement.srcObject = webcamStream;

			videoElement.autoplay = true;
			videoElement.style.width = "156px";
			videoElement.style.height = "156px";
			videoElement.style.borderRadius = "50%";
			videoElement.style.position = "fixed";
			videoElement.style.bottom = "10px";
			videoElement.style.left = "10px";
			videoElement.style.zIndex = "99999999";
			videoElement.style.objectFit = "cover";
			videoElement.style.objectPosition = "center";

			videoContainer.appendChild(videoElement);
		} else {
			console.error("Webcam stream not available.");
		}
	} catch (err) {
		console.error(`Error: ${err}`);
		// Handle errors gracefully and inform the user
	}
}

// Function to create and inject the control buttons
function createControlButtons() {
	// Create a div for the timer
	const timerDiv = document.createElement("div");
	timerDiv.style.borderRight = "1px solid white";
	timerDiv.style.width = "100%";
	timerDiv.style.height = "50px";
	timerDiv.style.marginRight = "10px";
	timerDiv.style.display = "flex";
	timerDiv.style.placeContent = "center";
	timerDiv.style.alignItems = "center";

	// Create a span to display the timer
	const timerSpan = document.createElement("span");
	timerSpan.setAttribute("id", "hmo_timer");
	timerSpan.style.color = "white";
	timerSpan.style.marginRight = "3px";
	timerSpan.textContent = "00:00:00"; // Initial timer value

	timerDiv.appendChild(timerSpan);
	timerDiv.innerHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"><path opacity=".4" d="M11.969 22c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10Z" fill="#c00404"></path><path d="M12 16.23a4.23 4.23 0 1 0 0-8.46 4.23 4.23 0 0 0 0 8.46Z" fill="#c00404"></path></svg>`;

	function updateTimer() {
		seconds++;
		if (seconds === 60) {
			seconds = 0;
			minutes++;
			if (minutes === 60) {
				minutes = 0;
				hours++;
			}
		}

		// Format the timer values as "0:00:00"
		const formattedTime =
			(hours < 10 ? "0" : "") +
			hours +
			":" +
			(minutes < 10 ? "0" : "") +
			minutes +
			":" +
			(seconds < 10 ? "0" : "") +
			seconds;

		const replaceDiv = document.getElementById("hmo_timer");
		replaceDiv.innerHTML = formattedTime;
	}

	myInterval = setInterval(updateTimer, 1000);

	// Create a div for the button container
	const buttonContainerDiv = document.createElement("div");
	buttonContainerDiv.style.display = "flex";
	buttonContainerDiv.style.justifyContent = "center";
	buttonContainerDiv.style.height = "inherit";
	buttonContainerDiv.style.alignItems = "center";
	buttonContainerDiv.style.marginTop = "5px";

	// Create individual buttons for each control
	const pauseButton = createButton(
		"Pause",
		`<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M176 96h16v320h-16zM320 96h16v320h-16z"/></svg>`,
		() => {
			// Implement logic to pause or resume the stream
		}
	);

	const stopButton = createButton(
		"Stop",
		`<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><rect x="96" y="96" width="320" height="320" rx="24" ry="24" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/></svg>`,
		() => {
			captureStream?.getTracks().forEach((track) => track.stop());
			stopRecording();
		}
	);

	let getWebcamIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M374.79 308.78L457.5 367a16 16 0 0022.5-14.62V159.62A16 16 0 00457.5 145l-82.71 58.22A16 16 0 00368 216.3v79.4a16 16 0 006.79 13.08z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M268 384H84a52.15 52.15 0 01-52-52V180a52.15 52.15 0 0152-52h184.48A51.68 51.68 0 01320 179.52V332a52.15 52.15 0 01-52 52z" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32"/></svg>`;

	const disableWebcamButton = createButton("Camera", getWebcamIcon, () => {
		if (enableWebcam) {
			if (webcamStream.getVideoTracks()[0].enabled === true) {
				webcamStream.getVideoTracks()[0].enabled = false;
				const element = document.getElementById("webcam-container");
				element?.remove();
			} else {
				webcamStream.getVideoTracks()[0].enabled = true;
				startWebcam();
			}
		}
	});

	const muteButton = createButton(
		"Mic",
		`<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M192 448h128M384 208v32c0 70.4-57.6 128-128 128h0c-70.4 0-128-57.6-128-128v-32M256 368v80"/><path d="M256 64a63.68 63.68 0 00-64 64v111c0 35.2 29 65 64 65s64-29 64-65V128c0-36-28-64-64-64z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>`,
		() => {
			if (enableAudio) {
				if (audioStream.getAudioTracks()[0].enabled === true) {
					audioStream.getAudioTracks()[0].enabled = false;
				} else {
					audioStream.getAudioTracks()[0].enabled = true;
				}
			}
		}
	);

	const discardButton = deleteButton(
		"delete",
		`<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 112h352"/><path d="M192 112V72h0a23.93 23.93 0 0124-24h80a23.93 23.93 0 0124 24h0v40M256 176v224M184 176l8 224M328 176l-8 224" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>`,
		() => {
			const elementTwo = document.getElementById("stream-control-container");
			clearInterval(myInterval);
			seconds = 0;
			minutes = 0;
			hours = 0;

			elementTwo.remove();

			captureStream?.getTracks().forEach((track) => track.stop());

			if (enableAudio) {
				audioStream?.getTracks().forEach((track) => track.stop());
			}
			if (enableWebcam) {
				webcamStream?.getTracks().forEach((track) => track.stop());
				const element = document.getElementById("webcam-container");
				element?.remove();
			}

			if (recorder && recorder.state !== "inactive") {
				captureStream = null;
				audioStream = null;
				webcamStream = null;
			}
		}
	);

	// Append buttons to the button container div
	buttonContainerDiv.appendChild(pauseButton);
	buttonContainerDiv.appendChild(stopButton);
	buttonContainerDiv.appendChild(disableWebcamButton);
	buttonContainerDiv.appendChild(muteButton);
	buttonContainerDiv.appendChild(discardButton);

	const controlContainer = document.createElement("div");
	controlContainer.id = "stream-control-container";
	controlContainer.style.position = "fixed";
	controlContainer.style.bottom = "60px";
	controlContainer.style.left = "210px";
	controlContainer.style.height = "70px";
	controlContainer.style.width = "381px";
	controlContainer.style.borderRadius = "200px";
	controlContainer.style.background = "rgba(20, 20, 20, 1)";
	controlContainer.style.boxShadow = "1px 0px 8px 7px rgba(98,98,98,0.23)";
	controlContainer.style.display = "flex";
	controlContainer.style.justifyContent = "space-between";
	controlContainer.style.alignItems = "center";
	controlContainer.style.padding = "0 15px";
	controlContainer.style.zIndex = "99999999";
	controlContainer.appendChild(timerDiv);
	controlContainer.appendChild(buttonContainerDiv);

	// Append the control panel to the document body
	document.body.appendChild(controlContainer);
}

function createButton(text, inner, clickHandler) {
	const container = document.createElement("div");
	container.style.display = "flex";
	container.style.justifyContent = "center";
	container.style.alignItems = "center";
	container.style.flexDirection = "column";

	const label = document.createElement("p");
	label.style.fontSize = "11px";
	label.style.marginTop = "-5px";
	label.style.color = "white";
	label.textContent = text;

	const button = document.createElement("button");
	button.style.background = "white";
	button.style.color = "black";
	button.style.padding = "8px";
	button.style.height = "35px";
	button.style.width = "35px";
	button.style.border = "0px";
	button.style.cursor = "pointer";
	button.style.textAlign = "center";
	button.style.borderRadius = "100%";
	button.style.margin = "5px";
	button.innerHTML = inner;

	container.appendChild(button);
	container.appendChild(label);

	button.addEventListener("click", clickHandler);
	return container;
}

function deleteButton(text, inner, clickHandler) {
	const container = document.createElement("div");
	container.style.display = "flex";
	container.style.justifyContent = "center";
	container.style.alignItems = "center";
	container.style.flexDirection = "column";
	container.style.marginTop = "20px";

	const label = document.createElement("p");
	label.style.fontSize = "12px";
	label.style.visibility = "hidden";
	label.style.color = "white";
	label.textContent = text;

	const button = document.createElement("button");
	button.style.background = "rgba(75, 75, 75, 1)";
	button.style.color = "rgba(190, 190, 190, 1)";
	button.style.padding = "8px";
	button.style.height = "35px";
	button.style.width = "35px";
	button.style.border = "0px";
	button.style.cursor = "pointer";
	button.style.textAlign = "center";
	button.style.borderRadius = "100%";
	button.style.margin = "5px";
	button.innerHTML = inner;

	container.appendChild(button);
	container.appendChild(label);

	button.addEventListener("click", clickHandler);
	return container;
}
