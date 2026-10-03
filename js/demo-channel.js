let demoChannel = null;

export function startDemoChannel() {
    if (demoChannel) {
        return;
    }

    demoChannel = new BroadcastChannel("p2p-file-drop-demo");

    demoChannel.onmessage = (event) => {
        console.log("Demo message received:", event.data);
    };

    console.log("Demo Mode: BroadcastChannel started");
}

export function sendDemoMessage(message) {
    if (!demoChannel) {
        console.warn("Demo Channel is not started.");
        return;
    }

    demoChannel.postMessage(message);
}

export function stopDemoChannel() {
    if (!demoChannel) {
        return;
    }

    demoChannel.close();
    demoChannel = null;

    console.log("Demo Mode: BroadcastChannel stopped");
}