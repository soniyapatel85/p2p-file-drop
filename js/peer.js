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

console.log(
    "RTCPeerConnection created:",
    peerConnection
);

// ========================================
// CONNECTION STATE MONITOR
// ========================================

peerConnection.addEventListener(
    "connectionstatechange",
    function () {

        console.log(
            "Connection state:",
            peerConnection.connectionState
        );

        console.log(
            "Signaling state:",
            peerConnection.signalingState
        );

        console.log(
            "ICE connection state:",
            peerConnection.iceConnectionState
        );

        console.log(
            "ICE gathering state:",
            peerConnection.iceGatheringState
        );

    }
);

// ========================================
// ICE CONNECTION STATE MONITOR
// ========================================

peerConnection.addEventListener(
    "iceconnectionstatechange",
    function () {

        console.log(
            "ICE state:",
            peerConnection.iceConnectionState
        );

        console.log(
            "Signaling state:",
            peerConnection.signalingState
        );

    }
);

// ========================================
// ICE CANDIDATE MONITOR
// ========================================

peerConnection.addEventListener(
    "icecandidate",
    function (event) {

        if (event.candidate) {

            console.log(
                "New ICE candidate:",
                event.candidate
            );

        } else {

            console.log(
                "ICE gathering completed"
            );

        }

    }
);

// ========================================
// DATA CHANNEL
// ========================================

export const dataChannel =
    peerConnection.createDataChannel(
        "file-transfer"
    );

console.log(
    "Data channel created:",
    dataChannel
);

// ========================================
// RECEIVER DATA CHANNEL
// ========================================

peerConnection.addEventListener(
    "datachannel",
    function (event) {

        console.log(
            "Incoming data channel received:",
            event.channel
        );

        const incomingChannel = event.channel;

        incomingChannel.addEventListener(
            "open",
            function () {

                console.log(
                    "Incoming data channel is OPEN"
                );

            }
        );

        incomingChannel.addEventListener(
            "close",
            function () {

                console.log(
                    "Incoming data channel is CLOSED"
                );

            }
        );

        incomingChannel.addEventListener(
            "message",
            function (event) {

                console.log(
                    "Message received:",
                    event.data
                );

            }
        );

    }
);
// ========================================
// DATA CHANNEL OPEN
// ========================================

dataChannel.addEventListener(
    "open",
    function () {

        console.log(
            "Data channel is OPEN"
        );

    }
);

// ========================================
// DATA CHANNEL CLOSE
// ========================================

dataChannel.addEventListener(
    "close",
    function () {

        console.log(
            "Data channel is CLOSED"
        );

    }
);

// ========================================
// DATA CHANNEL ERROR
// ========================================

dataChannel.addEventListener(
    "error",
    function (event) {

        console.error(
            "Data channel error:",
            event
        );

    }
);

// ========================================
// DATA CHANNEL MESSAGE
// ========================================

dataChannel.addEventListener(
    "message",
    function (event) {

        console.log(
            "Message received:",
            event.data
        );

    }
);