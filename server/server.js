// File: server.js (in root folder)

const { Server } = require('socket.io');

const io = new Server(3000, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

const ROOM_ID = 'single-room';

let deviceId = null;

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('join-room', (role) => {
        socket.join(ROOM_ID);
        if (role === 'device') {
            deviceId = socket.id;
            console.log(`Device joined with ID: ${deviceId}`);
        }
        io.to(ROOM_ID).emit('user-connected', { id: socket.id, role });
        console.log(`Client ${socket.id} joined as ${role}`);
    });

    socket.on('createProducer', (callback) => {
        const producerId = socket.id + '_producer';
        callback(producerId);
    });

    socket.on('mediaChunk', ({ producerId, chunk }) => {
        socket.to(ROOM_ID).emit('mediaChunk', { producerId, chunk });
    });

    socket.on('message', (message) => {
        console.log(`Received message from ${socket.id}:`, message);
        if (socket.id === deviceId) {
            // If the message is from the device, send it to all users
            socket.to(ROOM_ID).emit('message', message, 'device');
        } else {
            // If the message is from a user, send it to the device
            if (deviceId) {
                io.to(deviceId).emit('message', message, socket.id);
            }
        }
    });

    socket.on('disconnect', () => {
        if (socket.id === deviceId) {
            deviceId = null;
            console.log('Device disconnected');
        }
        socket.to(ROOM_ID).emit('user-disconnected', socket.id);
        console.log('Client disconnected:', socket.id);
    });
});

console.log('WebSocket server running on http://localhost:3000');