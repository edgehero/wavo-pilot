// File: server/server.js

const { Server } = require('socket.io');

const io = new Server(3000, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

const ROOM_ID = 'single-room';

let deviceId = null;
let userServerId = null;

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    socket.on('join-room', (role) => {
        socket.join(ROOM_ID);
        if (role === 'device') {
            deviceId = socket.id;
            console.log(`Device joined with ID: ${deviceId}`);
        } else if (role === 'user-server') {
            userServerId = socket.id;
            console.log(`User server joined with ID: ${userServerId}`);
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
            socket.to(ROOM_ID).emit('message', message, 'device');
        } else if (userServerId) {
            io.to(deviceId).emit('message', message, socket.id);
        }
    });

    socket.on('ping', (userId) => {
        console.log(`Received ping from ${userId} to device`);
        if (deviceId) {
            io.to(deviceId).emit('ping', userId);
        }
    });

    socket.on('pong', (userId) => {
        console.log(`Received pong from device to ${userId}`);
        if (userServerId) {
            console.log(`Sending pong to user server ${userServerId} for user ${userId}`);
            io.to(userServerId).emit('pong', userId);
        } else {
            console.log(`User server not found, cannot send pong for user ${userId}`);
        }
    });

    socket.on('disconnect', () => {
        if (socket.id === deviceId) {
            deviceId = null;
            console.log('Device disconnected');
        } else if (socket.id === userServerId) {
            userServerId = null;
            console.log('User server disconnected');
        }
        socket.to(ROOM_ID).emit('user-disconnected', socket.id);
        console.log('Client disconnected:', socket.id);
    });
});

console.log('WebSocket server running on http://localhost:3000');   