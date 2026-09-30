// ========================================
// P2P FILE DROP
// MAIN JAVASCRIPT
// ========================================

import {
    peerConnection,
    dataChannel
} from "./peer.js";

import {
    createOfferCode,
    createAnswerCode,
    setAnswerCode
} from "./signal.js";

// ========================================
// 1. APPLICATION START
// ========================================

console.log(
    "P2P File Drop application started"
);

console.log(
    "Peer connection received in main.js:",
    peerConnection
);

console.log(
    "Data channel received in main.js:",
    dataChannel
);


// ========================================
// APPLICATION STATE
// ========================================

let selectedFilesState = [];


// ========================================
// 2. DOM ELEMENTS
// ========================================

const fileInput =
    document.getElementById("file-input");

const selectedFiles =
    document.getElementById("selected-files");

const createOfferButton =
    document.getElementById("create-offer");

const copyOfferButton =
    document.getElementById("copy-offer");

const createAnswerButton =
    document.getElementById("create-answer");

const copyAnswerButton =
    document.getElementById("copy-answer");

const offerCode =
    document.getElementById("offer-code");

const receivedOffer =
    document.getElementById("received-offer");

const answerCode =
    document.getElementById("answer-code");

const fileSummary =
    document.getElementById("file-summary");

const receivedAnswer =
    document.getElementById("received-answer");

const applyAnswerButton =
    document.getElementById("apply-answer");


// ========================================
// 3. DOM CONNECTION TEST
// ========================================

console.log(
    "File Input:",
    fileInput
);

console.log(
    "Selected Files Container:",
    selectedFiles
);

console.log(
    "Create Offer Button:",
    createOfferButton
);

console.log(
    "Copy Offer Button:",
    copyOfferButton
);

console.log(
    "Create Answer Button:",
    createAnswerButton
);

console.log(
    "Copy Answer Button:",
    copyAnswerButton
);

console.log(
    "Offer Code:",
    offerCode
);

console.log(
    "Received Offer:",
    receivedOffer
);

console.log(
    "Answer Code:",
    answerCode
);

console.log(
    "File Summary:",
    fileSummary
);


// ========================================
// 4. FILE SIZE FORMATTER
// ========================================

function formatFileSize(bytes) {

    if (bytes === 0) {
        return "0 Bytes";
    }

    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];

    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );

    const size =
        bytes /
        Math.pow(1024, index);

    return `${size.toFixed(2)} ${units[index]}`;
}


// ========================================
// 5. CHECK DUPLICATE FILE
// ========================================

function isDuplicateFile(file) {

    return selectedFilesState.some(
        function (existingFile) {

            return (
                existingFile.name === file.name &&
                existingFile.size === file.size &&
                existingFile.lastModified ===
                    file.lastModified
            );

        }
    );

}


// ========================================
// 6. CALCULATE TOTAL FILE SIZE
// ========================================

function calculateTotalSize(files) {

    return files.reduce(
        function (total, file) {

            return total + file.size;

        },
        0
    );

}


// ========================================
// 7. RENDER FILE SUMMARY
// ========================================

function renderFileSummary() {

    if (selectedFilesState.length === 0) {

        fileSummary.textContent = "";

        return;
    }

    const totalSize =
        calculateTotalSize(
            selectedFilesState
        );

    const totalFiles =
        selectedFilesState.length;

    fileSummary.textContent =
        `${totalFiles} file${totalFiles !== 1 ? "s" : ""} · ${formatFileSize(totalSize)}`;

}


// ========================================
// 8. RENDER SELECTED FILES
// ========================================

function renderSelectedFiles() {

    selectedFiles.innerHTML = "";


    // ------------------------------------
    // NO FILES
    // ------------------------------------

    if (selectedFilesState.length === 0) {

        const message =
            document.createElement("p");

        message.textContent =
            "No files selected.";

        selectedFiles.appendChild(
            message
        );

        renderFileSummary();

        return;
    }


    // ------------------------------------
    // RENDER EVERY FILE
    // ------------------------------------

    selectedFilesState.forEach(
        function (file, index) {

            const fileItem =
                document.createElement("div");

            fileItem.className =
                "file-item";


            // --------------------------------
            // FILE INFO
            // --------------------------------

            const fileInfo =
                document.createElement("div");

            fileInfo.className =
                "file-info";


            // --------------------------------
            // FILE NAME
            // --------------------------------

            const fileName =
                document.createElement("strong");

            fileName.textContent =
                file.name;


            // --------------------------------
            // FILE SIZE
            // --------------------------------

            const fileSize =
                document.createElement("span");

            fileSize.textContent =
                formatFileSize(file.size);


            // --------------------------------
            // ADD FILE INFO
            // --------------------------------

            fileInfo.appendChild(
                fileName
            );

            fileInfo.appendChild(
                fileSize
            );


            // --------------------------------
            // REMOVE BUTTON
            // --------------------------------

            const removeButton =
                document.createElement("button");

            removeButton.className =
                "remove-file";

            removeButton.textContent =
                "Remove";


            // Store file index
            removeButton.dataset.index =
                index;


            // --------------------------------
            // ADD ELEMENTS
            // --------------------------------

            fileItem.appendChild(
                fileInfo
            );

            fileItem.appendChild(
                removeButton
            );

            selectedFiles.appendChild(
                fileItem
            );

        }
    );


    // ------------------------------------
    // UPDATE SUMMARY
    // ------------------------------------

    renderFileSummary();

}


// ========================================
// 9. REMOVE FILE
// ========================================

selectedFiles.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.classList.contains(
                "remove-file"
            )
        ) {

            return;
        }


        const index =
            Number(
                event.target.dataset.index
            );


        // Remove selected file
        selectedFilesState.splice(
            index,
            1
        );


        console.log(
            "File removed:",
            index
        );


        // Re-render
        renderSelectedFiles();

    }
);


// ========================================
// 10. FILE SELECTION EVENT
// ========================================

fileInput.addEventListener(
    "change",
    function () {

        const newFiles =
            Array.from(
                fileInput.files
            );


        console.log(
            "New files selected:",
            newFiles
        );


        // Add files
        newFiles.forEach(
            function (file) {

                if (
                    !isDuplicateFile(file)
                ) {

                    selectedFilesState.push(
                        file
                    );

                } else {

                    console.log(
                        "Duplicate file skipped:",
                        file.name
                    );

                }

            }
        );


        console.log(
            "Selected files:",
            selectedFilesState
        );


        // Render
        renderSelectedFiles();


        // Reset input
        // This allows selecting the same
        // file again after removing it.
        fileInput.value = "";

    }
);


// ========================================
// 11. DATA CHANNEL STATE
// ========================================

dataChannel.addEventListener(
    "open",
    function () {

        console.log(
            "Main.js: Data channel is ready"
        );

    }
);


dataChannel.addEventListener(
    "close",
    function () {

        console.log(
            "Main.js: Data channel closed"
        );

    }
);


// ========================================
// 12. PEER CONNECTION STATE
// ========================================

peerConnection.addEventListener(
    "connectionstatechange",
    function () {

        console.log(
            "Main.js connection state:",
            peerConnection.connectionState
        );


        if (
            peerConnection.connectionState ===
            "connected"
        ) {

            console.log(
                "🎉 Peer connected successfully!"
            );

        }


        if (
            peerConnection.connectionState ===
            "disconnected"
        ) {

            console.log(
                "Peer disconnected."
            );

        }


        if (
            peerConnection.connectionState ===
            "failed"
        ) {

            console.log(
                "Peer connection failed."
            );

        }

    }
);


// ========================================
// 13. INITIAL RENDER
// ========================================

renderSelectedFiles();


// ========================================
// APPLICATION READY
// ========================================

console.log(
    "P2P File Drop is ready."
);


// ========================================
// CREATE OFFER
// ========================================

createOfferButton.addEventListener(
    "click",
    async function () {

        try {

            console.log("Create Offer clicked");

            const offer =
                await createOfferCode(
                    peerConnection
                );

            offerCode.value = offer;

            console.log(
                "Offer code generated."
            );

        } catch (error) {

            console.error(
                "Failed to create offer:",
                error
            );

        }

    }
);

// ========================================
// CREATE ANSWER
// ========================================

createAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            console.log(
                "Create Answer clicked"
            );

            const receivedOfferCode =
                receivedOffer.value.trim();

            // Check if offer is empty
            if (!receivedOfferCode) {

                console.log(
                    "No offer received."
                );

                return;
            }

            const answer =
                await createAnswerCode(
                    peerConnection,
                    receivedOfferCode
                );

            answerCode.value = answer;

            console.log(
                "Answer code generated."
            );

        } catch (error) {

            console.error(
                "Failed to create answer:",
                error
            );

        }

    }
);

// ========================================
// COPY OFFER
// ========================================

copyOfferButton.addEventListener(
    "click",
    async function () {

        if (!offerCode.value) {
            console.log("No offer code to copy.");
            return;
        }

        try {

            await navigator.clipboard.writeText(
                offerCode.value
            );

            copyOfferButton.textContent = "Copied!";

            setTimeout(function () {

                copyOfferButton.textContent =
                    "Copy Offer";

            }, 1500);

        } catch (error) {

            console.error(
                "Failed to copy offer:",
                error
            );

        }

    }
);
// ========================================
// COPY ANSWER
// ========================================

copyAnswerButton.addEventListener(
    "click",
    async function () {

        if (!answerCode.value) {
            console.log("No answer code to copy.");
            return;
        }

        try {

            await navigator.clipboard.writeText(
                answerCode.value
            );

            copyAnswerButton.textContent = "Copied!";

            setTimeout(function () {

                copyAnswerButton.textContent =
                    "Copy Answer";

            }, 1500);

        } catch (error) {

            console.error(
                "Failed to copy answer:",
                error
            );

        }

    }
);

// ========================================
// APPLY ANSWER / CONNECT
// ========================================

applyAnswerButton.addEventListener(
    "click",
    async function () {

        try {

            console.log("Connect button clicked.");

            const receivedAnswerCode =
                receivedAnswer.value.trim();

            if (!receivedAnswerCode) {
                console.log(
                    "Please paste the answer code first."
                );
                return;
            }

            await setAnswerCode(
                peerConnection,
                receivedAnswerCode
            );

            console.log(
                "Answer applied successfully."
            );

        } catch (error) {

            console.error(
                "Failed to apply answer:",
                error
            );

        }

    }
);