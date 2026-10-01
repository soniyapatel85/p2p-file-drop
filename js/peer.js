// ========================================
// P2P FILE DROP
// WEBRTC PEER CONNECTION
// ========================================

console.log("peer.js loaded");


// ========================================
// WEBRTC CONFIGURATION
// ========================================

const rtcConfiguration = {

    iceServers: [

        {
            urls: "stun:stun.l.google.com:19302"
        }

    ]

};


// ========================================
// CREATE PEER CONNECTION
// ========================================

export const peerConnection =
    new RTCPeerConnection(rtcConfiguration);


// ========================================
// ACTIVE DATA CHANNEL
// ========================================

let activeDataChannel = null;


// ========================================
// GET DATA CHANNEL
// ========================================

export function getDataChannel() {

    return activeDataChannel;

}


// ========================================
// CREATE DATA CHANNEL
// ========================================

export function createDataChannel() {

    if (activeDataChannel) {

        console.log("Data channel already exists");

        return activeDataChannel;

    }


    console.log("Creating data channel...");


    activeDataChannel =
        peerConnection.createDataChannel(
            "file-transfer",
            {
                ordered: true
            }
        );


    setupDataChannel(activeDataChannel);


    return activeDataChannel;

}


// ========================================
// SETUP DATA CHANNEL
// ========================================

function setupDataChannel(channel) {

    console.log(
        "Setting up DataChannel:",
        channel.label
    );


    channel.binaryType = "arraybuffer";


    channel.onopen = () => {

        console.log("DataChannel OPEN");

        window.dispatchEvent(
            new CustomEvent(
                "p2p-datachannel-open"
            )
        );

    };


    channel.onclose = () => {

        console.log("DataChannel CLOSED");

        window.dispatchEvent(
            new CustomEvent(
                "p2p-datachannel-close"
            )
        );

    };


    channel.onerror = (error) => {

        console.error(
            "DataChannel error:",
            error
        );

        window.dispatchEvent(
            new CustomEvent(
                "p2p-datachannel-error",
                {
                    detail: error
                }
            )
        );

    };


    channel.onmessage = (event) => {

        window.dispatchEvent(
            new CustomEvent(
                "p2p-datachannel-message",
                {
                    detail: event.data
                }
            )
        );

    };

}


// ========================================
// RECEIVE DATA CHANNEL
// ========================================

peerConnection.ondatachannel = (event) => {

    console.log(
        "Received DataChannel:",
        event.channel.label
    );


    activeDataChannel =
        event.channel;


    setupDataChannel(activeDataChannel);

};


// ========================================
// ICE STATE
// ========================================

peerConnection.oniceconnectionstatechange = () => {

    console.log(
        "ICE connection state:",
        peerConnection.iceConnectionState
    );

};


// ========================================
// CONNECTION STATE
// ========================================

peerConnection.onconnectionstatechange = () => {

    console.log(
        "Connection state:",
        peerConnection.connectionState
    );

};


// ========================================
// ICE CANDIDATE
// ========================================

peerConnection.onicecandidate = (event) => {

    if (event.candidate) {

        console.log(
            "ICE candidate generated"
        );

    }

};