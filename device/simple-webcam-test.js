// File: simple-webcam-test.js

const NodeWebcam = require('node-webcam');

// Create webcam instance
const webcam = NodeWebcam.create({});

// Capture function using promises
function capture() {
    return new Promise((resolve, reject) => {
        webcam.capture("test_shot", (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Main function
async function main() {
    console.log("Starting webcam test...");
    try {
        console.log("Attempting to capture image...");
        const data = await capture();
        console.log("Image captured successfully:", data);
    } catch (error) {
        console.error("Error capturing image:", error);
    }
    console.log("Webcam test completed.");
}

// Run the main function
main();