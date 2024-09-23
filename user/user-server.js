// File: user/user-server.js

const express = require('express');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { io: IOClient } = require('socket.io-client');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = 8080;

// Connect to the central WebSocket server
const centralSocket = IOClient('http://localhost:3000');

centralSocket.on('connect', () => {
    console.log('Connected to central WebSocket server');
    centralSocket.emit('join-room', 'user-server');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected to the user server');

    // Forward messages from client to central server
    socket.on('message', (message) => {
        centralSocket.emit('message', message);
    });
});

// Forward events from central server to connected clients
centralSocket.on('mediaChunk', (data) => {
    io.emit('mediaChunk', data);
});

centralSocket.on('message', (message, from) => {
    console.log(`Received message from ${from}:`, message);
    io.emit('message', message, from);
});

centralSocket.on('user-connected', (data) => {
    io.emit('user-connected', data);
});

centralSocket.on('user-disconnected', (id) => {
    io.emit('user-disconnected', id);
});

httpServer.listen(PORT, () => {
    console.log(`User server running on http://localhost:${PORT}`);
});