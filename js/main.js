// ========================================
// P2P FILE DROP
// MAIN APPLICATION
// ========================================

import { peerConnection, createDataChannel } from "./peer.js";

import { createOfferCode, createAnswerCode, setAnswerCode } from "./signal.js";

import { sendText, sendFile, handleIncomingData } from "./file-transfer.js";

// ========================================
// APPLICATION STATE
// ========================================

let selectedFilesState = [];

// ========================================
// DOM ELEMENTS
// ========================================

// Connection

const connectionStatus = document.getElementById("connection-status");

// Files

const fileInput = document.getElementById("file-input");

const selectedFilesContainer = document.getElementById("selected-files");

// Signaling

const createOfferButton = document.getElementById("create-offer");

const offerCode = document.getElementById("offer-code");

const copyOfferButton = document.getElementById("copy-offer");

const answerCode = document.getElementById("answer-code");

const applyAnswerButton = document.getElementById("create-answer");

const receivedOffer = document.getElementById("received-offer");

const createAnswerReceiverButton = document.getElementById(
  "create-answer-receiver",
);

const receiverAnswerCode = document.getElementById("receiver-answer-code");

const copyAnswerButton = document.getElementById("copy-answer");

// Messages

const messageInput = document.getElementById("message-input");

const sendMessageButton = document.getElementById("send-message");

const messagesContainer = document.getElementById("messages");

// File transfer

const sendFilesButton = document.getElementById("send-files");

const transferStatus = document.getElementById("transfer-status");

const transferProgress = document.getElementById("transfer-progress");

const transferSpeed = document.getElementById("transfer-speed");

const transferEta = document.getElementById("transfer-eta");

const receivedFilesContainer = document.getElementById("received-files");

// Log

const connectionLog = document.getElementById("connection-log");

// ========================================
// LOG FUNCTION
// ========================================

function addLog(message) {
  console.log(message);

  if (!connectionLog) {
    return;
  }

  const time = new Date().toLocaleTimeString();

  const paragraph = document.createElement("p");

  paragraph.textContent = `[${time}] ${message}`;

  connectionLog.appendChild(paragraph);

  connectionLog.scrollTop = connectionLog.scrollHeight;
}

// ========================================
// FORMAT BYTES
// ========================================

function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 Bytes";
  }

  if (!bytes) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];

  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

// ========================================
// FORMAT TIME
// ========================================

function formatTime(seconds) {
  if (!seconds || !Number.isFinite(seconds)) {
    return "--";
  }

  seconds = Math.max(0, Math.round(seconds));

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ` + `${minutes}m ` + `${remainingSeconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ` + `${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}

// ========================================
// CLIPBOARD
// ========================================

async function copyToClipboard(text) {
  if (!text) {
    throw new Error("Nothing to copy.");
  }

  await navigator.clipboard.writeText(text);
}

// ========================================
// CONNECTION STATUS
// ========================================

function updateConnectionStatus(message, type = "") {
  if (!connectionStatus) {
    return;
  }

  connectionStatus.textContent = message;

  connectionStatus.className = "status-box";

  if (type) {
    connectionStatus.classList.add(type);
  }
}

// ========================================
// RENDER SELECTED FILES
// ========================================

function renderSelectedFiles() {
  selectedFilesContainer.innerHTML = "";

  if (selectedFilesState.length === 0) {
    selectedFilesContainer.innerHTML = "<p>No files selected.</p>";

    return;
  }

  const list = document.createElement("div");

  list.className = "selected-file-list";

  selectedFilesState.forEach((file, index) => {
    const item = document.createElement("div");

    item.className = "selected-file-item";

    const info = document.createElement("div");

    info.className = "selected-file-info";

    const name = document.createElement("strong");

    name.textContent = file.name;

    const size = document.createElement("span");

    size.textContent = formatBytes(file.size);

    info.appendChild(name);

    info.appendChild(size);

    const removeButton = document.createElement("button");

    removeButton.type = "button";

    removeButton.textContent = "Remove";

    removeButton.addEventListener("click", () => {
      selectedFilesState.splice(index, 1);

      renderSelectedFiles();
    });

    item.appendChild(info);

    item.appendChild(removeButton);

    list.appendChild(item);
  });

  selectedFilesContainer.appendChild(list);
}

// ========================================
// FILE INPUT
// ========================================

fileInput.addEventListener("change", () => {
  selectedFilesState = Array.from(fileInput.files);

  renderSelectedFiles();

  addLog(`${selectedFilesState.length} file(s) selected.`);
});

// ========================================
// CREATE OFFER
// ========================================

createOfferButton.addEventListener("click", async () => {
  try {
    addLog("Creating offer...");

    updateConnectionStatus("Creating offer...");

    // Create DataChannel BEFORE offer

    createDataChannel();

    const offer = await createOfferCode(peerConnection);

    offerCode.value = offer;

    addLog("Offer created successfully.");

    updateConnectionStatus("Offer created. Send it to receiver.");
  } catch (error) {
    console.error(error);

    addLog(`Offer error: ${error.message}`);

    updateConnectionStatus("Failed to create offer.", "error");
  }
});

// ========================================
// COPY OFFER
// ========================================

copyOfferButton.addEventListener("click", async () => {
  try {
    await copyToClipboard(offerCode.value);

    addLog("Offer copied to clipboard.");

    copyOfferButton.textContent = "Copied!";

    setTimeout(() => {
      copyOfferButton.textContent = "Copy Offer";
    }, 1500);
  } catch (error) {
    alert(error.message);
  }
});

// ========================================
// CREATE ANSWER ON RECEIVER
// ========================================

createAnswerReceiverButton.addEventListener("click", async () => {
  try {
    const offer = receivedOffer.value.trim();

    if (!offer) {
      alert("Please paste the sender's offer first.");

      return;
    }

    addLog("Creating answer...");

    updateConnectionStatus("Creating answer...");

    const answer = await createAnswerCode(peerConnection, offer);

    receiverAnswerCode.value = answer;

    addLog("Answer created successfully.");

    updateConnectionStatus("Answer created. Send it to sender.");
  } catch (error) {
    console.error(error);

    addLog(`Answer error: ${error.message}`);

    updateConnectionStatus("Failed to create answer.", "error");
  }
});

// ========================================
// COPY ANSWER
// ========================================

copyAnswerButton.addEventListener("click", async () => {
  try {
    await copyToClipboard(receiverAnswerCode.value);

    addLog("Answer copied to clipboard.");

    copyAnswerButton.textContent = "Copied!";

    setTimeout(() => {
      copyAnswerButton.textContent = "Copy Answer";
    }, 1500);
  } catch (error) {
    alert(error.message);
  }
});

// ========================================
// APPLY ANSWER ON SENDER
// ========================================

applyAnswerButton.addEventListener("click", async () => {
  try {
    const answer = answerCode.value.trim();

    if (!answer) {
      alert("Please paste the receiver's answer first.");

      return;
    }

    addLog("Applying receiver answer...");

    updateConnectionStatus("Connecting...");

    await setAnswerCode(peerConnection, answer);

    applyAnswerButton.disabled = true;
    addLog("Receiver answer applied successfully.");

    updateConnectionStatus("Answer applied. Waiting for connection...");
  } catch (error) {
    console.error(error);

    addLog(`Apply answer error: ${error.message}`);

    updateConnectionStatus("Failed to apply answer.", "error");
  }
});

// ========================================
// PEER CONNECTION STATE
// ========================================

peerConnection.addEventListener("connectionstatechange", () => {
  const state = peerConnection.connectionState;

  addLog(`Peer connection state: ${state}`);

  switch (state) {
    case "new":
      updateConnectionStatus("Connection starting...");

      break;

    case "connecting":
      updateConnectionStatus("Connecting...");

      break;

    case "connected":
      updateConnectionStatus("Connected ✓", "connected");

      break;

    case "disconnected":
      updateConnectionStatus("Disconnected", "warning");

      break;

    case "failed":
      updateConnectionStatus("Connection failed", "error");

      break;

    case "closed":
      updateConnectionStatus("Connection closed", "warning");

      break;
  }
});

// ========================================
// DATA CHANNEL OPEN
// ========================================

window.addEventListener("p2p-datachannel-open", () => {
  addLog("DataChannel opened successfully.");

  updateConnectionStatus("Connected ✓", "connected");

  transferStatus.textContent = "Ready for file transfer.";

  addLog("You can now send messages and files.");
});

// ========================================
// DATA CHANNEL CLOSE
// ========================================

window.addEventListener("p2p-datachannel-close", () => {
  addLog("DataChannel closed.");

  updateConnectionStatus("Connection closed", "warning");

  transferStatus.textContent = "Connection closed.";
});

// ========================================
// DATA CHANNEL ERROR
// ========================================

window.addEventListener("p2p-datachannel-error", (event) => {
  console.error(event.detail);

  addLog("DataChannel error occurred.");
});

// ========================================
// INCOMING DATA
// ========================================

window.addEventListener("p2p-datachannel-message", async (event) => {
  await handleIncomingData(event.detail);
});

// ========================================
// SEND TEXT MESSAGE
// ========================================

function sendCurrentMessage() {
  const text = messageInput.value.trim();

  if (!text) {
    return;
  }

  try {
    const success = sendText(text);

    if (!success) {
      return;
    }

    addMessage(text, "You");

    messageInput.value = "";

    addLog("Message sent.");
  } catch (error) {
    alert(error.message);
  }
}

// ========================================
// SEND MESSAGE BUTTON
// ========================================

sendMessageButton.addEventListener("click", sendCurrentMessage);

// ========================================
// ENTER TO SEND
// ========================================

messageInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    sendCurrentMessage();
  }
});

// ========================================
// ADD MESSAGE TO UI
// ========================================

function addMessage(text, sender) {
  const noMessages = messagesContainer.querySelector("p");

  if (noMessages && noMessages.textContent === "No messages yet.") {
    noMessages.remove();
  }

  const message = document.createElement("div");

  message.className = "message-item";

  const senderElement = document.createElement("strong");

  senderElement.textContent = `${sender}: `;

  const textElement = document.createElement("span");

  textElement.textContent = text;

  message.appendChild(senderElement);

  message.appendChild(textElement);

  messagesContainer.appendChild(message);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ========================================
// RECEIVE TEXT MESSAGE
// ========================================

window.addEventListener("p2p-text-message", (event) => {
  const text = event.detail;

  addMessage(text, "Peer");

  addLog("Message received.");
});

// ========================================
// SEND SELECTED FILES
// ========================================

sendFilesButton.addEventListener("click", async () => {
  if (selectedFilesState.length === 0) {
    alert("Please select at least one file.");

    return;
  }

  try {
    sendFilesButton.disabled = true;

    for (const file of selectedFilesState) {
      transferStatus.textContent = `Sending ${file.name}...`;

      await sendFile(file);

      addLog(`File sent: ${file.name}`);
    }

    transferStatus.textContent = "All selected files sent successfully.";

    transferProgress.value = 100;

    transferSpeed.textContent = "Speed: --";

    transferEta.textContent = "ETA: --";
  } catch (error) {
    console.error(error);

    transferStatus.textContent = `Transfer failed: ${error.message}`;

    addLog(`File transfer error: ${error.message}`);
  } finally {
    sendFilesButton.disabled = false;
  }
});

// ========================================
// FILE SEND START
// ========================================

window.addEventListener("file-send-start", (event) => {
  const data = event.detail;

  transferStatus.textContent = `Sending: ${data.fileName}`;

  transferProgress.value = 0;

  transferSpeed.textContent = "Speed: calculating...";

  transferEta.textContent = "ETA: calculating...";

  addLog(`Starting file transfer: ${data.fileName}`);
});

// ========================================
// FILE SEND PROGRESS
// ========================================

window.addEventListener("file-send-progress", (event) => {
  const data = event.detail;

  transferProgress.value = data.progress;

  transferStatus.textContent =
    `Sending ${data.fileName} - ` + `${data.progress.toFixed(1)}%`;

  transferSpeed.textContent = `Speed: ${formatBytes(data.speed)}/s`;

  transferEta.textContent = `ETA: ${formatTime(data.eta)}`;
});

// ========================================
// FILE SEND COMPLETE
// ========================================

window.addEventListener("file-send-complete", (event) => {
  const data = event.detail;

  transferProgress.value = 100;

  transferStatus.textContent = `Sent: ${data.fileName}`;

  transferSpeed.textContent = "Speed: Complete";

  transferEta.textContent = "ETA: 0s";

  addLog(`File transfer completed: ${data.fileName}`);
});

// ========================================
// FILE RECEIVE START
// ========================================

window.addEventListener("file-receive-start", (event) => {
  const data = event.detail;

  transferStatus.textContent = `Receiving: ${data.fileName}`;

  transferProgress.value = 0;

  transferSpeed.textContent = "Speed: calculating...";

  transferEta.textContent = "ETA: calculating...";

  addLog(`Receiving file: ${data.fileName}`);
});

// ========================================
// FILE RECEIVE PROGRESS
// ========================================

window.addEventListener("file-receive-progress", (event) => {
  const data = event.detail;

  transferProgress.value = data.progress;

  transferStatus.textContent =
    `Receiving ${data.fileName} - ` + `${data.progress.toFixed(1)}%`;

  transferSpeed.textContent = `Speed: ${formatBytes(data.speed)}/s`;

  transferEta.textContent = `ETA: ${formatTime(data.eta)}`;
});

// ========================================
// FILE RECEIVE COMPLETE
// ========================================

window.addEventListener("file-receive-complete", (event) => {
  const data = event.detail;

  transferProgress.value = 100;

  transferStatus.textContent = `Received: ${data.fileName}`;

  transferSpeed.textContent = "Speed: Complete";

  transferEta.textContent = "ETA: 0s";

  addReceivedFile(data);

  addLog(`File received: ${data.fileName}`);
});

// ========================================
// ADD RECEIVED FILE
// ========================================

function addReceivedFile(data) {
  const noFiles = receivedFilesContainer.querySelector("p");

  if (noFiles && noFiles.textContent === "No files received yet.") {
    noFiles.remove();
  }

  const wrapper = document.createElement("div");

  wrapper.className = "received-file-item";

  const name = document.createElement("strong");

  name.textContent = data.fileName;

  const size = document.createElement("span");

  size.textContent = formatBytes(data.fileSize);

  const download = document.createElement("a");

  download.href = data.downloadUrl;

  download.download = data.fileName;

  download.textContent = "Download";

  download.className = "download-link";

  const verificationStatus = document.createElement("span");

  verificationStatus.textContent = data.verified
    ? "✓ File Verified"
    : "✗ Integrity Check Failed";

  verificationStatus.className = data.verified
    ? "file-verified"
    : "file-verification-failed";

  fileItem.appendChild(verificationStatus);

  wrapper.appendChild(name);

  wrapper.appendChild(size);

  wrapper.appendChild(download);

  receivedFilesContainer.appendChild(wrapper);
}

// ========================================
// TRANSFER ERROR
// ========================================

window.addEventListener("p2p-transfer-error", (event) => {
  const message = event.detail || "Unknown transfer error";

  transferStatus.textContent = `Error: ${message}`;

  addLog(`Transfer error: ${message}`);
});

// ========================================
// INITIAL LOG
// ========================================

addLog("P2P File Drop loaded.");

addLog("Waiting for WebRTC connection...");
