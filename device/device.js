// File: device/device.js

const { io } = require('socket.io-client');

const socket = io('http://localhost:3000');
const ROOM_ID = 'single-room';

let producerId;

function simulateMediaStream() {
    setInterval(() => {
        const fakeMediaChunk = Buffer.from('Fake media chunk ' + Date.now());
        if (producerId) {
            socket.emit('mediaChunk', { producerId, chunk: fakeMediaChunk });
        }
    }, 1000); // Send a fake chunk every second
}

socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('join-room', 'device');
    
    socket.emit('createProducer', (id) => {
        producerId = id;
        console.log('Producer created with ID:', producerId);
        simulateMediaStream();
    });
});

socket.on('message', (message, from) => {
    console.log(`Received message from ${from}:`, message);
    socket.emit('message', `Device received: ${message}`);
});

socket.on('ping', (userId) => {
    console.log(`Received ping from ${userId}`);
    socket.emit('pong', userId);
});

socket.on('user-connected', ({ id, role }) => {
    console.log(`User connected: ${id} as ${role}`);
});

socket.on('user-disconnected', (id) => {
    console.log(`User disconnected: ${id}`);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down...');
    socket.disconnect();
    process.exit(0);
});