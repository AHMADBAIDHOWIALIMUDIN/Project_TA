// Import Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { getDatabase, ref, set, get, onValue, update } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCQWvoDxDyVCuLEDiwammjUIVYxVARzJig",
    authDomain: "project-ta-951b4.firebaseapp.com",
    databaseURL: "https://project-ta-951b4-default-rtdb.firebaseio.com",
    projectId: "project-ta-951b4",
    storageBucket: "project-ta-951b4.firebasestorage.app",
    messagingSenderId: "217854138058",
    appId: "1:217854138058:web:50a5bcd5a61ac1820c4633",
    measurementId: "G-6ML8QQEGNZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const kontrolRef = ref(database, 'kontrol');

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
        loadControllerData(); // Load data from Firebase
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
    const globalMinSlider = document.getElementById('globalMin');
    const globalMaxSlider = document.getElementById('globalMax');
    
    if (mainModeActive) {
        mainToggle.classList.add('active');
        statusIndicator.classList.add('active');
        statusText.textContent = 'Aktif';
        globalMinSlider.disabled = false;
        globalMaxSlider.disabled = false;
        showNotification('Mode Otomatis diaktifkan', 'success');
    } else {
        mainToggle.classList.remove('active');
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Tidak Aktif';
        globalMinSlider.disabled = true;
        globalMaxSlider.disabled = true;
        showNotification('Mode Otomatis dinonaktifkan', 'info');
    }
    
    // Save to Firebase
    update(kontrolRef, {
        otomatis: mainModeActive
    }).catch((error) => {
        console.error('Error updating Firebase:', error);
        showNotification('Gagal menyimpan ke server', 'error');
    });
    
    console.log('Main mode toggled:', mainModeActive);
}

// Initial update and set interval
updateSensorValues();
setInterval(updateSensorValues, 5000);

// Load controller data from Firebase
function loadControllerData() {
    onValue(kontrolRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('Controller data loaded:', data);
            
            // Update mode status
            if (data.otomatis !== undefined) {
                mainModeActive = data.otomatis;
                const mainToggle = document.getElementById('mainToggle');
                const statusIndicator = document.getElementById('statusIndicator');
                const statusText = document.getElementById('statusText');
                const globalMinSlider = document.getElementById('globalMin');
                const globalMaxSlider = document.getElementById('globalMax');
                
                if (mainModeActive) {
                    mainToggle.classList.add('active');
                    statusIndicator.classList.add('active');
                    statusText.textContent = 'Aktif';
                    globalMinSlider.disabled = false;
                    globalMaxSlider.disabled = false;
                } else {
                    mainToggle.classList.remove('active');
                    statusIndicator.classList.remove('active');
                    statusText.textContent = 'Tidak Aktif';
                    globalMinSlider.disabled = true;
                    globalMaxSlider.disabled = true;
                }
            }
            
            // Update slider values
            if (data.batas_bawah !== undefined) {
                document.getElementById('globalMin').value = data.batas_bawah;
                document.getElementById('minValue').textContent = data.batas_bawah;
            }
            
            if (data.batas_atas !== undefined) {
                document.getElementById('globalMax').value = data.batas_atas;
                document.getElementById('maxValue').textContent = data.batas_atas;
            }
        }
    });
}

// Load saved settings on page load
window.addEventListener('DOMContentLoaded', () => {
    
    // Update display when slider changes - Minimum
    document.getElementById('globalMin').addEventListener('input', function() {
        const value = parseInt(this.value);
        const maxValue = parseInt(document.getElementById('globalMax').value);
        
        document.getElementById('minValue').textContent = value;
        
        // Validate: min should be less than max
        if (value >= maxValue) {
            const newMin = maxValue - 1;
            this.value = newMin;
            document.getElementById('minValue').textContent = newMin;
        }
    });
    
    // Save minimum value when slider stops
    document.getElementById('globalMin').addEventListener('change', function() {
        const value = parseInt(this.value);
        const maxValue = parseInt(document.getElementById('globalMax').value);
        
        let finalValue = value;
        
        // Validate: min should be less than max
        if (value >= maxValue) {
            finalValue = maxValue - 1;
            this.value = finalValue;
            document.getElementById('minValue').textContent = finalValue;
            showNotification('Kelembaban minimum harus lebih kecil dari maksimum', 'warning');
        }
        
        // Save to Firebase
        update(kontrolRef, {
            batas_bawah: finalValue
        }).then(() => {
            showNotification('Kelembaban minimum: ' + finalValue + '%', 'success');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
    
    // Update display when slider changes - Maximum
    document.getElementById('globalMax').addEventListener('input', function() {
        const value = parseInt(this.value);
        const minValue = parseInt(document.getElementById('globalMin').value);
        
        document.getElementById('maxValue').textContent = value;
        
        // Validate: max should be greater than min
        if (value <= minValue) {
            const newMax = minValue + 1;
            this.value = newMax;
            document.getElementById('maxValue').textContent = newMax;
        }
    });
    
    // Save maximum value when slider stops
    document.getElementById('globalMax').addEventListener('change', function() {
        const value = parseInt(this.value);
        const minValue = parseInt(document.getElementById('globalMin').value);
        
        let finalValue = value;
        
        // Validate: max should be greater than min
        if (value <= minValue) {
            finalValue = minValue + 1;
            this.value = finalValue;
            document.getElementById('maxValue').textContent = finalValue;
            showNotification('Kelembaban maksimum harus lebih besar dari minimum', 'warning');
        }
        
        // Save to Firebase
        update(kontrolRef, {
            batas_atas: finalValue
        }).then(() => {
            showNotification('Kelembaban maksimum: ' + finalValue + '%', 'success');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
});
