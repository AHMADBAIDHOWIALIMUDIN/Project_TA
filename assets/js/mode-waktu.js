// mode-waktu.js - Mode Waktu Controller with CRUD

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getDatabase, ref, set, onValue, get, push, update, remove } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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

let schedules = [];
let isPageLoaded = false;
let pumpWaktuState = {
    pompa_air: false,
    pompa_nutrisi: false,
    pengaduk: false
};

// Notification function
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) {
        const notif = document.createElement('div');
        notif.id = 'notification';
        notif.className = `notification ${type}`;
        notif.textContent = message;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    } else {
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

// Authentication check
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('dashboardPage').style.display = 'block';
        // document.getElementById('loginMessage').hidden = true;
        initializeMode();
    } else {
        document.getElementById('dashboardPage').style.display = 'none';
        // document.getElementById('loginMessage').hidden = false;
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

// Logout handler
document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = '../index.html';
    } catch (error) {
        showNotification('Error logging out: ' + error.message, 'error');
    }
});

// Initialize mode
function initializeMode() {
    const statusRef = ref(database, 'kontrol/waktu');
    const pumpWaktuRef = ref(database, 'kontrol/pompa_waktu');
    
    onValue(statusRef, (snapshot) => {
        const isActive = snapshot.val() === true || snapshot.val() === 1;
        const mainToggle = document.getElementById('mainToggle');
        const statusIndicator = document.getElementById('statusIndicator');
        const statusText = document.getElementById('statusText');
        const btnAddSchedule = document.getElementById('btnAddSchedule');
        const pompaAirWaktu = document.getElementById('pompaAirWaktu');
        const pompaNutrisiWaktu = document.getElementById('pompaNutrisiWaktu');
        const pengadukWaktu = document.getElementById('pengadukWaktu');
        
        if (mainToggle) {
            if (isActive) {
                mainToggle.classList.add('active');
            } else {
                mainToggle.classList.remove('active');
            }
        }
        
        if (statusIndicator) {
            if (isActive) {
                statusIndicator.classList.add('active');
                statusText.textContent = 'Aktif';
                if (btnAddSchedule) btnAddSchedule.disabled = false;
                if (pompaAirWaktu) pompaAirWaktu.disabled = false;
                if (pompaNutrisiWaktu) pompaNutrisiWaktu.disabled = false;
                if (pengadukWaktu) pengadukWaktu.disabled = false;
            } else {
                statusIndicator.classList.remove('active');
                statusText.textContent = 'Tidak Aktif';
                if (btnAddSchedule) btnAddSchedule.disabled = true;
                if (pompaAirWaktu) pompaAirWaktu.disabled = true;
                if (pompaNutrisiWaktu) pompaNutrisiWaktu.disabled = true;
                if (pengadukWaktu) pengadukWaktu.disabled = true;
            }
        }
    });

    // Load pump state (Air/Nutrisi) for mode waktu
    onValue(pumpWaktuRef, (snapshot) => {
        const data = snapshot.val() || {};
        pumpWaktuState = {
            pompa_air: !!data.pompa_air,
            pompa_nutrisi: !!data.pompa_nutrisi,
            pengaduk: !!data.pengaduk
        };

        const pompaAirWaktu = document.getElementById('pompaAirWaktu');
        const pompaNutrisiWaktu = document.getElementById('pompaNutrisiWaktu');
        const pengadukWaktu = document.getElementById('pengadukWaktu');
        if (!pompaAirWaktu || !pompaNutrisiWaktu || !pengadukWaktu) return;

        const pompaAirOption = pompaAirWaktu.closest('.pump-option');
        const pompaNutrisiOption = pompaNutrisiWaktu.closest('.pump-option');
        const pengadukOption = pengadukWaktu.closest('.pump-option');

        pompaAirWaktu.checked = pumpWaktuState.pompa_air;
        pompaNutrisiWaktu.checked = pumpWaktuState.pompa_nutrisi;
        pengadukWaktu.checked = pumpWaktuState.pengaduk;

        pompaAirOption?.classList.remove('active', 'inactive');
        pompaNutrisiOption?.classList.remove('active', 'inactive');
        pengadukOption?.classList.remove('active', 'inactive');

        // Apply active/inactive styling (priority: pengaduk > nutrisi > air)
        if (pumpWaktuState.pengaduk) {
            pengadukOption?.classList.add('active');
            pompaAirOption?.classList.add('inactive');
            pompaNutrisiOption?.classList.add('inactive');
        } else if (pumpWaktuState.pompa_nutrisi) {
            pompaNutrisiOption?.classList.add('active');
            pompaAirOption?.classList.add('inactive');
            pengadukOption?.classList.add('inactive');
        } else if (pumpWaktuState.pompa_air) {
            pompaAirOption?.classList.add('active');
            pompaNutrisiOption?.classList.add('inactive');
            pengadukOption?.classList.add('inactive');
        }
    });
    
    // Load schedules from Firebase
    loadSchedulesFromFirebase();
    
    // Setup add schedule button
    setupAddScheduleButton();
    
    isPageLoaded = true;

    // Setup pump toggles
    setupPumpToggles();
}

function setupPumpToggles() {
    const pompaAirWaktu = document.getElementById('pompaAirWaktu');
    const pompaNutrisiWaktu = document.getElementById('pompaNutrisiWaktu');
    const pengadukWaktu = document.getElementById('pengadukWaktu');
    if (!pompaAirWaktu || !pompaNutrisiWaktu || !pengadukWaktu) return;

    pompaAirWaktu.addEventListener('change', async function () {
        const isChecked = this.checked;
        const nutrisiToggle = pompaNutrisiWaktu;
        const pengadukToggle = pengadukWaktu;

        const pompaAirOption = this.closest('.pump-option');
        const pompaNutrisiOption = nutrisiToggle.closest('.pump-option');
        const pengadukOption = pengadukToggle.closest('.pump-option');

        if (isChecked) {
            nutrisiToggle.checked = false;
            pengadukToggle.checked = false;
            pompaAirOption?.classList.add('active');
            pompaAirOption?.classList.remove('inactive');
            pompaNutrisiOption?.classList.remove('active');
            pompaNutrisiOption?.classList.add('inactive');
            pengadukOption?.classList.remove('active');
            pengadukOption?.classList.add('inactive');
        } else {
            pompaAirOption?.classList.remove('active', 'inactive');
            pompaNutrisiOption?.classList.remove('inactive');
            pengadukOption?.classList.remove('inactive');
        }

        try {
            await update(ref(database, 'kontrol'), {
                'pompa_waktu/pompa_air': isChecked,
                ...(isChecked ? { 'pompa_waktu/pompa_nutrisi': false, 'pompa_waktu/pengaduk': false } : {})
            });
        } catch (error) {
            console.error('Error updating pump state:', error);
            // Revert toggle state on error
            this.checked = !isChecked;
            showNotification('Gagal menyimpan pilihan pompa', 'error');
        }
    });

    pompaNutrisiWaktu.addEventListener('change', async function () {
        const isChecked = this.checked;
        const airToggle = pompaAirWaktu;
        const pengadukToggle = pengadukWaktu;

        const pompaNutrisiOption = this.closest('.pump-option');
        const pompaAirOption = airToggle.closest('.pump-option');
        const pengadukOption = pengadukToggle.closest('.pump-option');

        if (isChecked) {
            airToggle.checked = false;
            pengadukToggle.checked = false;
            pompaNutrisiOption?.classList.add('active');
            pompaNutrisiOption?.classList.remove('inactive');
            pompaAirOption?.classList.remove('active');
            pompaAirOption?.classList.add('inactive');
            pengadukOption?.classList.remove('active');
            pengadukOption?.classList.add('inactive');
        } else {
            pompaNutrisiOption?.classList.remove('active', 'inactive');
            pompaAirOption?.classList.remove('inactive');
            pengadukOption?.classList.remove('inactive');
        }

        try {
            await update(ref(database, 'kontrol'), {
                'pompa_waktu/pompa_nutrisi': isChecked,
                ...(isChecked ? { 'pompa_waktu/pompa_air': false, 'pompa_waktu/pengaduk': false } : {})
            });
        } catch (error) {
            console.error('Error updating pump state:', error);
            // Revert toggle state on error
            this.checked = !isChecked;
            showNotification('Gagal menyimpan pilihan pompa', 'error');
        }
    });

    pengadukWaktu.addEventListener('change', async function () {
        const isChecked = this.checked;
        const airToggle = pompaAirWaktu;
        const nutrisiToggle = pompaNutrisiWaktu;

        const pengadukOption = this.closest('.pump-option');
        const pompaAirOption = airToggle.closest('.pump-option');
        const pompaNutrisiOption = nutrisiToggle.closest('.pump-option');

        if (isChecked) {
            airToggle.checked = false;
            nutrisiToggle.checked = false;
            pengadukOption?.classList.add('active');
            pengadukOption?.classList.remove('inactive');
            pompaAirOption?.classList.remove('active');
            pompaAirOption?.classList.add('inactive');
            pompaNutrisiOption?.classList.remove('active');
            pompaNutrisiOption?.classList.add('inactive');
        } else {
            pengadukOption?.classList.remove('active', 'inactive');
            pompaAirOption?.classList.remove('inactive');
            pompaNutrisiOption?.classList.remove('inactive');
        }

        try {
            await update(ref(database, 'kontrol'), {
                'pompa_waktu/pengaduk': isChecked,
                ...(isChecked ? { 'pompa_waktu/pompa_air': false, 'pompa_waktu/pompa_nutrisi': false } : {})
            });
        } catch (error) {
            console.error('Error updating pump state:', error);
            this.checked = !isChecked;
            showNotification('Gagal menyimpan pilihan pompa', 'error');
        }
    });
}

// Load schedules from Firebase
function loadSchedulesFromFirebase() {
    const schedulesRef = ref(database, 'kontrol/jadwal_waktu');
    
    onValue(schedulesRef, (snapshot) => {
        schedules = [];
        const data = snapshot.val();
        
        if (data) {
            Object.keys(data).forEach(key => {
                schedules.push({
                    id: key,
                    ...data[key]
                });
            });
        }
        
        renderSchedules();
    });
}

// Render schedules to the UI
function renderSchedules() {
    const container = document.getElementById('scheduleContainer');
    if (!container) return;
    
    if (schedules.length === 0) {
        container.innerHTML = `
            <div class="empty-schedule">
                <i class="fas fa-calendar-times"></i>
                <p>Belum ada jadwal penyiraman</p>
                <p class="empty-subtitle">Klik tombol "Tambah Jadwal" untuk membuat jadwal baru</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = schedules.map(schedule => {
        const pots = schedule.pots || [];
        const potList = pots.map(p => p.replace('pot', 'Pot ')).join(', ');
        const pumpIcon = getPumpIcon(schedule.pumpType);
        const pumpLabel = getPumpLabel(schedule.pumpType);
        
        return `
            <div class="schedule-item">
                <div class="schedule-item-header">
                    <div class="schedule-name">
                        <i class="fas fa-calendar-check"></i>
                        <span>${schedule.name || 'Jadwal Penyiraman'}</span>
                    </div>
                    <div class="schedule-actions">
                        <button class="btn-action btn-edit" onclick="editSchedule('${schedule.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action btn-duplicate" onclick="duplicateSchedule('${schedule.id}')" title="Duplikat">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteSchedule('${schedule.id}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="schedule-item-body">
                    <div class="schedule-info">
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <span>Waktu: ${schedule.time || '-'}</span>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-hourglass-half"></i>
                            <span>Durasi: ${schedule.duration || 0} detik</span>
                        </div>
                    </div>
                    <div class="schedule-info">
                        <div class="info-item">
                            <i class="fas fa-seedling"></i>
                            <span>Pot: ${potList || 'Tidak ada'}</span>
                        </div>
                        <div class="info-item">
                            <i class="${pumpIcon}"></i>
                            <span>${pumpLabel}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Get pump icon based on type
function getPumpIcon(type) {
    switch(type) {
        case 'air': return 'fas fa-water';
        case 'nutrisi': return 'fas fa-flask';
        case 'pengaduk': return 'fas fa-blender';
        default: return 'fas fa-question';
    }
}

// Get pump label based on type
function getPumpLabel(type) {
    switch(type) {
        case 'air': return 'Pompa Air';
        case 'nutrisi': return 'Pompa Nutrisi';
        case 'pengaduk': return 'Pengaduk';
        default: return 'Tidak diketahui';
    }
}

// Setup add schedule button
function setupAddScheduleButton() {
    document.getElementById('btnAddSchedule')?.addEventListener('click', () => {
        openScheduleModal();
    });
}

// Toggle main mode
window.toggleMainMode = function() {
    if (!isPageLoaded) return;
    
    const mainToggle = document.getElementById('mainToggle');
    const isActive = mainToggle.classList.contains('active');
    const newStatus = !isActive;
    const statusRef = ref(database, 'kontrol/waktu');
    
    update(ref(database, 'kontrol'), {
        waktu: newStatus
    }).then(() => {
        showNotification(newStatus ? 'Mode Waktu diaktifkan' : 'Mode Waktu dinonaktifkan', newStatus ? 'success' : 'warning');
    }).catch((error) => {
        console.error('Error updating mode:', error);
        showNotification('Gagal mengubah status mode', 'error');
    });
};

// Open schedule modal for add/edit
window.openScheduleModal = function(scheduleId = null) {
    const modal = document.getElementById('scheduleModal');
    const modalTitle = document.getElementById('modalTitle');
    
    if (scheduleId) {
        // Edit mode
        const schedule = schedules.find(s => s.id === scheduleId);
        if (schedule) {
            modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Jadwal';
            document.getElementById('editScheduleId').value = scheduleId;
            document.getElementById('scheduleName').value = schedule.name || '';
            document.getElementById('scheduleTime').value = schedule.time || '';
            document.getElementById('scheduleDuration').value = schedule.duration || 30;
            
            // Set pot checkboxes
            const checkboxes = document.querySelectorAll('.schedule-pot-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = schedule.pots && schedule.pots.includes(cb.value);
            });
            
            // Set pump type
            const pumpRadio = document.querySelector(`input[name="pumpType"][value="${schedule.pumpType}"]`);
            if (pumpRadio) pumpRadio.checked = true;
        }
    } else {
        // Add mode
        modalTitle.innerHTML = '<i class="fas fa-calendar-plus"></i> Tambah Jadwal';
        document.getElementById('editScheduleId').value = '';
        document.getElementById('scheduleName').value = '';
        document.getElementById('scheduleTime').value = '';
        document.getElementById('scheduleDuration').value = 30;
        
        // Uncheck all pots
        document.querySelectorAll('.schedule-pot-checkbox').forEach(cb => cb.checked = false);
        
        // Reset pump type (prefer global pump toggle if set)
        const preferPengaduk = pumpWaktuState.pengaduk === true;
        const preferNutrisi = pumpWaktuState.pompa_nutrisi === true;
        const preferAir = pumpWaktuState.pompa_air === true;
        const defaultPump = preferPengaduk ? 'pengaduk' : (preferNutrisi ? 'nutrisi' : (preferAir ? 'air' : 'air'));
        const defaultRadio = document.querySelector(`input[name="pumpType"][value="${defaultPump}"]`);
        if (defaultRadio) defaultRadio.checked = true;
    }
    
    modal.style.display = 'flex';
};

// Close schedule modal
window.closeScheduleModal = function() {
    document.getElementById('scheduleModal').style.display = 'none';
};

// Save schedule (add or edit)
window.saveSchedule = function() {
    const scheduleId = document.getElementById('editScheduleId').value;
    const name = document.getElementById('scheduleName').value.trim();
    const time = document.getElementById('scheduleTime').value;
    const duration = parseInt(document.getElementById('scheduleDuration').value);
    
    // Get selected pots
    const pots = Array.from(document.querySelectorAll('.schedule-pot-checkbox:checked'))
        .map(cb => cb.value);
    
    // Get pump type
    const pumpType = document.querySelector('input[name="pumpType"]:checked')?.value || 'air';
    
    // Validation
    if (!name) {
        alert('Nama jadwal harus diisi!');
        return;
    }
    
    if (!time) {
        alert('Waktu mulai harus diisi!');
        return;
    }
    
    if (pots.length === 0) {
        alert('Pilih minimal 1 pot!');
        return;
    }
    
    const scheduleData = {
        name,
        time,
        duration,
        pots,
        pumpType
    };
    
    if (scheduleId) {
        // Update existing schedule
        const scheduleRef = ref(database, `kontrol/jadwal_waktu/${scheduleId}`);
        update(scheduleRef, scheduleData)
            .then(() => {
                closeScheduleModal();
                showNotification('Jadwal berhasil diupdate!', 'success');
            })
            .catch(error => {
                console.error('Error updating schedule:', error);
                alert('Gagal mengupdate jadwal!');
            });
    } else {
        // Add new schedule
        const schedulesRef = ref(database, 'kontrol/jadwal_waktu');
        push(schedulesRef, scheduleData)
            .then(() => {
                closeScheduleModal();
                showNotification('Jadwal berhasil ditambahkan!', 'success');
            })
            .catch(error => {
                console.error('Error adding schedule:', error);
                alert('Gagal menambahkan jadwal!');
            });
    }
};

// Edit schedule
window.editSchedule = function(scheduleId) {
    openScheduleModal(scheduleId);
};

// Duplicate schedule
window.duplicateSchedule = function(scheduleId) {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;
    
    const newSchedule = {
        name: `${schedule.name} (Copy)`,
        time: schedule.time,
        duration: schedule.duration,
        pots: schedule.pots,
        pumpType: schedule.pumpType
    };
    
    const schedulesRef = ref(database, 'kontrol/jadwal_waktu');
    push(schedulesRef, newSchedule)
        .then(() => {
            showNotification('Jadwal berhasil diduplikat!', 'success');
        })
        .catch(error => {
            console.error('Error duplicating schedule:', error);
            alert('Gagal menduplikat jadwal!');
        });
};

// Delete schedule
window.deleteSchedule = function(scheduleId) {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return;
    
    const scheduleRef = ref(database, `kontrol/jadwal_waktu/${scheduleId}`);
    remove(scheduleRef)
        .then(() => {
            showNotification('Jadwal berhasil dihapus!', 'success');
        })
        .catch(error => {
            console.error('Error deleting schedule:', error);
            alert('Gagal menghapus jadwal!');
        });
};

// Select all pots in modal
window.selectAllPotsModal = function() {
    document.querySelectorAll('.schedule-pot-checkbox').forEach(cb => cb.checked = true);
};

// Deselect all pots in modal
window.deselectAllPotsModal = function() {
    document.querySelectorAll('.schedule-pot-checkbox').forEach(cb => cb.checked = false);
};

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('scheduleModal');
    if (event.target === modal) {
        closeScheduleModal();
    }
};
