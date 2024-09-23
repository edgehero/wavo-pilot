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

// Store connected clients
const connectedClients = new Map();

io.on('connection', (socket) => {
    console.log('A user connected to the user server', socket.id);
    connectedClients.set(socket.id, socket);

    socket.on('message', (message) => {
        console.log(`Forwarding message from user ${socket.id} to central server`);
        centralSocket.emit('message', message);
    });

    socket.on('ping', () => {
        console.log(`Received ping from user ${socket.id}, forwarding to central server`);
        centralSocket.emit('ping', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
        connectedClients.delete(socket.id);
    });
});

centralSocket.on('mediaChunk', (data) => {
    io.emit('mediaChunk', data);
});

centralSocket.on('message', (message, from) => {
    console.log(`Received message from ${from}:`, message);
    io.emit('message', message, from);
});

centralSocket.on('pong', (userId) => {
    console.log(`Received pong from central server for user ${userId}`);
    const userSocket = connectedClients.get(userId);
    if (userSocket) {
        console.log(`Forwarding pong to user ${userId}`);
        userSocket.emit('pong');
    } else {
        console.log(`User socket not found for ${userId}`);
    }
});

centralSocket.on('user-connected', (data) => {
    console.log('User connected event:', data);
    io.emit('user-connected', data);
});

centralSocket.on('user-disconnected', (id) => {
    console.log('User disconnected event:', id);
    io.emit('user-disconnected', id);
});

httpServer.listen(PORT, () => {
    console.log(`User server running on http://localhost:${PORT}`);
});