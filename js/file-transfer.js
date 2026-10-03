import { getDataChannel } from "./peer.js";

import {
    calculateSHA256,
    compareHashes
} from "./integrity.js";


// ========================================
// CONFIGURATION
// ========================================

const CHUNK_SIZE = 16 * 1024;

const MAX_BUFFERED_AMOUNT = 1024 * 1024;

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

        throw new Error(
            "DataChannel does not exist."
        );

    }


    if (channel.readyState !== "open") {

        throw new Error(
            "DataChannel is not open."
        );

    }


    channel.send(
        JSON.stringify(message)
    );

}


// ========================================
// WAIT FOR BUFFER
// ========================================

function waitForBuffer(channel) {

    return new Promise(
        (resolve, reject) => {

            if (
                channel.bufferedAmount <=
                LOW_BUFFERED_AMOUNT
            ) {

                resolve();

                return;

            }


            channel.bufferedAmountLowThreshold =
                LOW_BUFFERED_AMOUNT;


            const handleLowBuffer = () => {

                channel.removeEventListener(
                    "bufferedamountlow",
                    handleLowBuffer
                );

                channel.removeEventListener(
                    "close",
                    handleClose
                );

                resolve();

            };


            const handleClose = () => {

                channel.removeEventListener(
                    "bufferedamountlow",
                    handleLowBuffer
                );

                reject(
                    new Error(
                        "DataChannel closed while waiting for buffer."
                    )
                );

            };


            channel.addEventListener(
                "bufferedamountlow",
                handleLowBuffer
            );


            channel.addEventListener(
                "close",
                handleClose,
                {
                    once: true
                }
            );

        }
    );

}


// ========================================
// SEND TEXT
// ========================================

export function sendText(text) {

    if (
        !text ||
        !text.trim()
    ) {

        return false;

    }


    try {

        sendControlMessage({

            type:
                MESSAGE_TYPES.TEXT,

            text:
                text.trim(),

            timestamp:
                Date.now()

        });


        return true;

    }

    catch (error) {

        console.error(
            "Text send error:",
            error
        );


        window.dispatchEvent(
            new CustomEvent(
                "p2p-transfer-error",
                {
                    detail:
                        error.message
                }
            )
        );


        return false;

    }

}


// ========================================
// SEND FILE
// ========================================

export async function sendFile(file) {

    const channel =
        getDataChannel();


    if (!channel) {

        throw new Error(
            "DataChannel not available."
        );

    }


    if (
        channel.readyState !==
        "open"
    ) {

        throw new Error(
            "DataChannel is not open."
        );

    }


    if (!file) {

        throw new Error(
            "No file selected."
        );

    }


    console.log(
        "Preparing file:",
        file.name
    );


    // ====================================
    // FILE ID
    // ====================================

    const fileId =
        `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}`;


    const totalChunks =
        Math.ceil(
            file.size /
            CHUNK_SIZE
        );


    // ====================================
    // CALCULATE SHA-256
    // ====================================

    window.dispatchEvent(
        new CustomEvent(
            "file-hash-start",
            {
                detail: {
                    fileName:
                        file.name
                }
            }
        )
    );


    const fileHash =
        await calculateSHA256(
            file
        );


    console.log(
        "SHA-256:",
        fileHash
    );


    // ====================================
    // FILE START
    // ====================================

    sendControlMessage({

        type:
            MESSAGE_TYPES.FILE_START,

        fileId,

        name:
            file.name,

        size:
            file.size,

        mimeType:
            file.type ||
            "application/octet-stream",

        totalChunks,

        sha256:
            fileHash

    });


    window.dispatchEvent(
        new CustomEvent(
            "file-send-start",
            {
                detail: {

                    fileName:
                        file.name,

                    fileSize:
                        file.size,

                    totalChunks,

                    sha256:
                        fileHash

                }
            }
        )
    );


    // ====================================
    // TRANSFER
    // ====================================

    const startTime =
        performance.now();


    let offset = 0;

    let chunkIndex = 0;


    while (
        offset <
        file.size
    ) {

        // ================================
        // CONNECTION CHECK
        // ================================

        if (
            channel.readyState !==
            "open"
        ) {

            throw new Error(
                "DataChannel closed during transfer."
            );

        }


        // ================================
        // BACKPRESSURE
        // ================================

        if (
            channel.bufferedAmount >
            MAX_BUFFERED_AMOUNT
        ) {

            window.dispatchEvent(
                new CustomEvent(
                    "p2p-backpressure",
                    {
                        detail: {

                            bufferedAmount:
                                channel.bufferedAmount,

                            status:
                                "paused"

                        }
                    }
                )
            );


            await waitForBuffer(
                channel
            );


            window.dispatchEvent(
                new CustomEvent(
                    "p2p-backpressure",
                    {
                        detail: {

                            bufferedAmount:
                                channel.bufferedAmount,

                            status:
                                "resumed"

                        }
                    }
                )
            );

        }


        // ================================
        // CREATE CHUNK
        // ================================

        const chunk =
            file.slice(
                offset,
                offset +
                CHUNK_SIZE
            );


        const arrayBuffer =
            await chunk.arrayBuffer();


        // ================================
        // SEND CHUNK
        // ================================

        channel.send(
            arrayBuffer
        );


        // ================================
        // UPDATE POSITION
        // ================================

        offset +=
            arrayBuffer.byteLength;


        chunkIndex++;


        // ================================
        // STATISTICS
        // ================================

        const elapsed =
            (
                performance.now() -
                startTime
            ) / 1000;


        const speed =
            elapsed > 0
                ? offset / elapsed
                : 0;


        const remaining =
            file.size -
            offset;


        const eta =
            speed > 0
                ? remaining / speed
                : 0;


        const progress =
            file.size > 0
                ? (
                    offset /
                    file.size
                ) * 100
                : 100;


        // ================================
        // PROGRESS EVENT
        // ================================

        window.dispatchEvent(
            new CustomEvent(
                "file-send-progress",
                {
                    detail: {

                        fileName:
                            file.name,

                        fileSize:
                            file.size,

                        bytesSent:
                            offset,

                        progress,

                        speed,

                        eta,

                        chunkIndex,

                        totalChunks,

                        bufferedAmount:
                            channel.bufferedAmount

                    }
                }
            )
        );

    }


    // ====================================
    // FILE END
    // ====================================

    sendControlMessage({

        type:
            MESSAGE_TYPES.FILE_END,

        fileId,

        name:
            file.name,

        size:
            file.size,

        sha256:
            fileHash

    });


    // ====================================
    // COMPLETE
    // ====================================

    window.dispatchEvent(
        new CustomEvent(
            "file-send-complete",
            {
                detail: {

                    fileName:
                        file.name,

                    fileSize:
                        file.size,

                    sha256:
                        fileHash

                }
            }
        )
    );


    console.log(
        "File sent successfully:",
        file.name
    );

}


// ========================================
// HANDLE INCOMING DATA
// ========================================

export async function handleIncomingData(
    data
) {

    try {

        // =================================
        // ARRAY BUFFER
        // =================================

        if (
            data instanceof ArrayBuffer
        ) {

            handleBinaryChunk(
                data
            );

            return;

        }


        // =================================
        // BLOB
        // =================================

        if (
            data instanceof Blob
        ) {

            const arrayBuffer =
                await data.arrayBuffer();


            handleBinaryChunk(
                arrayBuffer
            );


            return;

        }


        // =================================
        // CONTROL MESSAGE
        // =================================

        if (
            typeof data ===
            "string"
        ) {

            let message;


            try {

                message =
                    JSON.parse(data);

            }

            catch {

                console.warn(
                    "Received non-JSON message:",
                    data
                );


                return;

            }


            handleControlMessage(
                message
            );

        }

    }

    catch (error) {

        console.error(
            "Incoming data error:",
            error
        );


        window.dispatchEvent(
            new CustomEvent(
                "p2p-transfer-error",
                {
                    detail:
                        error.message
                }
            )
        );

    }

}


// ========================================
// HANDLE CONTROL MESSAGE
// ========================================

function handleControlMessage(
    message
) {

    if (
        !message ||
        !message.type
    ) {

        return;

    }


    switch (
        message.type
    ) {

        // ================================
        // TEXT
        // ================================

        case MESSAGE_TYPES.TEXT:

            window.dispatchEvent(
                new CustomEvent(
                    "p2p-text-message",
                    {
                        detail:
                            message.text
                    }
                )
            );

            break;


        // ================================
        // FILE START
        // ================================

        case MESSAGE_TYPES.FILE_START:

            startReceivingFile(
                message
            );

            break;


        // ================================
        // FILE END
        // ================================

        case MESSAGE_TYPES.FILE_END:

            finishReceivingFile(
                message
            );

            break;


        // ================================
        // ERROR
        // ================================

        case MESSAGE_TYPES.ERROR:

            console.error(
                "Remote error:",
                message.message
            );

            break;


        // ================================
        // UNKNOWN
        // ================================

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

function startReceivingFile(
    message
) {

    console.log(
        "Receiving file:",
        message.name
    );


    // ====================================
    // RESET OLD STATE
    // ====================================

    receivingFile = {

        fileId:
            message.fileId,

        name:
            message.name,

        size:
            message.size,

        mimeType:
            message.mimeType,

        totalChunks:
            message.totalChunks,

        expectedHash:
            message.sha256,

        receivedChunks:
            [],

        receivedBytes:
            0,

        chunkIndex:
            0,

        startTime:
            performance.now()

    };


    window.dispatchEvent(
        new CustomEvent(
            "file-receive-start",
            {
                detail: {

                    fileName:
                        message.name,

                    fileSize:
                        message.size,

                    totalChunks:
                        message.totalChunks,

                    sha256:
                        message.sha256

                }
            }
        )
    );

}


// ========================================
// HANDLE BINARY CHUNK
// ========================================

function handleBinaryChunk(
    data
) {

    if (!receivingFile) {

        console.warn(
            "Received binary data but no file is active."
        );


        return;

    }


    receivingFile.receivedChunks.push(
        data
    );


    receivingFile.receivedBytes +=
        data.byteLength;


    receivingFile.chunkIndex++;


    // ====================================
    // STATISTICS
    // ====================================

    const elapsed =
        (
            performance.now() -
            receivingFile.startTime
        ) / 1000;


    const speed =
        elapsed > 0
            ? receivingFile.receivedBytes /
              elapsed
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


    // ====================================
    // PROGRESS EVENT
    // ====================================

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

async function finishReceivingFile(
    message
) {

    if (!receivingFile) {

        console.warn(
            "File end received but no file is active."
        );


        return;

    }


    const currentFile =
        receivingFile;


    console.log(
        "Reassembling file:",
        currentFile.name
    );


    // ====================================
    // CREATE BLOB
    // ====================================

    const blob =
        new Blob(
            currentFile.receivedChunks,
            {
                type:
                    currentFile.mimeType
            }
        );


    // ====================================
    // CALCULATE RECEIVED HASH
    // ====================================

    window.dispatchEvent(
        new CustomEvent(
            "file-hash-start",
            {
                detail: {

                    fileName:
                        currentFile.name

                }
            }
        )
    );


    const receivedHash =
        await calculateSHA256(
            blob
        );


    const expectedHash =
        currentFile.expectedHash ||
        message.sha256;


    // ====================================
    // VERIFY
    // ====================================

    const verified =
        compareHashes(
            expectedHash,
            receivedHash
        );


    console.log(
        "Expected SHA-256:",
        expectedHash
    );


    console.log(
        "Received SHA-256:",
        receivedHash
    );


    console.log(
        "Integrity verified:",
        verified
    );


    // ====================================
    // DOWNLOAD URL
    // ====================================

    const downloadUrl =
        URL.createObjectURL(
            blob
        );


    // ====================================
    // RECEIVE COMPLETE
    // ====================================

    window.dispatchEvent(
        new CustomEvent(
            "file-receive-complete",
            {
                detail: {

                    fileName:
                        currentFile.name,

                    fileSize:
                        currentFile.size,

                    blob,

                    downloadUrl,

                    expectedHash,

                    receivedHash,

                    verified

                }
            }
        )
    );


    // ====================================
    // VERIFICATION EVENT
    // ====================================

    window.dispatchEvent(
        new CustomEvent(
            "file-integrity-result",
            {
                detail: {

                    fileName:
                        currentFile.name,

                    expectedHash,

                    receivedHash,

                    verified

                }
            }
        )
    );


    if (verified) {

        console.log(
            "✓ File integrity verified:",
            currentFile.name
        );

    }

    else {

        console.error(
            "✗ File integrity verification failed:",
            currentFile.name
        );

    }


    // ====================================
    // RESET
    // ====================================

    receivingFile = null;

}