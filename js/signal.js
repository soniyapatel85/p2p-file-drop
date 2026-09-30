// ========================================
// P2P FILE DROP
// MANUAL SIGNALLING
// ========================================

console.log("signal.js loaded");

// ========================================
// CREATE OFFER CODE
// ========================================

export async function createOfferCode(peerConnection) {

    console.log("Creating WebRTC offer...");

    const offer =
        await peerConnection.createOffer();

    console.log("Offer created:", offer);

    await peerConnection.setLocalDescription(offer);

    console.log(
        "Local description set. Waiting for ICE gathering..."
    );

    await waitForIceGatheringComplete(peerConnection);

    const localDescription =
        peerConnection.localDescription;

    return JSON.stringify(localDescription);
}


// ========================================
// WAIT FOR ICE GATHERING
// ========================================

function waitForIceGatheringComplete(peerConnection) {

    return new Promise(function (resolve) {

        if (
            peerConnection.iceGatheringState ===
            "complete"
        ) {
            resolve();
            return;
        }

        function checkIceState() {

            if (
                peerConnection.iceGatheringState ===
                "complete"
            ) {

                peerConnection.removeEventListener(
                    "icegatheringstatechange",
                    checkIceState
                );

                resolve();
            }
        }

        peerConnection.addEventListener(
            "icegatheringstatechange",
            checkIceState
        );

    });
}

// ========================================
// CREATE ANSWER CODE
// ========================================

export async function createAnswerCode(
    peerConnection,
    receivedOffer
) {
    console.log("Creating answer...");

    // Convert received JSON string into object
    const offer = JSON.parse(receivedOffer);

    console.log("Received offer:", offer);

    // Set sender's offer as remote description
    await peerConnection.setRemoteDescription(offer);

    console.log("Remote offer set.");

    // Create answer
    const answer =
        await peerConnection.createAnswer();

    console.log("Answer created:", answer);

    // Set answer as local description
    await peerConnection.setLocalDescription(answer);

    console.log(
        "Local answer set. Waiting for ICE gathering..."
    );

    // Wait until ICE gathering is complete
    await waitForIceGatheringComplete(
        peerConnection
    );

    // Get final local description
    const localDescription =
        peerConnection.localDescription;

    console.log(
        "ICE gathering completed."
    );

    // Return answer as JSON string
    return JSON.stringify(
        localDescription
    );
}

// ========================================
// SET ANSWER CODE
// ========================================

export async function setAnswerCode(
    peerConnection,
    receivedAnswer
) {
    console.log("Setting received answer...");

    // Convert JSON string into object
    const answer = JSON.parse(receivedAnswer);

    console.log("Received answer:", answer);

    // Set receiver's answer as remote description
    await peerConnection.setRemoteDescription(answer);

    console.log(
        "Remote answer set successfully."
    );
}