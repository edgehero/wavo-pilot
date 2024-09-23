// File: user/public/user-client.js

const socket = io();  // Connect to local user server

const videoElement = document.getElementById('remoteVideo');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const messagesDiv = document.getElementById('messages');

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

socket.on('user-connected', ({ id, role }) => {
    addMessage('System', `${role} connected: ${id}`);
});

socket.on('user-disconnected', (id) => {
    addMessage('System', `User disconnected: ${id}`);
});

sendButton.onclick = () => {
    const message = messageInput.value;
    if (message) {
        socket.emit('message', message);
        addMessage('You', message);
        messageInput.value = '';
    }
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