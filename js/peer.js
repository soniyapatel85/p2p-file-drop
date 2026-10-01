// ========================================
// P2P FILE DROP
// WEBRTC PEER CONNECTION
// ========================================

console.log("peer.js loaded");

const rtcConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export const peerConnection = new RTCPeerConnection(rtcConfiguration);

console.log("RTCPeerConnection created:", peerConnection);

// ========================================
// ACTIVE DATA CHANNEL
// ========================================

let activeDataChannel = null;

export function getDataChannel() {
    return activeDataChannel;
}

function setupDataChannel(channel) {
    console.log("Setting up data channel:", channel);
    activeDataChannel = channel;

    channel.addEventListener("open", function () {
        console.log("Data channel is OPEN");
        window.dispatchEvent(new CustomEvent("p2p-datachannel-open"));
    });

    channel.addEventListener("close", function () {
        console.log("Data channel is CLOSED");
        window.dispatchEvent(new CustomEvent("p2p-datachannel-close"));
    });

    channel.addEventListener("error", function (event) {
        console.error("Data channel error:", event);
    });

    channel.addEventListener("message", function (event) {
        console.log("Message received:", event.data);
        window.dispatchEvent(
            new CustomEvent("p2p-message", {
                detail: { message: event.data }
            })
        );
    });
}

// ========================================
// SENDER: CREATE DATA CHANNEL
// (main.js calls this before creating the offer)
// ========================================

export function initDataChannel() {
    if (activeDataChannel) return activeDataChannel;

    const channel = peerConnection.createDataChannel("file-transfer");
    console.log("Data channel created:", channel);
    setupDataChannel(channel);
    return channel;
}

// ========================================
// RECEIVER: INCOMING DATA CHANNEL
// ========================================

peerConnection.addEventListener("datachannel", function (event) {
    console.log("Incoming data channel received:", event.channel);
    setupDataChannel(event.channel);
});

// ========================================
// STATE MONITORS
// ========================================

peerConnection.addEventListener("connectionstatechange", function () {
    console.log("Connection state:", peerConnection.connectionState);
    console.log("Signaling state:", peerConnection.signalingState);
    console.log("ICE connection state:", peerConnection.iceConnectionState);
    console.log("ICE gathering state:", peerConnection.iceGatheringState);
});

peerConnection.addEventListener("iceconnectionstatechange", function () {
    console.log("ICE state:", peerConnection.iceConnectionState);
});

peerConnection.addEventListener("icecandidate", function (event) {
    if (event.candidate) {
        console.log("New ICE candidate:", event.candidate);
    } else {
        console.log("ICE gathering completed");
    }
});