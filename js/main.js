// ========================================
// P2P FILE DROP
// MAIN APPLICATION
// PHASE 11
// ========================================

import { peerConnection, createDataChannel } from "./peer.js";

import {
  createOfferCode,
  createAnswerCode,
  setAnswerCode,
  encodeOfferForQR,
  decodeOfferFromQR,
} from "./signal.js";

import { sendText, sendFile, handleIncomingData } from "./file-transfer.js";

const generateOfferQRButton = document.getElementById("generate-offer-qr");

const offerQRContainer = document.getElementById("offer-qr");

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

// ========================================
// CHAT
// ========================================

const messageInput = document.getElementById("message-input");

const sendMessageButton = document.getElementById("send-message");

const messagesContainer = document.getElementById("messages");

// ========================================
// FILE TRANSFER
// ========================================

const sendFilesButton = document.getElementById("send-files");

const transferStatus = document.getElementById("transfer-status");

const transferProgress = document.getElementById("transfer-progress");

const transferSpeed = document.getElementById("transfer-speed");

const transferEta = document.getElementById("transfer-eta");

const receivedFilesContainer = document.getElementById("received-files");

const generateAnswerQRButton = document.getElementById("generate-answer-qr");

const answerQRContainer = document.getElementById("answer-qr");

// ========================================
// LOG
// ========================================

const connectionLog = document.getElementById("connection-log");

const scanOfferQRButton = document.getElementById("scan-offer-qr");

const qrReader = document.getElementById("qr-reader");

const scanAnswerQRButton = document.getElementById("scan-answer-qr");

const answerQRReader = document.getElementById("answer-qr-reader");

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
  if (bytes === 0 || !bytes || !Number.isFinite(bytes)) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];

  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  const safeIndex = Math.min(index, units.length - 1);

  return `${(bytes / Math.pow(1024, safeIndex)).toFixed(
    2,
  )} ${units[safeIndex]}`;
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

  let totalSize = 0;

  selectedFilesState.forEach((file, index) => {
    totalSize += file.size;

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
      addLog(`Removed file: ${file.name}`);
    });

    item.appendChild(info);
    item.appendChild(removeButton);
    list.appendChild(item);
  });

  selectedFilesContainer.appendChild(list);

  const totalSizeElement = document.createElement("div");
  totalSizeElement.className = "total-file-size";
  totalSizeElement.textContent = `Total: ${selectedFilesState.length} file(s) • ${formatBytes(totalSize)}`;

  selectedFilesContainer.appendChild(totalSizeElement);
}

// ========================================
// FILE INPUT
// ========================================

fileInput.addEventListener("change", () => {
  const newFiles = Array.from(fileInput.files);

  selectedFilesState = [...selectedFilesState, ...newFiles];

  renderSelectedFiles();

  addLog(
    `${newFiles.length} file(s) added. Total: ${selectedFilesState.length}`,
  );
});

// ========================================
// CREATE OFFER
// ========================================

createOfferButton.addEventListener("click", async () => {
  try {
    addLog("Creating offer...");

    updateConnectionStatus("Creating offer...");

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

generateOfferQRButton.addEventListener("click", async () => {
  const offer = peerConnection?.localDescription;

  if (!offer) {
    alert("Create Offer first.");
    return;
  }

  const offerCode = await encodeOfferForQR(offer);

  offerQRContainer.innerHTML = "";
  offerQRContainer.hidden = false;

  new QRCode(offerQRContainer, {
    text: offerCode,
    width: 320,
    height: 320,
    correctLevel: QRCode.CorrectLevel.L,
  });
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
// CREATE ANSWER - RECEIVER
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
// APPLY ANSWER
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
// ADD CHAT MESSAGE
// ========================================

function addMessage(text, sender) {
  const emptyMessage = messagesContainer.querySelector(".chat-empty");

  if (emptyMessage) {
    emptyMessage.remove();
  }

  const message = document.createElement("div");

  message.className = "chat-message";

  if (sender === "You") {
    message.classList.add("sent");
  } else {
    message.classList.add("received");
  }

  const senderElement = document.createElement("strong");

  senderElement.textContent = sender;

  const textElement = document.createElement("span");

  textElement.textContent = text;

  message.appendChild(senderElement);

  message.appendChild(textElement);

  messagesContainer.appendChild(message);

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ========================================
// SEND MESSAGE
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
// RECEIVE TEXT MESSAGE
// ========================================

window.addEventListener("p2p-text-message", (event) => {
  const text = event.detail;

  addMessage(text, "Peer");

  addLog("Message received.");
});

// ========================================
// SEND MULTIPLE FILES
// ========================================

sendFilesButton.addEventListener("click", async () => {
  if (selectedFilesState.length === 0) {
    alert("Please select at least one file.");

    return;
  }

  try {
    sendFilesButton.disabled = true;

    const totalFiles = selectedFilesState.length;

    addLog(`Starting transfer of ${totalFiles} file(s).`);

    for (let i = 0; i < selectedFilesState.length; i++) {
      const file = selectedFilesState[i];

      transferStatus.textContent = `Preparing file ${i + 1} of ${totalFiles}: ${file.name}`;

      transferProgress.value = 0;

      await sendFile(file);

      addLog(`File sent: ${file.name}`);
    }

    transferStatus.textContent = `All ${totalFiles} file(s) sent successfully.`;

    transferProgress.value = 100;

    transferSpeed.textContent = "Speed: Complete";

    transferEta.textContent = "ETA: 0s";
  } catch (error) {
    console.error(error);

    transferStatus.textContent = `Transfer failed: ${error.message}`;

    addLog(`File transfer error: ${error.message}`);
  } finally {
    sendFilesButton.disabled = false;
  }
});

// ========================================
// FILE HASH START
// ========================================

window.addEventListener("file-hash-start", (event) => {
  const data = event.detail;

  transferStatus.textContent = `Calculating SHA-256: ${data.fileName}`;

  transferSpeed.textContent = "Speed: calculating...";

  transferEta.textContent = "ETA: --";

  addLog(`Calculating SHA-256 for ${data.fileName}`);
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

  if (noFiles && noFiles.textContent.trim() === "No files received yet.") {
    noFiles.remove();
  }

  const wrapper = document.createElement("div");

  wrapper.className = "received-file-item";

  const fileInfo = document.createElement("div");

  fileInfo.className = "transfer-file-info";

  const name = document.createElement("strong");

  name.className = "transfer-file-name";

  name.textContent = data.fileName;

  const size = document.createElement("span");

  size.className = "transfer-file-size";

  size.textContent = formatBytes(data.fileSize);

  fileInfo.appendChild(name);

  fileInfo.appendChild(size);

  // ====================================
  // VERIFICATION STATUS
  // ====================================

  const verificationStatus = document.createElement("span");

  verificationStatus.className = "verification-status";

  if (data.verified) {
    verificationStatus.classList.add("verified");

    verificationStatus.textContent = "✓ File Verified";
  } else {
    verificationStatus.classList.add("failed");

    verificationStatus.textContent = "✗ Verification Failed";
  }

  fileInfo.appendChild(verificationStatus);

  // ====================================
  // DOWNLOAD
  // ====================================

  const download = document.createElement("a");

  download.href = data.downloadUrl;

  download.download = data.fileName;

  download.textContent = "Download";

  download.className = "download-link";

  // ====================================
  // ADD TO WRAPPER
  // ====================================

  wrapper.appendChild(fileInfo);

  wrapper.appendChild(download);

  receivedFilesContainer.appendChild(wrapper);

  // ====================================
  // LOG VERIFICATION
  // ====================================

  if (data.verified) {
    addLog(`✓ SHA-256 verified: ${data.fileName}`);
  } else {
    addLog(`✗ SHA-256 verification failed: ${data.fileName}`);
  }
}

// ========================================
// INTEGRITY RESULT
// ========================================

window.addEventListener("file-integrity-result", (event) => {
  const data = event.detail;

  if (data.verified) {
    addLog(`Integrity check passed for ${data.fileName}`);
  } else {
    addLog(`Integrity check FAILED for ${data.fileName}`);
  }
});

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

addLog("Phase 11: Multiple Files + Text Chat enabled.");

addLog("Waiting for WebRTC connection...");

scanOfferQRButton.addEventListener("click", async () => {
  qrReader.hidden = false;

  const scanner = new Html5Qrcode("qr-reader");

  try {
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 15,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
      },
      async (decodedText) => {
        console.log("QR detected:", decodedText);
        alert("QR DETECTED");
        try {
          const decodedOffer = await decodeOfferFromQR(decodedText);

          receivedOffer.value = decodedOffer;

          await scanner.stop();
          qrReader.hidden = true;

          addLog("QR Offer scanned successfully.");
          updateConnectionStatus("Offer scanned. Create Answer.");
        } catch (error) {
          console.error("QR decode failed:", error);
          alert("QR detected, but the Offer code is invalid.");

          await scanner.stop().catch(() => {});
          qrReader.hidden = true;
        }
      },
      () => {
        // Ignore temporary scan failures.
      },
    );
  } catch (error) {
    console.error("QR scanner error:", error);

    qrReader.hidden = true;

    alert(
      "Unable to access camera. Please allow camera permission or use manual copy-paste.",
    );
  }
});

generateAnswerQRButton.addEventListener("click", async () => {
  const answer = peerConnection?.localDescription;

  if (!answer) {
    alert("Create Answer first.");
    return;
  }

  const answerCode = await encodeOfferForQR(answer);

  answerQRContainer.innerHTML = "";
  answerQRContainer.hidden = false;

  new QRCode(answerQRContainer, {
    text: answerCode,
    width: 320,
    height: 320,
    correctLevel: QRCode.CorrectLevel.L,
  });
});

scanAnswerQRButton.addEventListener("click", async () => {
  answerQRReader.hidden = false;

  const scanner = new Html5Qrcode("answer-qr-reader");
  let isProcessingAnswer = false;

  try {
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250,
      },
      async (decodedText) => {
        if (isProcessingAnswer) {
          return;
        }

        isProcessingAnswer = true;

        try {
          const decodedAnswer = await decodeOfferFromQR(decodedText);

          await setAnswerCode(peerConnection, decodedAnswer);

          await scanner.stop();
          answerQRReader.hidden = true;

          console.log("QR Answer applied successfully.");
        } catch (error) {
          console.error("QR Answer failed:", error);
          alert("Error: " + error.message);

          await scanner.stop().catch(() => {});
          answerQRReader.hidden = true;

          alert(`Could not apply Answer QR: ${error.message}`);
        }
      },
    );
  } catch (error) {
    console.error("QR scanner error:", error);

    answerQRReader.hidden = true;

    alert(
      "Unable to access camera. Please allow camera permission or use manual copy-paste.",
    );
  }
});
