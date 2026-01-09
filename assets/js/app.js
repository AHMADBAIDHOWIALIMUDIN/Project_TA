import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCQWvoDxDyVCuLEDiwammjUIVYxVARzJig",
    authDomain: "project-ta-951b4.firebaseapp.com",
    projectId: "project-ta-951b4",
    storageBucket: "project-ta-951b4.firebasestorage.app",
    messagingSenderId: "217854138058",
    appId: "1:217854138058:web:50a5bcd5a61ac1820c4633",
    measurementId: "G-6ML8QQEGNZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Pot states (all ON by default)
const potStates = {
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
};

// Toggle pot function
window.togglePot = function(potNumber) {
    potStates[potNumber] = !potStates[potNumber];
    const statusEl = document.getElementById(`status${potNumber}`);
    const indicatorEl = document.getElementById(`indicator${potNumber}`);
    
    if (potStates[potNumber]) {
        statusEl.textContent = 'ON';
        indicatorEl.classList.add('active');
        indicatorEl.classList.remove('inactive');
    } else {
        statusEl.textContent = 'OFF';
        indicatorEl.classList.add('inactive');
        indicatorEl.classList.remove('active');
    }
    
    console.log(`POT ${potNumber} is now ${potStates[potNumber] ? 'ON' : 'OFF'}`);
    // TODO: Send command to device/Firebase
};

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('dashboardPage').hidden = false;
        document.getElementById('loginMessage').hidden = true;
        document.getElementById('userEmail').textContent = user.email;
        window.scrollTo(0, 0);
        
        // Initialize sensor data updates
        updateSensorData();
        setInterval(updateSensorData, 5000); // Update every 5 seconds
    } else {
        document.getElementById('dashboardPage').hidden = true;
        document.getElementById('loginMessage').hidden = false;
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

// Update sensor data
function updateSensorData() {
    // Simulate DHT temperature (15-30°C)
    const dhtTemp = Math.floor(Math.random() * (30 - 15) + 15);
    document.getElementById('dhtTemp').textContent = dhtTemp;
    
    // Simulate sunlight (0-100)
    const sunLight = Math.floor(Math.random() * 100);
    const sunStatus = sunLight < 30 ? 'Gelap' : sunLight < 60 ? 'Sedang' : 'Panas';
    document.getElementById('sunLight').textContent = sunLight;
    
    // Update status text
    const statusEl = document.querySelector('.sensor-light .status');
    if (statusEl) {
        statusEl.textContent = sunStatus;
    }
    
    // Update soil moisture for each pot (0-15)
    for (let i = 1; i <= 5; i++) {
        const moisture = Math.floor(Math.random() * 16);
        const moistureEl = document.getElementById(`moisture${i}`);
        if (moistureEl) {
            moistureEl.textContent = moisture;
        }
    }
}

// Sign out function
document.getElementById('signOutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log('User signed out');
        window.location.href = '../index.html';
    }).catch((error) => {
        console.error(error);
    });
});