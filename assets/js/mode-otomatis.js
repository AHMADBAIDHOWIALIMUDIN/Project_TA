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
    console.log('showNotification called:', message, type); // Debug log
    
    const notification = document.getElementById('notification');
    if (!notification) {
        console.error('Notification element not found');
        return;
    }
    
    console.log('Notification element found, showing...'); // Debug log
    
    // Set notification type and message
    notification.className = `notification ${type}`;
    
    // Update icon
    const icon = notification.querySelector('.notification-icon');
    if (icon) {
        if (type === 'success') {
            icon.className = 'notification-icon fas fa-check-circle';
        } else if (type === 'error') {
            icon.className = 'notification-icon fas fa-exclamation-circle';
        } else if (type === 'info') {
            icon.className = 'notification-icon fas fa-info-circle';
        } else if (type === 'warning') {
            icon.className = 'notification-icon fas fa-exclamation-triangle';
        }
    }
    
    // Update message
    const messageEl = notification.querySelector('.notification-message');
    if (messageEl) {
        messageEl.textContent = message;
    }
    
    // Show notification
    notification.classList.add('show');
    notification.classList.remove('hidden');
    
    console.log('Notification shown with classes:', notification.className); // Debug log

    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hidden');
        console.log('Notification hidden'); // Debug log
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
    
    // Get all pot checkboxes and action buttons
    const potCheckboxes = document.querySelectorAll('.pot-checkbox');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const deselectAllBtn = document.getElementById('deselectAllBtn');
    
    // Get pump toggles
    const pompaAir = document.getElementById('pompaAir');
    const pompaNutrisi = document.getElementById('pompaNutrisi');
    
    if (mainModeActive) {
        mainToggle.classList.add('active');
        statusIndicator.classList.add('active');
        statusText.textContent = 'Aktif';
        globalMinSlider.disabled = false;
        globalMaxSlider.disabled = false;
        
        // Enable pot selection
        potCheckboxes.forEach(checkbox => checkbox.disabled = false);
        selectAllBtn.disabled = false;
        deselectAllBtn.disabled = false;
        
        // Enable pump selection
        pompaAir.disabled = false;
        pompaNutrisi.disabled = false;
        
        showNotification('Mode Otomatis diaktifkan', 'success');
    } else {
        mainToggle.classList.remove('active');
        statusIndicator.classList.remove('active');
        statusText.textContent = 'Tidak Aktif';
        globalMinSlider.disabled = true;
        globalMaxSlider.disabled = true;
        
        // Disable pot selection
        potCheckboxes.forEach(checkbox => checkbox.disabled = true);
        selectAllBtn.disabled = true;
        deselectAllBtn.disabled = true;
        
        // Disable pump selection
        pompaAir.disabled = true;
        pompaNutrisi.disabled = true;
        
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
            
            // Get all pot checkboxes and action buttons
            const potCheckboxes = document.querySelectorAll('.pot-checkbox');
            const selectAllBtn = document.getElementById('selectAllBtn');
            const deselectAllBtn = document.getElementById('deselectAllBtn');
            
            // Get pump toggles
            const pompaAir = document.getElementById('pompaAir');
            const pompaNutrisi = document.getElementById('pompaNutrisi');
            
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
                    
                    // Enable pot selection
                    potCheckboxes.forEach(checkbox => checkbox.disabled = false);
                    selectAllBtn.disabled = false;
                    deselectAllBtn.disabled = false;
                    
                    // Enable pump selection
                    pompaAir.disabled = false;
                    pompaNutrisi.disabled = false;
                } else {
                    mainToggle.classList.remove('active');
                    statusIndicator.classList.remove('active');
                    statusText.textContent = 'Tidak Aktif';
                    globalMinSlider.disabled = true;
                    globalMaxSlider.disabled = true;
                    
                    // Disable pot selection
                    potCheckboxes.forEach(checkbox => checkbox.disabled = true);
                    selectAllBtn.disabled = true;
                    deselectAllBtn.disabled = true;
                    
                    // Disable pump selection
                    pompaAir.disabled = true;
                    pompaNutrisi.disabled = true;
                }
            }
            
            // Load selected pots
            if (data.pot_otomatis !== undefined) {
                for (let i = 1; i <= 5; i++) {
                    const checkbox = document.getElementById(`pot${i}`);
                    if (checkbox && data.pot_otomatis[`pot${i}`] !== undefined) {
                        checkbox.checked = data.pot_otomatis[`pot${i}`];
                    }
                }
            }
            
            // Load pump states
            if (data.pompa_otomatis !== undefined) {
                const pompaAirOption = pompaAir.closest('.pump-option');
                const pompaNutrisiOption = pompaNutrisi.closest('.pump-option');
                
                // Reset classes first
                pompaAirOption.classList.remove('active', 'inactive');
                pompaNutrisiOption.classList.remove('active', 'inactive');
                
                if (data.pompa_otomatis.pompa_air !== undefined) {
                    pompaAir.checked = data.pompa_otomatis.pompa_air;
                    if (data.pompa_otomatis.pompa_air) {
                        pompaAirOption.classList.add('active');
                        pompaNutrisiOption.classList.add('inactive');
                    }
                }
                if (data.pompa_otomatis.pompa_nutrisi !== undefined) {
                    pompaNutrisi.checked = data.pompa_otomatis.pompa_nutrisi;
                    if (data.pompa_otomatis.pompa_nutrisi) {
                        pompaNutrisiOption.classList.add('active');
                        pompaAirOption.classList.add('inactive');
                    }
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
    
    // Pot checkbox event listeners
    const potCheckboxes = document.querySelectorAll('.pot-checkbox');
    potCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const potId = this.id;
            const isChecked = this.checked;
            
            // Save to Firebase
            const potOtomatisPath = `pot_otomatis/${potId}`;
            update(ref(database, 'kontrol'), {
                [`pot_otomatis/${potId}`]: isChecked
            }).then(() => {
                const potNumber = potId.replace('pot', '');
                if (isChecked) {
                    showNotification(`Pot ${potNumber} dipilih untuk penyiraman otomatis`, 'success');
                } else {
                    showNotification(`Pot ${potNumber} tidak dipilih untuk penyiraman otomatis`, 'info');
                }
            }).catch((error) => {
                console.error('Error updating Firebase:', error);
                showNotification('Gagal menyimpan ke server', 'error');
                // Revert checkbox state on error
                this.checked = !isChecked;
            });
        });
    });
    
    // Select All button
    document.getElementById('selectAllBtn').addEventListener('click', function() {
        const potCheckboxes = document.querySelectorAll('.pot-checkbox');
        const updates = {};
        
        potCheckboxes.forEach(checkbox => {
            if (!checkbox.disabled) {
                checkbox.checked = true;
                updates[`pot_otomatis/${checkbox.id}`] = true;
            }
        });
        
        // Save all to Firebase
        update(ref(database, 'kontrol'), updates).then(() => {
            showNotification('Semua pot dipilih untuk penyiraman otomatis', 'success');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
    
    // Deselect All button
    document.getElementById('deselectAllBtn').addEventListener('click', function() {
        const potCheckboxes = document.querySelectorAll('.pot-checkbox');
        const updates = {};
        
        potCheckboxes.forEach(checkbox => {
            if (!checkbox.disabled) {
                checkbox.checked = false;
                updates[`pot_otomatis/${checkbox.id}`] = false;
            }
        });
        
        // Save all to Firebase
        update(ref(database, 'kontrol'), updates).then(() => {
            showNotification('Semua pot tidak dipilih untuk penyiraman otomatis', 'info');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
        });
    });
    
    // Pompa Air toggle event listener
    document.getElementById('pompaAir').addEventListener('change', function() {
        const isChecked = this.checked;
        const pompaNutrisi = document.getElementById('pompaNutrisi');
        const pompaAirOption = this.closest('.pump-option');
        const pompaNutrisiOption = pompaNutrisi.closest('.pump-option');
        
        // If pompa air is checked, uncheck pompa nutrisi
        if (isChecked) {
            pompaNutrisi.checked = false;
            pompaAirOption.classList.add('active');
            pompaAirOption.classList.remove('inactive');
            pompaNutrisiOption.classList.remove('active');
            pompaNutrisiOption.classList.add('inactive');
        } else {
            pompaAirOption.classList.remove('active');
            pompaAirOption.classList.remove('inactive');
            pompaNutrisiOption.classList.remove('inactive');
        }
        
        // Save to Firebase
        const updates = {
            'pompa_otomatis/pompa_air': isChecked,
            'pompa_otomatis/pompa_nutrisi': false
        };
        
        update(ref(database, 'kontrol'), updates).then(() => {
            if (isChecked) {
                showNotification('Pompa Air diaktifkan untuk mode otomatis', 'success');
            } else {
                showNotification('Pompa Air dinonaktifkan untuk mode otomatis', 'info');
            }
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
            // Revert toggle state on error
            this.checked = !isChecked;
        });
    });
    
    // Pompa Nutrisi toggle event listener
    document.getElementById('pompaNutrisi').addEventListener('change', function() {
        const isChecked = this.checked;
        const pompaAir = document.getElementById('pompaAir');
        const pompaNutrisiOption = this.closest('.pump-option');
        const pompaAirOption = pompaAir.closest('.pump-option');
        
        // If pompa nutrisi is checked, uncheck pompa air
        if (isChecked) {
            pompaAir.checked = false;
            pompaNutrisiOption.classList.add('active');
            pompaNutrisiOption.classList.remove('inactive');
            pompaAirOption.classList.remove('active');
            pompaAirOption.classList.add('inactive');
        } else {
            pompaNutrisiOption.classList.remove('active');
            pompaNutrisiOption.classList.remove('inactive');
            pompaAirOption.classList.remove('inactive');
        }
        
        // Save to Firebase
        const updates = {
            'pompa_otomatis/pompa_air': false,
            'pompa_otomatis/pompa_nutrisi': isChecked
        };
        
        update(ref(database, 'kontrol'), updates).then(() => {
            if (isChecked) {
                showNotification('Pompa Larutan Nutrisi diaktifkan untuk mode otomatis', 'success');
            } else {
                showNotification('Pompa Larutan Nutrisi dinonaktifkan untuk mode otomatis', 'info');
            }
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
            showNotification('Gagal menyimpan ke server', 'error');
            // Revert toggle state on error
            this.checked = !isChecked;
        });
    });
});
