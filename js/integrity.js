// ========================================
// P2P FILE DROP
// FILE INTEGRITY / SHA-256
// ========================================


// ========================================
// CALCULATE SHA-256 HASH
// ========================================

export async function calculateSHA256(fileOrBlob) {

    if (!fileOrBlob) {
        throw new Error("No file or data provided.");
    }


    const buffer =
        await fileOrBlob.arrayBuffer();


    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            buffer
        );


    const hashArray =
        Array.from(
            new Uint8Array(hashBuffer)
        );


    const hashHex =
        hashArray
            .map(
                byte =>
                    byte
                        .toString(16)
                        .padStart(2, "0")
            )
            .join("");


    return hashHex;
}


// ========================================
// COMPARE HASHES
// ========================================

export function compareHashes(
    originalHash,
    receivedHash
) {

    if (!originalHash || !receivedHash) {
        return false;
    }


    return (
        originalHash.toLowerCase() ===
        receivedHash.toLowerCase()
    );

}