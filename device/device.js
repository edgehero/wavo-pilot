const { io } = require('socket.io-client');
const mediasoupClient = require('mediasoup-client');

const socket = io('http://localhost:3000');
const ROOM_ID = 'single-room';

let device;
let sendTransport;
let producer;

async function createDevice() {
    device = new mediasoupClient.Device();
    const routerRtpCapabilities = await new Promise((resolve) => {
        socket.emit('getRouterRtpCapabilities', resolve);
    });
    await device.load({ routerRtpCapabilities });
}

async function createSendTransport() {
    const transportOptions = await new Promise((resolve) => {
        socket.emit('createWebRtcTransport', { producing: true }, resolve);
    });
    sendTransport = device.createSendTransport(transportOptions);

    sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
        socket.emit('connectWebRtcTransport', {
            transportId: sendTransport.id,
            dtlsParameters
        }, (err) => {
            if (err) {
                errback(err);
            } else {
                callback();
            }
        });
    });

    sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
        try {
            const { id } = await new Promise((resolve) => {
                socket.emit('produce', {
                    transportId: sendTransport.id,
                    kind,
                    rtpParameters,
                    appData
                }, resolve);
            });
            callback({ id });
        } catch (error) {
            errback(error);
        }
    });
}

async function startStreaming() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const track = stream.getVideoTracks()[0];
        producer = await sendTransport.produce({ track });
        console.log('Producer created:', producer.id);
    } catch (error) {
        console.error('Error starting streaming:', error);
    }
}

socket.on('connect', async () => {
    console.log('Connected to server');
    try {
        await createDevice();
        await createSendTransport();
        await startStreaming();
        socket.emit('join-room', 'device');
    } catch (error) {
        console.error('Error during setup:', error);
    }
});

socket.on('message', (message, from) => {
    console.log(`Received message from ${from}:`, message);
    // Handle incoming messages here
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (producer) producer.close();
    if (sendTransport) sendTransport.close();
    socket.disconnect();
    process.exit(0);
});