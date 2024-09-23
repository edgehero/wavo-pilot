const socket = io('http://localhost:3000');  // Central WebSocket server
const localSocket = io();  // Local user server

const ROOM_ID = 'single-room';

let device;
let recvTransport;
let consumer;

const videoElement = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

async function createDevice() {
    device = new mediasoupClient.Device();
    const routerRtpCapabilities = await new Promise((resolve) => {
        socket.emit('getRouterRtpCapabilities', resolve);
    });
    await device.load({ routerRtpCapabilities });
}

// Rest of the user client code remains largely the same...

localSocket.on('connect', () => {
    console.log('Connected to user server');
});

// You can add any user-specific local socket handling here