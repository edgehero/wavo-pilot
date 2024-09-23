const { Server } = require('socket.io');
const mediasoup = require('mediasoup');

const io = new Server(3000, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

const ROOM_ID = 'single-room';

let worker;
let router;
let producerId;

async function createWorker() {
    worker = await mediasoup.createWorker({
        logLevel: 'warn',
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
    });
    console.log('mediasoup Worker created');
    return worker;
}

async function createRouter() {
    router = await worker.createRouter({
        mediaCodecs: [
            {
                kind: 'video',
                mimeType: 'video/VP8',
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 1000
                }
            },
        ]
    });
    return router;
}

async function createWebRtcTransport() {
    const transport = await router.createWebRtcTransport({
        listenIps: [
            {
                ip: '0.0.0.0',
                announcedIp: '127.0.0.1', // replace with your public IP address
            }
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
    });
    return transport;
}

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('join-room', (role) => {
        socket.join(ROOM_ID);
        socket.to(ROOM_ID).emit('user-connected', { id: socket.id, role });
        console.log(`Client ${socket.id} joined as ${role}`);
    });

    socket.on('getRouterRtpCapabilities', (callback) => {
        callback(router.rtpCapabilities);
    });

    socket.on('createWebRtcTransport', async (callback) => {
        try {
            const transport = await createWebRtcTransport();
            callback({
                id: transport.id,
                iceParameters: transport.iceParameters,
                iceCandidates: transport.iceCandidates,
                dtlsParameters: transport.dtlsParameters,
            });
        } catch (error) {
            console.error(error);
            callback({ error: error.message });
        }
    });

    socket.on('connectWebRtcTransport', async ({ transportId, dtlsParameters }, callback) => {
        const transport = router.transports.get(transportId);
        await transport.connect({ dtlsParameters });
        callback();
    });

    socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
        const transport = router.transports.get(transportId);
        const producer = await transport.produce({ kind, rtpParameters });
        producerId = producer.id;
        callback({ id: producer.id });
    });

    socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
        try {
            const transport = router.transports.get(transportId);
            const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: true,
            });
            callback({
                id: consumer.id,
                producerId: producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            });
        } catch (error) {
            console.error('consume error', error);
            callback({ error: error.message });
        }
    });

    socket.on('message', (message, to) => {
        socket.to(to).emit('message', message, socket.id);
    });

    socket.on('disconnect', () => {
        socket.to(ROOM_ID).emit('user-disconnected', socket.id);
        console.log('Client disconnected:', socket.id);
    });
});

async function run() {
    await createWorker();
    await createRouter();
    console.log('WebSocket server running on http://localhost:3000');
}

run();