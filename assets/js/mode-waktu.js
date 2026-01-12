import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

// Global state
let isMainModeActive = false;
let scheduleSettings = {
    schedule1: { time: '', duration: 30 },
    schedule2: { time: '', duration: 15 }
};

// Notification function
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageEl = notification.querySelector('.notification-message');
    
    notification.classList.remove('success', 'error', 'warning', 'hidden');
    notification.classList.add(type);
    messageEl.textContent = message;
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

// Authentication check
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('dashboardPage').style.display = 'block';
        document.getElementById('loginMessage').hidden = true;
        initializeMode();
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

// Toggle main mode
window.toggleMainMode = function() {
    isMainModeActive = !isMainModeActive;
    const mainToggle = document.getElementById('mainToggle');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (isMainModeActive) {
        mainToggle.classList.add('active');
        statusIndicator.classList.add('active');
        statusText.textContent = 'Aktif';
        showNotification('Mode Waktu diaktifkan - Semua pot akan disiram sesuai jadwal', 'success');
        
        // Enable inputs
        document.getElementById('schedule1Time').disabled = false;
        document.getElementById('schedule1Duration').disabled = false;
        document.getElementById('schedule2Time').disabled = false;
        document.getElementById('schedule2Duration').disabled = false;
    } else {
        mainToggle.classList.remove('active');
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Tidak Aktif';
        showNotification('Mode Waktu dinonaktifkan', 'warning');
        
        // Disable inputs
        document.getElementById('schedule1Time').disabled = true;
        document.getElementById('schedule1Duration').disabled = true;
        document.getElementById('schedule2Time').disabled = true;
        document.getElementById('schedule2Duration').disabled = true;
    }
    
    // Save to Firebase
    update(kontrolRef, {
        waktu: isMainModeActive
    }).catch((error) => {
        console.error('Error updating Firebase:', error);
        showNotification('Gagal menyimpan ke server', 'error');
    });
};

// Initialize mode
function initializeMode() {
    // Load from Firebase
    onValue(kontrolRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('Controller data loaded:', data);
            
            // Update mode status
            if (data.waktu !== undefined) {
                isMainModeActive = data.waktu;
                const mainToggle = document.getElementById('mainToggle');
                const statusIndicator = document.getElementById('statusIndicator');
                const statusText = document.getElementById('statusText');
                
                if (isMainModeActive) {
                    mainToggle.classList.add('active');
                    statusIndicator.classList.add('active');
                    statusText.textContent = 'Aktif';
                    
                    // Enable inputs
                    document.getElementById('schedule1Time').disabled = false;
                    document.getElementById('schedule1Duration').disabled = false;
                    document.getElementById('schedule2Time').disabled = false;
                    document.getElementById('schedule2Duration').disabled = false;
                } else {
                    mainToggle.classList.remove('active');
                    statusIndicator.classList.remove('active');
                    statusText.textContent = 'Tidak Aktif';
                    
                    // Disable inputs
                    document.getElementById('schedule1Time').disabled = true;
                    document.getElementById('schedule1Duration').disabled = true;
                    document.getElementById('schedule2Time').disabled = true;
                    document.getElementById('schedule2Duration').disabled = true;
                }
            }
            
            // Update schedule values
            if (data.waktu_1 !== undefined && data.waktu_1 !== '') {
                document.getElementById('schedule1Time').value = data.waktu_1;
                scheduleSettings.schedule1.time = data.waktu_1;
            }
            
            if (data.durasi_1 !== undefined) {
                document.getElementById('schedule1Duration').value = data.durasi_1;
                scheduleSettings.schedule1.duration = data.durasi_1;
            }
            
            if (data.waktu_2 !== undefined && data.waktu_2 !== '') {
                document.getElementById('schedule2Time').value = data.waktu_2;
                scheduleSettings.schedule2.time = data.waktu_2;
            }
            
            if (data.durasi_2 !== undefined) {
                document.getElementById('schedule2Duration').value = data.durasi_2;
                scheduleSettings.schedule2.duration = data.durasi_2;
            }
        }
    });
    
    // Setup input listeners
    setupInputListeners();
}

// Setup input listeners
function setupInputListeners() {
    // Schedule 1 time
    document.getElementById('schedule1Time').addEventListener('change', function() {
        scheduleSettings.schedule1.time = this.value;
        update(kontrolRef, {
            waktu_1: this.value
        }).then(() => {
            showNotification('Waktu penyiraman 1 diperbarui', 'success');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
    
    // Schedule 1 duration
    document.getElementById('schedule1Duration').addEventListener('change', function() {
        const duration = parseInt(this.value);
        scheduleSettings.schedule1.duration = duration;
        update(kontrolRef, {
            durasi_1: duration
        }).then(() => {
            showNotification('Durasi penyiraman 1 diperbarui', 'success');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
    
    // Schedule 2 time
    document.getElementById('schedule2Time').addEventListener('change', function() {
        scheduleSettings.schedule2.time = this.value;
        update(kontrolRef, {
            waktu_2: this.value
        }).then(() => {
            showNotification('Waktu penyiraman 2 diperbarui', 'success');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
    
    // Schedule 2 duration
    document.getElementById('schedule2Duration').addEventListener('change', function() {
        const duration = parseInt(this.value);
        scheduleSettings.schedule2.duration = duration;
        update(kontrolRef, {
            durasi_2: duration
        }).then(() => {
            showNotification('Durasi penyiraman 2 diperbarui', 'success');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
}
