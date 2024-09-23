// File: user/public/user-client.js

const socket = io();  // Connect to local user server

const videoElement = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');
const pingButton = document.getElementById('pingButton');
const latencyDiv = document.getElementById('latency');

function updatePingDisplay(latency) {
    pingHistory.push(latency);
    if (pingHistory.length > 10) pingHistory.shift();
    
    const avgPing = Math.round(pingHistory.reduce((a, b) => a + b, 0) / pingHistory.length);
    
    let color;
    if (avgPing < 50) color = 'green';
    else if (avgPing < 100) color = 'yellow';
    else color = 'red';
    
    pingDisplay.textContent = `${avgPing} ping`;
    pingDisplay.style.color = color;
}

let pingStartTime;
let pingHistory = [];

socket.on('connect', () => {
    console.log('Connected to user server');
    addMessage('System', 'Connected to server');
});

socket.on('mediaChunk', ({ producerId, chunk }) => {
    console.log(`Received media chunk from producer ${producerId}`);
    videoElement.textContent = `Latest chunk: ${new TextDecoder().decode(chunk)}`;
});

socket.on('message', (message, from) => {
    addMessage(from, message);
});

socket.on('pong', () => {
    const latency = Date.now() - pingStartTime;
    const ping = latency / 2;
    console.log(`Received pong. Latency: ${latency}ms`);
    updatePingDisplay(ping);
});

socket.on('user-connected', ({ id, role }) => {
    console.log(`User connected: ${id} as ${role}`);
    addMessage('System', `${role} connected: ${id}`);
});

socket.on('user-disconnected', (id) => {
    console.log(`User disconnected: ${id}`);
    addMessage('System', `User disconnected: ${id}`);
});

sendButton.onclick = () => {
    const message = messageInput.value;
    if (message) {
        console.log('Sending message:', message);
        socket.emit('message', message);
        addMessage('You', message);
        messageInput.value = '';
    }
};

pingButton.onclick = () => {
    pingStartTime = Date.now();
    console.log('Sending ping');
    socket.emit('ping');
};

function addMessage(from, message) {
    const messageElement = document.createElement('p');
    messageElement.textContent = `${from}: ${message}`;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

socket.on('disconnect', () => {
    console.log('Disconnected from user server');
    addMessage('System', 'Disconnected from server');
});