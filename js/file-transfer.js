import { getDataChannel } from "./peer.js";

// ========================================
// CONFIGURATION
// ========================================

const CHUNK_SIZE = 16 * 1024;

// Maximum amount of data allowed to remain
// buffered inside the DataChannel.
const MAX_BUFFERED_AMOUNT = 1024 * 1024;

// When buffer comes below this value,
// sending can safely continue.
const LOW_BUFFERED_AMOUNT = 256 * 1024;


// ========================================
// MESSAGE TYPES
// ========================================

const MESSAGE_TYPES = {
    TEXT: "text",
    FILE_START: "file-start",
    FILE_CHUNK: "file-chunk",
    FILE_END: "file-end",
    ERROR: "error"
};


// ========================================
// RECEIVING FILE STATE
// ========================================

let receivingFile = null;


// ========================================
// SEND CONTROL MESSAGE
// ========================================

function sendControlMessage(message) {

    const channel = getDataChannel();

    if (!channel) {
        throw new Error("DataChannel does not exist.");
    }

    if (channel.readyState !== "open") {
        throw new Error("DataChannel is not open.");
    }

    channel.send(JSON.stringify(message));
}


// ========================================
// WAIT FOR BUFFER TO BECOME LOW
// ========================================

function waitForBuffer(channel) {

    return new Promise((resolve, reject) => {

        // Already safe to continue
        if (channel.bufferedAmount <= LOW_BUFFERED_AMOUNT) {
            resolve();
            return;
        }

        channel.bufferedAmountLowThreshold = LOW_BUFFERED_AMOUNT;

        const handleLowBuffer = () => {

            channel.removeEventListener(
                "bufferedamountlow",
                handleLowBuffer
            );

            resolve();
        };

        const handleClose = () => {

            channel.removeEventListener(
                "bufferedamountlow",
                handleLowBuffer
            );

            reject(new Error("DataChannel closed while waiting for buffer."));
        };

        channel.addEventListener(
            "bufferedamountlow",
            handleLowBuffer
        );

        channel.addEventListener(
            "close",
            handleClose,
            { once: true }
        );
    });
}


// ========================================
// SEND TEXT
// ========================================

export function sendText(text) {

    if (!text || !text.trim()) {
        return false;
    }

    try {

        sendControlMessage({
            type: MESSAGE_TYPES.TEXT,
            text: text.trim(),
            timestamp: Date.now()
        });

        return true;

    } catch (error) {

        console.error("Text send error:", error);

        window.dispatchEvent(
            new CustomEvent("p2p-transfer-error", {
                detail: error.message
            })
        );

        return false;
    }
}


// ========================================
// SEND FILE
// ========================================

export async function sendFile(file) {

    const channel = getDataChannel();

    if (!channel) {
        throw new Error("DataChannel not available.");
    }

    if (channel.readyState !== "open") {
        throw new Error("DataChannel is not open.");
    }

    if (!file) {
        throw new Error("No file selected.");
    }


    console.log("Sending file:", file.name);


    // ========================================
    // FILE INFORMATION
    // ========================================

    const fileId =
        `${Date.now()}-${Math.random().toString(36).substring(2)}`;

    const totalChunks =
        Math.ceil(file.size / CHUNK_SIZE);


    // ========================================
    // FILE START MESSAGE
    // ========================================

    sendControlMessage({

        type: MESSAGE_TYPES.FILE_START,

        fileId,

        name: file.name,

        size: file.size,

        mimeType:
            file.type || "application/octet-stream",

        totalChunks
    });


    window.dispatchEvent(
        new CustomEvent("file-send-start", {

            detail: {

                fileName: file.name,

                fileSize: file.size,

                totalChunks
            }
        })
    );


    // ========================================
    // START TRANSFER
    // ========================================

    const startTime = performance.now();

    let offset = 0;

    let chunkIndex = 0;


    while (offset < file.size) {


        // ====================================
        // CONNECTION CHECK
        // ====================================

        if (channel.readyState !== "open") {

            throw new Error(
                "DataChannel closed during transfer."
            );
        }


        // ====================================
        // BACKPRESSURE
        // ====================================

        if (channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {

            console.log(
                "Buffer full. Pausing transmission..."
            );

            window.dispatchEvent(
                new CustomEvent("p2p-backpressure", {

                    detail: {

                        bufferedAmount:
                            channel.bufferedAmount,

                        status: "paused"
                    }
                })
            );


            // Wait until browser buffer becomes low
            await waitForBuffer(channel);


            console.log(
                "Buffer available. Resuming transmission..."
            );

            window.dispatchEvent(
                new CustomEvent("p2p-backpressure", {

                    detail: {

                        bufferedAmount:
                            channel.bufferedAmount,

                        status: "resumed"
                    }
                })
            );
        }


        // ====================================
        // CREATE CHUNK
        // ====================================

        const chunk =
            file.slice(
                offset,
                offset + CHUNK_SIZE
            );


        const arrayBuffer =
            await chunk.arrayBuffer();


        // ====================================
        // SEND CHUNK
        // ====================================

        channel.send(arrayBuffer);


        // ====================================
        // UPDATE POSITION
        // ====================================

        offset += arrayBuffer.byteLength;

        chunkIndex++;


        // ====================================
        // TRANSFER STATISTICS
        // ====================================

        const elapsed =
            (performance.now() - startTime) / 1000;


        const speed =
            elapsed > 0
                ? offset / elapsed
                : 0;


        const remaining =
            file.size - offset;


        const eta =
            speed > 0
                ? remaining / speed
                : 0;


        const progress =
            file.size > 0
                ? (offset / file.size) * 100
                : 100;


        // ====================================
        // SEND PROGRESS EVENT
        // ====================================

        window.dispatchEvent(
            new CustomEvent("file-send-progress", {

                detail: {

                    fileName: file.name,

                    fileSize: file.size,

                    bytesSent: offset,

                    progress,

                    speed,

                    eta,

                    chunkIndex,

                    totalChunks,

                    bufferedAmount:
                        channel.bufferedAmount
                }
            })
        );
    }


    // ========================================
    // FILE END MESSAGE
    // ========================================

    sendControlMessage({

        type: MESSAGE_TYPES.FILE_END,

        fileId,

        name: file.name,

        size: file.size
    });


    // ========================================
    // COMPLETE EVENT
    // ========================================

    window.dispatchEvent(
        new CustomEvent("file-send-complete", {

            detail: {

                fileName: file.name,

                fileSize: file.size
            }
        })
    );


    console.log(
        "File sent successfully:",
        file.name
    );
}


// ========================================
// HANDLE INCOMING DATA
// ========================================

export async function handleIncomingData(data) {

    try {

        // Binary chunk
        if (data instanceof ArrayBuffer) {

            handleBinaryChunk(data);

            return;
        }


        // Blob
        if (data instanceof Blob) {

            const arrayBuffer =
                await data.arrayBuffer();

            handleBinaryChunk(arrayBuffer);

            return;
        }


        // Control message
        if (typeof data === "string") {

            let message;

            try {

                message =
                    JSON.parse(data);

            } catch {

                console.warn(
                    "Received non-JSON message:",
                    data
                );

                return;
            }

            handleControlMessage(message);
        }

    } catch (error) {

        console.error(
            "Incoming data error:",
            error
        );

        window.dispatchEvent(
            new CustomEvent("p2p-transfer-error", {

                detail: error.message
            })
        );
    }
}


// ========================================
// HANDLE CONTROL MESSAGE
// ========================================

function handleControlMessage(message) {

    if (!message || !message.type) {
        return;
    }


    switch (message.type) {

        case MESSAGE_TYPES.TEXT:

            window.dispatchEvent(
                new CustomEvent(
                    "p2p-text-message",
                    {
                        detail: message.text
                    }
                )
            );

            break;


        case MESSAGE_TYPES.FILE_START:

            startReceivingFile(message);

            break;


        case MESSAGE_TYPES.FILE_END:

            finishReceivingFile(message);

            break;


        case MESSAGE_TYPES.ERROR:

            console.error(
                "Remote error:",
                message.message
            );

            break;


        default:

            console.warn(
                "Unknown message type:",
                message.type
            );
    }
}


// ========================================
// START RECEIVING FILE
// ========================================

function startReceivingFile(message) {

    console.log(
        "Receiving file:",
        message.name
    );


    receivingFile = {

        fileId: message.fileId,

        name: message.name,

        size: message.size,

        mimeType: message.mimeType,

        totalChunks: message.totalChunks,

        receivedChunks: [],

        receivedBytes: 0,

        chunkIndex: 0,

        startTime: performance.now()
    };


    window.dispatchEvent(
        new CustomEvent("file-receive-start", {

            detail: {

                fileName: message.name,

                fileSize: message.size,

                totalChunks:
                    message.totalChunks
            }
        })
    );
}


// ========================================
// HANDLE BINARY CHUNK
// ========================================

function handleBinaryChunk(data) {

    if (!receivingFile) {

        console.warn(
            "Received binary data but no file is active."
        );

        return;
    }


    receivingFile.receivedChunks.push(data);

    receivingFile.receivedBytes +=
        data.byteLength;

    receivingFile.chunkIndex++;


    // ======================================
    // RECEIVE STATISTICS
    // ======================================

    const elapsed =
        (performance.now() -
            receivingFile.startTime) / 1000;


    const speed =
        elapsed > 0
            ? receivingFile.receivedBytes / elapsed
            : 0;


    const remaining =
        receivingFile.size -
        receivingFile.receivedBytes;


    const eta =
        speed > 0
            ? remaining / speed
            : 0;


    const progress =
        receivingFile.size > 0
            ? (
                receivingFile.receivedBytes /
                receivingFile.size
            ) * 100
            : 100;


    // ======================================
    // RECEIVE PROGRESS
    // ======================================

    window.dispatchEvent(
        new CustomEvent(
            "file-receive-progress",
            {

                detail: {

                    fileName:
                        receivingFile.name,

                    fileSize:
                        receivingFile.size,

                    bytesReceived:
                        receivingFile.receivedBytes,

                    progress,

                    speed,

                    eta,

                    chunkIndex:
                        receivingFile.chunkIndex,

                    totalChunks:
                        receivingFile.totalChunks
                }
            }
        )
    );
}


// ========================================
// FINISH RECEIVING FILE
// ========================================

function finishReceivingFile(message) {

    if (!receivingFile) {

        console.warn(
            "File end received but no file is active."
        );

        return;
    }


    console.log(
        "Reassembling file:",
        receivingFile.name
    );


    // ========================================
    // CREATE FINAL BLOB
    // ========================================

    const blob =
        new Blob(
            receivingFile.receivedChunks,
            {
                type: receivingFile.mimeType
            }
        );


    // ========================================
    // CREATE DOWNLOAD URL
    // ========================================

    const downloadUrl =
        URL.createObjectURL(blob);


    // ========================================
    // COMPLETE EVENT
    // ========================================

    window.dispatchEvent(
        new CustomEvent(
            "file-receive-complete",
            {

                detail: {

                    fileName:
                        receivingFile.name,

                    fileSize:
                        receivingFile.size,

                    blob,

                    downloadUrl
                }
            }
        )
    );


    console.log(
        "File received successfully:",
        receivingFile.name
    );


    // Reset receiving state
    receivingFile = null;
}