// Import Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';
import { getDatabase, ref, onValue, update } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js';

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
const KONTROL_BASE_PATH = 'kontrol_1';
const kontrolRef = ref(database, KONTROL_BASE_PATH);
let activeThresholdKey = 'threshold_1';
let lastKontrolData = {};
let thresholdProfiles = ['threshold_1'];

function getThresholdNumber(thresholdKey) {
    const match = String(thresholdKey || '').match(/^threshold_(\d+)$/i);
    return match ? parseInt(match[1], 10) : 1;
}

function extractThresholdKeys(data) {
    const keys = Object.keys(data || {})
        .filter((key) => /^threshold_\d+$/i.test(key))
        .sort((a, b) => getThresholdNumber(a) - getThresholdNumber(b));

    return keys.length > 0 ? keys : ['threshold_1'];
}

function resolveThresholdKey(value) {
    if (!value) {
        return thresholdProfiles[0] || 'threshold_1';
    }

    return thresholdProfiles.includes(value) ? value : (thresholdProfiles[0] || 'threshold_1');
}

function getThresholdLabel(thresholdKey) {
    return `Threshold ${getThresholdNumber(thresholdKey)}`;
}

function normalizePotAktif(potAktifSource = {}) {
    return {
        pot_1: potAktifSource.pot_1 === true,
        pot_2: potAktifSource.pot_2 === true,
        pot_3: potAktifSource.pot_3 === true,
        pot_4: potAktifSource.pot_4 === true,
        pot_5: potAktifSource.pot_5 === true
    };
}

function getThresholdDataByKey(data, thresholdKey) {
    const source = data?.[thresholdKey] || {};
    const batasBawah = Number(source.batas_bawah);
    const batasAtas = Number(source.batas_atas);

    return {
        batas_bawah: Number.isFinite(batasBawah) ? batasBawah : 30,
        batas_atas: Number.isFinite(batasAtas) ? batasAtas : 70,
        pot_aktif: normalizePotAktif(source.pot_aktif),
        pompa_air: !!source.pompa_air,
        pompa_pupuk: !!source.pompa_pupuk,
        pompa_pengaduk: !!source.pompa_pengaduk,
        aktif: source.aktif === true,
        smart_mode: source.smart_mode === true
    };
}

function getActiveThresholdData(data) {
    return getThresholdDataByKey(data, activeThresholdKey);
}

function getNextThresholdKey() {
    const indices = thresholdProfiles.map(getThresholdNumber).filter((value) => Number.isFinite(value));
    const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 1;
    return `threshold_${nextIndex}`;
}

function updateThresholdProfileUI() {
    const activeLabel = document.getElementById('activeThresholdLabel');
    if (activeLabel) {
        activeLabel.textContent = `Profil aktif: ${getThresholdLabel(activeThresholdKey)}`;
    }

    const container = document.getElementById('thresholdProfileContainer');
    if (!container) {
        return;
    }

    container.innerHTML = thresholdProfiles.map((thresholdKey) => {
        const thresholdData = getThresholdDataByKey(lastKontrolData, thresholdKey);
        const isActive = thresholdKey === activeThresholdKey;
        const deleteDisabled = thresholdProfiles.length <= 1;

        return `
            <div class="threshold-profile-item ${isActive ? 'active' : ''}">
                <div class="threshold-profile-item-main">
                    <div class="threshold-profile-item-title">${getThresholdLabel(thresholdKey)}</div>
                    <div class="threshold-profile-item-meta">Min ${thresholdData.batas_bawah}% | Max ${thresholdData.batas_atas}%</div>
                </div>
                <div class="threshold-profile-item-actions">
                    <button type="button" class="threshold-action-btn btn-activate-threshold ${isActive ? 'active' : ''}" data-threshold-action="select" data-threshold-key="${thresholdKey}">${isActive ? 'Aktif' : 'Pilih'}</button>
                    <button type="button" class="threshold-action-btn btn-delete-threshold" data-threshold-action="delete" data-threshold-key="${thresholdKey}" ${deleteDisabled ? 'disabled' : ''}>Hapus</button>
                </div>
            </div>
        `;
    }).join('');
}

async function switchThresholdProfile(selectedKey) {
    const thresholdKey = resolveThresholdKey(selectedKey);
    if (thresholdKey === activeThresholdKey) {
        return;
    }

    const previousKey = activeThresholdKey;
    activeThresholdKey = thresholdKey;
    updateThresholdProfileUI();
    applyThresholdDataToUI(getActiveThresholdData(lastKontrolData));

    try {
        await update(kontrolRef, {
            threshold_aktif: thresholdKey
        });
        showNotification(`Berpindah ke ${getThresholdLabel(thresholdKey)}`, 'info');
    } catch (error) {
        console.error('Error switching threshold profile:', error);
        activeThresholdKey = previousKey;
        updateThresholdProfileUI();
        applyThresholdDataToUI(getActiveThresholdData(lastKontrolData));
        showNotification('Gagal mengganti profil threshold', 'error');
    }
}

async function addThresholdProfile() {
    const newThresholdKey = getNextThresholdKey();
    const baseData = getActiveThresholdData(lastKontrolData);

    const payload = {
        aktif: mainModeActive,
        smart_mode: mainModeActive,
        batas_bawah: baseData.batas_bawah,
        batas_atas: baseData.batas_atas,
        pompa_air: baseData.pompa_air,
        pompa_pupuk: baseData.pompa_pupuk,
        pompa_pengaduk: baseData.pompa_pengaduk,
        pot_aktif: normalizePotAktif(baseData.pot_aktif)
    };

    try {
        await update(kontrolRef, {
            [newThresholdKey]: payload,
            threshold_aktif: newThresholdKey
        });
        showNotification(`${getThresholdLabel(newThresholdKey)} berhasil ditambahkan`, 'success');
    } catch (error) {
        console.error('Error adding threshold profile:', error);
        showNotification('Gagal menambah profil threshold', 'error');
    }
}

async function deleteThresholdProfile(thresholdKey) {
    if (!thresholdProfiles.includes(thresholdKey)) {
        return;
    }

    if (thresholdProfiles.length <= 1) {
        showNotification('Minimal harus ada 1 profil threshold', 'warning');
        return;
    }

    if (!confirm(`Hapus ${getThresholdLabel(thresholdKey)}?`)) {
        return;
    }

    const fallbackKey = thresholdProfiles.find((key) => key !== thresholdKey) || 'threshold_1';
    const updates = {
        [thresholdKey]: null
    };

    if (activeThresholdKey === thresholdKey) {
        updates.threshold_aktif = fallbackKey;
    }

    try {
        await update(kontrolRef, updates);
        showNotification(`${getThresholdLabel(thresholdKey)} berhasil dihapus`, 'success');
    } catch (error) {
        console.error('Error deleting threshold profile:', error);
        showNotification('Gagal menghapus profil threshold', 'error');
    }
}

function applyThresholdDataToUI(thresholdData) {
    // Update slider values
    document.getElementById('globalMin').value = thresholdData.batas_bawah;
    document.getElementById('minValue').textContent = thresholdData.batas_bawah;
    document.getElementById('globalMax').value = thresholdData.batas_atas;
    document.getElementById('maxValue').textContent = thresholdData.batas_atas;

    // Load selected pots
    for (let i = 1; i <= 5; i++) {
        const checkbox = document.getElementById(`pot${i}`);
        const potKey = `pot_${i}`;
        if (checkbox) {
            checkbox.checked = thresholdData.pot_aktif[potKey] === true;
        }
    }

    // Load pump states
    const pompaAir = document.getElementById('pompaAir');
    const pompaNutrisi = document.getElementById('pompaNutrisi');
    const pengadukOtomatis = document.getElementById('pengadukOtomatis');
    const pompaAirOption = pompaAir?.closest('.pump-option');
    const pompaNutrisiOption = pompaNutrisi?.closest('.pump-option');
    const pengadukOption = pengadukOtomatis?.closest('.pump-option');

    if (!pompaAir || !pompaNutrisi) {
        return;
    }

    pompaAir.checked = thresholdData.pompa_air;
    pompaNutrisi.checked = thresholdData.pompa_pupuk;
    if (pengadukOtomatis) {
        pengadukOtomatis.checked = thresholdData.pompa_pengaduk;
    }

    pompaAirOption?.classList.remove('active', 'inactive');
    pompaNutrisiOption?.classList.remove('active', 'inactive');
    pengadukOption?.classList.remove('active', 'inactive');

    if (pengadukOtomatis?.checked) {
        pengadukOption?.classList.add('active');
        pompaAirOption?.classList.add('inactive');
        pompaNutrisiOption?.classList.add('inactive');
    } else if (pompaNutrisi.checked) {
        pompaNutrisiOption?.classList.add('active');
        pompaAirOption?.classList.add('inactive');
        pengadukOption?.classList.add('inactive');
    } else if (pompaAir.checked) {
        pompaAirOption?.classList.add('active');
        pompaNutrisiOption?.classList.add('inactive');
        pengadukOption?.classList.add('inactive');
    }
}

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
    const loginMessage = document.getElementById('loginMessage');

    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('dashboardPage').style.display = 'block';
        if (loginMessage) {
            loginMessage.hidden = true;
        }
        loadControllerData(); // Load data from Firebase
    } else {
        document.getElementById('dashboardPage').style.display = 'none';
        if (loginMessage) {
            loginMessage.hidden = false;
        }
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
    const pengadukOtomatis = document.getElementById('pengadukOtomatis');
    
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
        if (pengadukOtomatis) pengadukOtomatis.disabled = false;
        
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
        if (pengadukOtomatis) pengadukOtomatis.disabled = true;
        
        showNotification('Mode Otomatis dinonaktifkan', 'info');
    }
    
    // Save to Firebase
    update(kontrolRef, {
        otomatis: mainModeActive,
        [`${activeThresholdKey}/aktif`]: mainModeActive,
        [`${activeThresholdKey}/smart_mode`]: mainModeActive,
        threshold_aktif: activeThresholdKey
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
            lastKontrolData = data;
            thresholdProfiles = extractThresholdKeys(data);

            if (data.threshold_aktif) {
                activeThresholdKey = resolveThresholdKey(data.threshold_aktif);
            } else {
                activeThresholdKey = resolveThresholdKey(activeThresholdKey);
            }

            updateThresholdProfileUI();
            const thresholdData = getActiveThresholdData(data);
            console.log('Controller data loaded:', data);
            
            // Get all pot checkboxes and action buttons
            const potCheckboxes = document.querySelectorAll('.pot-checkbox');
            const selectAllBtn = document.getElementById('selectAllBtn');
            const deselectAllBtn = document.getElementById('deselectAllBtn');
            
            // Get pump toggles
            const pompaAir = document.getElementById('pompaAir');
            const pompaNutrisi = document.getElementById('pompaNutrisi');
            const pengadukOtomatis = document.getElementById('pengadukOtomatis');
            
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
                    if (pengadukOtomatis) pengadukOtomatis.disabled = false;
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
                    if (pengadukOtomatis) pengadukOtomatis.disabled = true;
                }
            }

            applyThresholdDataToUI(thresholdData);
        }
    });
}

// Load saved settings on page load
window.addEventListener('DOMContentLoaded', () => {
    updateThresholdProfileUI();

    document.getElementById('btnAddThreshold')?.addEventListener('click', () => {
        addThresholdProfile();
    });

    document.getElementById('thresholdProfileContainer')?.addEventListener('click', (event) => {
        const actionBtn = event.target.closest('[data-threshold-action]');
        if (!actionBtn) {
            return;
        }

        const action = actionBtn.dataset.thresholdAction;
        const thresholdKey = actionBtn.dataset.thresholdKey;
        if (!thresholdKey) {
            return;
        }

        if (action === 'select') {
            switchThresholdProfile(thresholdKey);
            return;
        }

        if (action === 'delete') {
            deleteThresholdProfile(thresholdKey);
        }
    });
    
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
            [`${activeThresholdKey}/batas_bawah`]: finalValue
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
            [`${activeThresholdKey}/batas_atas`]: finalValue
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
            const potNumber = potId.replace('pot', '');
            const potKey = `pot_${potNumber}`;
            
            // Save to Firebase
            update(kontrolRef, {
                [`${activeThresholdKey}/pot_aktif/${potKey}`]: isChecked
            }).then(() => {
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
                const potNumber = checkbox.id.replace('pot', '');
                updates[`${activeThresholdKey}/pot_aktif/pot_${potNumber}`] = true;
            }
        });
        
        // Save all to Firebase
        update(kontrolRef, updates).then(() => {
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
                const potNumber = checkbox.id.replace('pot', '');
                updates[`${activeThresholdKey}/pot_aktif/pot_${potNumber}`] = false;
            }
        });
        
        // Save all to Firebase
        update(kontrolRef, updates).then(() => {
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
        const pengadukOtomatis = document.getElementById('pengadukOtomatis');
        const pompaAirOption = this.closest('.pump-option');
        const pompaNutrisiOption = pompaNutrisi.closest('.pump-option');
        const pengadukOption = pengadukOtomatis ? pengadukOtomatis.closest('.pump-option') : null;
        
        // If pompa air is checked, uncheck pompa nutrisi
        if (isChecked) {
            pompaNutrisi.checked = false;
            if (pengadukOtomatis) pengadukOtomatis.checked = false;
            pompaAirOption.classList.add('active');
            pompaAirOption.classList.remove('inactive');
            pompaNutrisiOption.classList.remove('active');
            pompaNutrisiOption.classList.add('inactive');
            pengadukOption?.classList.remove('active');
            pengadukOption?.classList.add('inactive');
        } else {
            pompaAirOption.classList.remove('active');
            pompaAirOption.classList.remove('inactive');
            pompaNutrisiOption.classList.remove('inactive');
            pengadukOption?.classList.remove('inactive');
        }
        
        // Save to Firebase
        const updates = {
            [`${activeThresholdKey}/pompa_air`]: isChecked,
            [`${activeThresholdKey}/pompa_pupuk`]: false,
            [`${activeThresholdKey}/pompa_pengaduk`]: false
        };
        
        update(kontrolRef, updates).then(() => {
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
        const pengadukOtomatis = document.getElementById('pengadukOtomatis');
        const pompaNutrisiOption = this.closest('.pump-option');
        const pompaAirOption = pompaAir.closest('.pump-option');
        const pengadukOption = pengadukOtomatis ? pengadukOtomatis.closest('.pump-option') : null;
        
        // If pompa nutrisi is checked, uncheck pompa air
        if (isChecked) {
            pompaAir.checked = false;
            if (pengadukOtomatis) pengadukOtomatis.checked = false;
            pompaNutrisiOption.classList.add('active');
            pompaNutrisiOption.classList.remove('inactive');
            pompaAirOption.classList.remove('active');
            pompaAirOption.classList.add('inactive');
            pengadukOption?.classList.remove('active');
            pengadukOption?.classList.add('inactive');
        } else {
            pompaNutrisiOption.classList.remove('active');
            pompaNutrisiOption.classList.remove('inactive');
            pompaAirOption.classList.remove('inactive');
            pengadukOption?.classList.remove('inactive');
        }
        
        // Save to Firebase
        const updates = {
            [`${activeThresholdKey}/pompa_air`]: false,
            [`${activeThresholdKey}/pompa_pupuk`]: isChecked,
            [`${activeThresholdKey}/pompa_pengaduk`]: false
        };
        
        update(kontrolRef, updates).then(() => {
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

    // Pengaduk toggle event listener
    const pengadukToggle = document.getElementById('pengadukOtomatis');
    if (pengadukToggle) {
        pengadukToggle.addEventListener('change', function() {
            const isChecked = this.checked;
            const pompaAir = document.getElementById('pompaAir');
            const pompaNutrisi = document.getElementById('pompaNutrisi');

            const pengadukOption = this.closest('.pump-option');
            const pompaAirOption = pompaAir.closest('.pump-option');
            const pompaNutrisiOption = pompaNutrisi.closest('.pump-option');

            if (isChecked) {
                pompaAir.checked = false;
                pompaNutrisi.checked = false;

                pengadukOption.classList.add('active');
                pengadukOption.classList.remove('inactive');

                pompaAirOption.classList.remove('active');
                pompaAirOption.classList.add('inactive');

                pompaNutrisiOption.classList.remove('active');
                pompaNutrisiOption.classList.add('inactive');
            } else {
                pengadukOption.classList.remove('active');
                pengadukOption.classList.remove('inactive');
                pompaAirOption.classList.remove('inactive');
                pompaNutrisiOption.classList.remove('inactive');
            }

            const updates = {
                [`${activeThresholdKey}/pompa_air`]: false,
                [`${activeThresholdKey}/pompa_pupuk`]: false,
                [`${activeThresholdKey}/pompa_pengaduk`]: isChecked
            };

            update(kontrolRef, updates).then(() => {
                if (isChecked) {
                    showNotification('Pengaduk diaktifkan untuk mode otomatis', 'success');
                } else {
                    showNotification('Pengaduk dinonaktifkan untuk mode otomatis', 'info');
                }
            }).catch((error) => {
                console.error('Error updating Firebase:', error);
                showNotification('Gagal menyimpan ke server', 'error');
                this.checked = !isChecked;
            });
        });
    }
});
