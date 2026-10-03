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

export function encodeOfferForQR(offer) {
    const json = JSON.stringify(offer);
    return btoa(
        encodeURIComponent(json)
            .replace(/%([0-9A-F]{2})/g, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16))
            )
    )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}