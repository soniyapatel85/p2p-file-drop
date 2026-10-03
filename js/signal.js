// ========================================
// SIGNALING FUNCTIONS
// ========================================


// ========================================
// WAIT FOR ICE GATHERING
// ========================================

function waitForIceGathering(peerConnection) {

    return new Promise((resolve) => {

        if (
            peerConnection.iceGatheringState ===
            "complete"
        ) {

            resolve();

            return;

        }


        const checkState = () => {

            if (
                peerConnection.iceGatheringState ===
                "complete"
            ) {

                peerConnection.removeEventListener(
                    "icegatheringstatechange",
                    checkState
                );


                resolve();

            }

        };


        peerConnection.addEventListener(
            "icegatheringstatechange",
            checkState
        );

    });

}


// ========================================
// CREATE OFFER
// ========================================

export async function createOfferCode(
    peerConnection
) {

    try {

        console.log(
            "Creating WebRTC offer..."
        );


        const offer =
            await peerConnection.createOffer();


        await peerConnection.setLocalDescription(
            offer
        );


        await waitForIceGathering(
            peerConnection
        );


        const localDescription =
            peerConnection.localDescription;


        return JSON.stringify(
            localDescription
        );

    }

    catch (error) {

        console.error(
            "Error creating offer:",
            error
        );


        throw error;

    }

}


// ========================================
// CREATE ANSWER
// ========================================

export async function createAnswerCode(
    peerConnection,
    receivedOffer
) {

    try {

        console.log(
            "Creating WebRTC answer..."
        );


        const offer =
            JSON.parse(receivedOffer);


        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
        );


        const answer =
            await peerConnection.createAnswer();


        await peerConnection.setLocalDescription(
            answer
        );


        await waitForIceGathering(
            peerConnection
        );


        const localDescription =
            peerConnection.localDescription;


        return JSON.stringify(
            localDescription
        );

    }

    catch (error) {

        console.error(
            "Error creating answer:",
            error
        );


        throw error;

    }

}


// ========================================
// APPLY ANSWER
// ========================================

export async function setAnswerCode(
    peerConnection,
    receivedAnswer
) {

    try {

        console.log(
            "Applying received answer..."
        );


        const answer =
            JSON.parse(receivedAnswer);


        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
        );


        console.log(
            "Answer applied successfully"
        );

    }

    catch (error) {

        console.error(
            "Error applying answer:",
            error
        );


        throw error;

    }

}

export async function encodeOfferForQR(offer) {
    const json = JSON.stringify(offer);
    const stream = new Blob([json]).stream().pipeThrough(
        new CompressionStream("gzip")
    );

    const compressed = await new Response(stream).arrayBuffer();
    const bytes = new Uint8Array(compressed);

    let binary = "";
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export async function decodeOfferFromQR(encoded) {
    // Base64URL → Base64
    const base64 = encoded
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const binary = atob(base64);

    const bytes = Uint8Array.from(
        binary,
        char => char.charCodeAt(0)
    );

    // Gzip decompress
    const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new DecompressionStream("gzip"));

    const json = await new Response(stream).text();

    return json;
}