// Import Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

// Firebase configuration
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

// Notification function
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');

    // Set icon based on type
    if (type === 'success') {
        icon.className = 'notification-icon fas fa-check-circle';
    } else if (type === 'error') {
        icon.className = 'notification-icon fas fa-exclamation-circle';
    } else if (type === 'info') {
        icon.className = 'notification-icon fas fa-info-circle';
    }

    messageEl.textContent = message;
    notification.className = `notification ${type}`;

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Authentication check
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('dashboardPage').style.display = 'block';
        document.getElementById('loginMessage').hidden = true;
    } else {
        document.getElementById('dashboardPage').style.display = 'none';
        document.getElementById('loginMessage').hidden = false;
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

// Logout handler
document.getElementById('signOutBtn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '../index.html';
    } catch (error) {
        showNotification('Error logging out: ' + error.message, 'error');
    }
});

// Auto-update sensor values
let mainModeActive = false;

function updateSensorValues() {
    // This function is now simplified for the new design
    // Can be extended later if needed
}

// Toggle main mode ON/OFF
window.toggleMainMode = function() {
    mainModeActive = !mainModeActive;
    const mainToggle = document.getElementById('mainToggle');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const globalMinInput = document.getElementById('globalMin');
    const globalMaxInput = document.getElementById('globalMax');
    
    if (mainModeActive) {
        mainToggle.classList.add('active');
        statusIndicator.classList.add('active');
        statusText.textContent = 'Aktif';
        globalMinInput.disabled = false;
        globalMaxInput.disabled = false;
        showNotification('Mode Otomatis diaktifkan', 'success');
    } else {
        mainToggle.classList.remove('active');
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Tidak Aktif';
        globalMinInput.disabled = true;
        globalMaxInput.disabled = true;
        showNotification('Mode Otomatis dinonaktifkan', 'info');
    }
    
    // Save state to localStorage
    localStorage.setItem('mainModeActive', mainModeActive);
    console.log('Main mode toggled:', mainModeActive);
}

// Initial update and set interval
updateSensorValues();
setInterval(updateSensorValues, 5000);

// Save settings handler - removed since button is removed
// Load saved settings on page load
window.addEventListener('DOMContentLoaded', () => {
    const savedMode = localStorage.getItem('mainModeActive');
    if (savedMode === 'true') {
        mainModeActive = false; // Set to false first
        toggleMainMode(); // Then toggle to activate
    }
    
    const savedMin = localStorage.getItem('globalMinValue');
    const savedMax = localStorage.getItem('globalMaxValue');
    
    if (savedMin) {
        document.getElementById('globalMin').value = savedMin;
    }
    
    if (savedMax) {
        document.getElementById('globalMax').value = savedMax;
    }
    
    // Save and validate min value when changed
    document.getElementById('globalMin').addEventListener('change', function() {
        let value = parseInt(this.value);
        const maxValue = parseInt(document.getElementById('globalMax').value);
        
        // Validate range
        if (value < 5) {
            value = 5;
            this.value = 5;
            showNotification('Kelembaban minimum tidak boleh kurang dari 5%', 'warning');
        } else if (value > 30) {
            value = 30;
            this.value = 30;
            showNotification('Kelembaban minimum tidak boleh lebih dari 30%', 'warning');
        } else if (value >= maxValue) {
            value = maxValue - 1;
            this.value = value;
            showNotification('Kelembaban minimum harus lebih kecil dari maksimum', 'warning');
        }
        
        localStorage.setItem('globalMinValue', value);
        showNotification('Kelembaban minimum: ' + value + '%', 'success');
    });
    
    // Save and validate max value when changed
    document.getElementById('globalMax').addEventListener('change', function() {
        let value = parseInt(this.value);
        const minValue = parseInt(document.getElementById('globalMin').value);
        
        // Validate range
        if (value < 5) {
            value = 5;
            this.value = 5;
            showNotification('Kelembaban maksimum tidak boleh kurang dari 5%', 'warning');
        } else if (value > 100) {
            value = 100;
            this.value = 100;
            showNotification('Kelembaban maksimum tidak boleh lebih dari 100%', 'warning');
        } else if (value <= minValue) {
            value = minValue + 1;
            this.value = value;
            showNotification('Kelembaban maksimum harus lebih besar dari minimum', 'warning');
        }
        
        localStorage.setItem('globalMaxValue', value);
        showNotification('Kelembaban maksimum: ' + value + '%', 'success');
    });
    
    // Add input validation on input event for min
    document.getElementById('globalMin').addEventListener('input', function() {
        let value = parseInt(this.value);
        if (value < 5) {
            this.value = 5;
        } else if (value > 30) {
            this.value = 30;
        }
    });
    
    // Add input validation on input event for max
    document.getElementById('globalMax').addEventListener('input', function() {
        let value = parseInt(this.value);
        if (value < 5) {
            this.value = 5;
        } else if (value > 100) {
            this.value = 100;
        }
    });
});
