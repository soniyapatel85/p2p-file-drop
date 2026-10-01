// ========================================
// P2P FILE DROP
// MAIN JAVASCRIPT
// ========================================

import {
    peerConnection,
    getDataChannel,
    initDataChannel
} from "./peer.js";

import {
    createOfferCode,
    createAnswerCode,
    setAnswerCode
} from "./signal.js";

// ========================================
// 1. APPLICATION START
// ========================================

console.log("P2P File Drop application started");

// ========================================
// APPLICATION STATE
// ========================================

let selectedFilesState = [];

// ========================================
// 2. DOM ELEMENTS
// ========================================

const fileInput = document.getElementById("file-input");
const selectedFiles = document.getElementById("selected-files");
const createOfferButton = document.getElementById("create-offer");
const copyOfferButton = document.getElementById("copy-offer");
const createAnswerButton = document.getElementById("create-answer");
const copyAnswerButton = document.getElementById("copy-answer");
const offerCode = document.getElementById("offer-code");
const receivedOffer = document.getElementById("received-offer");
const answerCode = document.getElementById("answer-code");
const fileSummary = document.getElementById("file-summary");
const receivedAnswer = document.getElementById("received-answer");
const applyAnswerButton = document.getElementById("apply-answer");

// --- PHASE 4 DOM ELEMENTS ---
const messageInput = document.getElementById("message-input");
const sendMessageButton = document.getElementById("send-message");
const messagesContainer = document.getElementById("messages");

// ========================================
// 3. FILE SIZE FORMATTER
// ========================================

function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);
    return `${size.toFixed(2)} ${units[index]}`;
}

// ========================================
// 4. CHECK DUPLICATE FILE
// ========================================

function isDuplicateFile(file) {
    return selectedFilesState.some(function (existingFile) {
        return (
            existingFile.name === file.name &&
            existingFile.size === file.size &&
            existingFile.lastModified === file.lastModified
        );
    });
}

// ========================================
// 5. CALCULATE TOTAL FILE SIZE
// ========================================

function calculateTotalSize(files) {
    return files.reduce(function (total, file) {
        return total + file.size;
    }, 0);
}

// ========================================
// 6. RENDER FILE SUMMARY
// ========================================

function renderFileSummary() {
    if (!fileSummary) return;
    if (selectedFilesState.length === 0) {
        fileSummary.textContent = "";
        return;
    }
    const totalSize = calculateTotalSize(selectedFilesState);
    const totalFiles = selectedFilesState.length;
    fileSummary.textContent = `${totalFiles} file${totalFiles !== 1 ? "s" : ""} · ${formatFileSize(totalSize)}`;
}

// ========================================
// 7. RENDER SELECTED FILES
// ========================================

function renderSelectedFiles() {
    if (!selectedFiles) return;
    selectedFiles.innerHTML = "";

    if (selectedFilesState.length === 0) {
        const message = document.createElement("p");
        message.textContent = "No files selected.";
        selectedFiles.appendChild(message);
        renderFileSummary();
        return;
    }

    selectedFilesState.forEach(function (file, index) {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";

        const fileInfo = document.createElement("div");
        fileInfo.className = "file-info";

        const fileName = document.createElement("strong");
        fileName.textContent = file.name;

        const fileSize = document.createElement("span");
        fileSize.textContent = formatFileSize(file.size);

        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);

        const removeButton = document.createElement("button");
        removeButton.className = "remove-file";
        removeButton.textContent = "Remove";
        removeButton.dataset.index = index;

        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeButton);
        selectedFiles.appendChild(fileItem);
    });

    renderFileSummary();
}

// ========================================
// 8. REMOVE FILE EVENT
// ========================================

if (selectedFiles) {
    selectedFiles.addEventListener("click", function (event) {
        if (!event.target.classList.contains("remove-file")) return;
        const index = Number(event.target.dataset.index);
        selectedFilesState.splice(index, 1);
        console.log("File removed index:", index);
        renderSelectedFiles();
    });
}

// ========================================
// 9. FILE SELECTION EVENT
// ========================================

if (fileInput) {
    fileInput.addEventListener("change", function () {
        const newFiles = Array.from(fileInput.files);
        console.log("New files selected:", newFiles);

        newFiles.forEach(function (file) {
            if (!isDuplicateFile(file)) {
                selectedFilesState.push(file);
            }
        });

        renderSelectedFiles();
    });
}

// ========================================
// 10. WEBRTC SIGNALING HANDLERS
// ========================================

if (createOfferButton) {
    createOfferButton.addEventListener("click", async function () {
        try {
            // Sender side: offer banane se pehle data channel create karo
            initDataChannel();
            const code = await createOfferCode();
            if (offerCode) offerCode.value = code;
            console.log("Offer code generated successfully.");
        } catch (error) {
            console.error("Failed to create offer:", error);
        }
    });
}

if (copyOfferButton) {
    copyOfferButton.addEventListener("click", function () {
        if (offerCode && offerCode.value) {
            navigator.clipboard.writeText(offerCode.value);
            console.log("Offer code copied.");
        }
    });
}

if (createAnswerButton) {
    createAnswerButton.addEventListener("click", async function () {
        try {
            if (receivedOffer && receivedOffer.value) {
                const code = await createAnswerCode(receivedOffer.value);
                if (answerCode) answerCode.value = code;
                console.log("Answer code generated successfully.");
            } else {
                console.warn("Please paste an offer code first.");
            }
        } catch (error) {
            console.error("Failed to create answer:", error);
        }
    });
}

if (copyAnswerButton) {
    copyAnswerButton.addEventListener("click", function () {
        if (answerCode && answerCode.value) {
            navigator.clipboard.writeText(answerCode.value);
            console.log("Answer code copied.");
        }
    });
}

if (applyAnswerButton) {
    applyAnswerButton.addEventListener("click", async function () {
        try {
            if (receivedAnswer && receivedAnswer.value) {
                await setAnswerCode(receivedAnswer.value);
                console.log("Answer code applied successfully.");
            } else {
                console.warn("Please paste an answer code first.");
            }
        } catch (error) {
            console.error("Failed to apply answer:", error);
        }
    });
}

// ========================================
// 11. PHASE 4 — TEXT MESSAGING UI HANDLERS
// ========================================

function addMessage(text, sender) {
    if (!messagesContainer) return;

    const emptyMessage = messagesContainer.querySelector("p");
    if (emptyMessage && emptyMessage.textContent === "No messages yet.") {
        messagesContainer.innerHTML = "";
    }

    const messageElement = document.createElement("p");
    messageElement.textContent = `${sender}: ${text}`;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ---------- Send message ----------

if (sendMessageButton) {
    sendMessageButton.addEventListener("click", function () {
        const message = messageInput.value.trim();
        if (message === "") return;

        const channel = getDataChannel();

        if (!channel || channel.readyState !== "open") {
            console.log("Data channel is not open.");
            addMessage("Connection is not ready.", "System");
            return;
        }

        channel.send(message);
        addMessage(message, "You");
        messageInput.value = "";
        console.log("Message sent:", message);
    });
}

// ---------- Receive message ----------

window.addEventListener("p2p-message", function (event) {
    const message = event.detail.message;
    addMessage(message, "Peer");
    console.log("Peer message displayed:", message);
});

// ---------- Data channel status ----------

window.addEventListener("p2p-datachannel-open", function () {
    console.log("Main.js: Data channel is ready");
    addMessage("Peer-to-peer messaging is ready.", "System");
});

window.addEventListener("p2p-datachannel-close", function () {
    console.log("Main.js: Data channel closed");
    addMessage("Peer-to-peer connection closed.", "System");
});