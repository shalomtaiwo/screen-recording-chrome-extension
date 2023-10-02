import React from "react";
import "./popup.css";
import {
	ActionIcon,
	Button,
	Flex,
	MantineProvider,
	Paper,
	Switch,
	Text,
	createTheme,
	Image,
	Anchor,
} from "@mantine/core";
import { useToggle } from "@mantine/hooks";
import { Monitor, Copy } from "iconsax-react";
import { IconVideo, IconMicrophone } from "@tabler/icons-react";
import {usePermission} from 'react-use';

const theme = createTheme({});

const Popup = () => {
	const [value, toggle] = useToggle(["Fullscreen", "Current"]);
	const [uploading, setIsUpload] = React.useState(false);
	

	// Initialize the audio recording preference from Chrome storage

	const startCurrentScreenRecording = () => {
		if (value === "Fullscreen") {
			// Send a message to the content script to start screen recording
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTab = tabs[0];
				chrome.tabs.sendMessage(activeTab.id, {
					action: "startFullScreenScreenRecording",
				});
			});
		} else if (value === "Current") {
			// Send a message to the content script to start screen recording
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const activeTab = tabs[0];
				chrome.tabs.sendMessage(activeTab.id, {
					action: "startCurrentTabScreenRecording",
				});
			});
		} else {
			return null;
		}
	};

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.uploading === true) {
			// Set the flag to indicate that uploading is in progress
			setIsUpload(true);
		} else {
			setIsUpload(false);
		}
	});

	// Initialize the audio and webcam recording preferences from local storage
	const [enableAudio, setEnableAudio] = React.useState(true);
	const [enableWebcam, setEnableWebcam] = React.useState(true);

	React.useEffect(() => {
		// Retrieve the enableAudio and enableWebcam preferences from local storage
		chrome.storage.sync.get(["enableAudio", "enableWebcam"], (result) => {
			if (result.enableAudio !== undefined) {
				setEnableAudio(result.enableAudio);
				if(result.enableAudio === true){
					const state = usePermission({ name: 'microphone' });
				}
			}
			if (result.enableWebcam !== undefined) {
				setEnableWebcam(result.enableWebcam);
				if(result.enableWebcam === true){
					const state = usePermission({ name: 'camera' });
				}
			}
		});
	}, []);

	// Toggle handler for audio enablement
	const handleAudioToggleChange = () => {
		const newEnableAudio = !enableAudio;
		setEnableAudio(newEnableAudio);

		// Send the user's audio preference to the content script
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, {
				action: "updateAudioPreference",
				enableAudio: newEnableAudio,
			});
		});

		// Save the user's audio preference to Chrome storage
		chrome.storage.sync.set({ enableAudio: newEnableAudio });
	};

	// Toggle handler for webcam enablement
	const handleWebcamToggleChange = () => {
		const newEnableWebcam = !enableWebcam;
		setEnableWebcam(newEnableWebcam);

		// Send the user's webcam preference to the content script
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const activeTab = tabs[0];
			chrome.tabs.sendMessage(activeTab.id, {
				action: "updateWebcamPreference",
				enableWebcam: newEnableWebcam,
			});
		});

		// Save the user's webcam preference to Chrome storage
		chrome.storage.sync.set({ enableWebcam: newEnableWebcam });
	};

	const openExternalLink = () => {
		const externalLink = "https://help-me-out-web.netlify.app/home";
		chrome.tabs.create({ url: externalLink });
	};

	return (
		<MantineProvider
			theme={theme}
			classNamesPrefix={"help-me-out"}
		>
			<div>
				<Flex
					justify={"space-between"}
					align={"center"}
				>
					<div>
						<Image
							src={
								" https://res.cloudinary.com/dg8os5pul/image/upload/v1695930979/Logo_uaovc3.svg"
							}
							alt="helpMeOut logo"
						/>
					</div>

					<div>
						<ActionIcon
							color="white"
							variant="white"
							onClick={openExternalLink}
						>
							<Image
								src={
									" https://res.cloudinary.com/dg8os5pul/image/upload/v1695931852/setting-2_ztxgae.svg"
								}
								alt="settings"
							/>
						</ActionIcon>
						<ActionIcon
							color="white"
							variant="white"
							onClick={() => window.close()}
						>
							<Image
								src={
									" https://res.cloudinary.com/dg8os5pul/image/upload/v1695931856/close-circle_nhwzvu.svg"
								}
								alt="close"
							/>
						</ActionIcon>
					</div>
				</Flex>
				<Text
					c="rgba(65, 60, 109, 1)"
					size="14px"
					lh={"16.42px"}
					mt={13}
				>
					This extension helps you record and share help videos with ease.
				</Text>
				<Paper mt={25}>
					<div>
						<Flex
							mb={20}
							justify={"space-around"}
							align={"center"}
						>
							<Button
								variant="white"
								color={value === "Fullscreen" ? "rgba(18, 11, 72, 1)" : "grey"}
								onClick={() => toggle("Fullscreen")}
								h={70}
							>
								<Flex
									align={"center"}
									direction={"column"}
									justify={"center"}
								>
									<Monitor size={27} />
									<Text
										fw={500}
										mt={5}
										size="14px"
									>
										Full screen
									</Text>
								</Flex>
							</Button>
							<Button
								variant="white"
								color={value === "Current" ? "rgba(18, 11, 72, 1)" : "grey"}
								onClick={() => toggle("Current")}
								h={70}
							>
								<Flex
									align={"center"}
									direction={"column"}
									justify={"center"}
								>
									<Copy size={27} />
									<Text
										fw={500}
										mt={5}
										size="14px"
									>
										Current tab
									</Text>
								</Flex>
							</Button>
						</Flex>
						<div>
							<Flex
								justify={"space-between"}
								align={"center"}
								style={{
									border: "1px solid rgba(16, 10, 66, 1)",
									borderRadius: "12px",
								}}
								mt={10}
								p={"6px 10px"}
							>
								<div>
									<Button
										variant="white"
										color="rgba(16, 10, 66, 1)"
										leftSection={<IconVideo />}
									>
										Camera
									</Button>
								</div>
								<Switch
									checked={enableWebcam}
									onChange={handleWebcamToggleChange}
									color="rgba(16, 10, 66, 1)"
								/>
							</Flex>
							<Flex
								justify={"space-between"}
								align={"center"}
								style={{
									border: "1px solid rgba(16, 10, 66, 1)",
									borderRadius: "12px",
								}}
								mt={25}
								p={"6px 10px"}
							>
								<div>
									<Button
										variant="white"
										color="rgba(16, 10, 66, 1)"
										leftSection={<IconMicrophone />}
									>
										Audio
									</Button>
								</div>
								<Switch
									checked={enableAudio}
									onChange={handleAudioToggleChange}
									color="rgba(16, 10, 66, 1)"
								/>
							</Flex>
						</div>
					</div>

					<div>
						{uploading ? (
							<Button
								fullWidth
								mt={20}
								disabled
								loading={true}
							>
								Uploading video..
							</Button>
						) : (
							<Button
								onClick={startCurrentScreenRecording}
								fullWidth
								mt={25}
								size="lg"
								radius={"12px"}
								color="rgba(16, 10, 66, 1)"
							>
								<Text size="16px">Start Recording</Text>
							</Button>
						)}
					</div>
				</Paper>
			</div>
		</MantineProvider>
	);
};

export default Popup;
