import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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
const historyRef = ref(database, 'history');
const kontrolRef = ref(database, 'kontrol_1');

let listenersInitialized = false;
let stopHistorySubscription = null;
let stopKontrolSubscription = null;

// Initialize history state
let historyData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 20;

// Jadwal and Threshold data for pot filtering
let schedulePotsMap = {}; // Maps jadwal_id -> [pot1, pot2, ...]
let thresholdPotsMap = {}; // Maps threshold_id -> [pot1, pot2, ...]
let scheduleDataMap = {}; // Maps jadwal_id -> {name, time, duration, pots}

// Helper function untuk get last active schedule dari storage
function getLastActiveSchedule() {
    try {
        const stored = sessionStorage.getItem('lastActiveSchedule');
        if (stored) {
            const data = JSON.parse(stored);
            // Hanya gunakan jika masih fresh (dalam 10 menit)
            if (Date.now() - data.timestamp < 600000) {
                return data.scheduleId;
            }
        }
    } catch (e) {
        // Ignore parse errors
    }
    return null;
}

// Notification function
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    const messageEl = notification.querySelector('.notification-message');

    notification.classList.remove('success', 'error', 'warning', 'info', 'hidden');
    notification.classList.add(type);

    if (messageEl) {
        messageEl.textContent = message;
    }

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 4000);
}

function setElementDisplay(id, displayValue) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = displayValue;
    }
}

function setElementHidden(id, hiddenValue) {
    const element = document.getElementById(id);
    if (element) {
        element.hidden = hiddenValue;
    }
}

// Load jadwal and threshold data from Firebase
function loadScheduleAndThresholdData() {
    if (typeof stopKontrolSubscription === 'function') {
        stopKontrolSubscription();
        stopKontrolSubscription = null;
    }

    stopKontrolSubscription = onValue(kontrolRef, (snapshot) => {
        schedulePotsMap = {};
        thresholdPotsMap = {};
        scheduleDataMap = {};

        if (!snapshot.exists()) {
            return;
        }

        const kontrolData = snapshot.val();

        // Extract schedules (jadwal_*)
        Object.entries(kontrolData).forEach(([key, value]) => {
            if (key.match(/^jadwal_\d+$/i) && value && typeof value === 'object') {
                const pots = extractPotsFromData(value.pot_aktif);
                if (pots.length > 0) {
                    schedulePotsMap[key] = pots;
                    // Store full schedule data untuk timing matching
                    scheduleDataMap[key] = {
                        name: value.nama || value.name || `Jadwal ${key.replace('jadwal_', '')}`,
                        time: value.waktu || value.time || '',
                        duration: Number(value.durasi || value.duration || 30),
                        pots: pots
                    };
                }
            }

            // Extract thresholds (threshold_*)
            if (key.match(/^threshold_\d+$/i) && value && typeof value === 'object') {
                const pots = extractPotsFromData(value.pot_aktif);
                if (pots.length > 0) {
                    thresholdPotsMap[key] = pots;
                }
            }
        });
    }, (error) => {
        console.error('Gagal membaca data kontrol:', error);
    });
}

// Extract pot numbers from pot_aktif data
function extractPotsFromData(potAktif) {
    const pots = [];

    if (!potAktif) {
        return pots;
    }

    // Handle array format
    if (Array.isArray(potAktif)) {
        potAktif.forEach((value) => {
            const potNum = Number(value);
            if (Number.isFinite(potNum) && potNum >= 1 && potNum <= 5) {
                pots.push(potNum);
            }
        });
        return Array.from(new Set(pots));
    }

    // Handle object format
    if (typeof potAktif === 'object') {
        // Check for numeric keys (like 0, 1, 2, etc.)
        const numericKeys = Object.keys(potAktif).filter((k) => /^\d+$/.test(k));
        if (numericKeys.length > 0) {
            Object.values(potAktif).forEach((value) => {
                const potNum = Number(value);
                if (Number.isFinite(potNum) && potNum >= 1 && potNum <= 5) {
                    pots.push(potNum);
                }
            });
            return Array.from(new Set(pots));
        }

        // Check for pot_1, pot_2 format or pot1, pot2 format
        for (let i = 1; i <= 5; i++) {
            const potKey = `pot_${i}`;
            const potKeyAlt = `pot${i}`;
            if (potAktif[potKey] === true || potAktif[potKeyAlt] === true) {
                pots.push(i);
            }
        }
    }

    return Array.from(new Set(pots));
}

// Get allowed pots for a given schedule/threshold
function getAllowedPotsForEvent(entry) {
    // Check for schedule ID (jika backend menyimpannya)
    const scheduleId = entry.jadwal_id ?? entry.schedule_id ?? entry.jadwalId ?? entry.scheduleId;
    if (scheduleId && schedulePotsMap[scheduleId]) {
        console.log(`✅ Event mengandung jadwal_id: ${scheduleId}`);
        return schedulePotsMap[scheduleId];
    }

    // Check for threshold ID
    const thresholdId = entry.threshold_id ?? entry.thresholdId;
    if (thresholdId && thresholdPotsMap[thresholdId]) {
        console.log(`✅ Event mengandung threshold_id: ${thresholdId}`);
        return thresholdPotsMap[thresholdId];
    }

    // FALLBACK 1: Infer dari sensor data yang ada di event
    // Jika hanya soil_1 dan soil_2 yang ada, berarti Pot 1 dan 2 yang disiram
    const type = String(entry.type ?? '').toLowerCase().trim();
    if (type.includes('waktu_jadwal') || type.includes('sensor_threshold')) {
        const potsWithData = extractPotsWithSensorData(entry);
        if (potsWithData.length > 0 && potsWithData.length < 5) {
            console.log(`🔍 Inferred pots dari sensor data:`, potsWithData);
            return potsWithData;
        }
    }

    // FALLBACK 2: Cek last active schedule dari sessionStorage
    if (type.includes('waktu_jadwal')) {
        const lastScheduleId = getLastActiveSchedule();
        if (lastScheduleId && schedulePotsMap[lastScheduleId]) {
            console.log(`📋 Using last active schedule: ${lastScheduleId}`);
            return schedulePotsMap[lastScheduleId];
        }

        // FALLBACK 3: Timing-based matching sebagai last resort
        const eventTime = extractEventTime(entry);
        const matchedPots = findScheduleByTiming(eventTime);
        if (matchedPots) {
            console.log(`⏰ Using timing-based matching: ${eventTime.hours}:${String(eventTime.minutes).padStart(2, '0')}`);
            return matchedPots;
        }
    }

    console.log(`❓ Event tidak bisa di-filter (tidak ada jadwal_id atau sensor data)`);
    return null;
}

// Extract pots yang memiliki sensor data di event
function extractPotsWithSensorData(entry) {
    const potsWithData = [];
    const seenPots = new Set();

    Object.entries(entry).forEach(([key, value]) => {
        const match = key.match(/^soil[_-]?(\d+)$/i);
        if (!match) {
            return;
        }

        const pot = parseInt(match[1], 10);
        const sensorValue = normalizeNumber(value);

        // Hanya hitung pot yang memiliki sensor data valid
        if (Number.isFinite(pot) && sensorValue !== null && !seenPots.has(pot)) {
            seenPots.add(pot);
            potsWithData.push(pot);
        }
    });

    return potsWithData.sort((a, b) => a - b);
}

// Extract waktu dari entry untuk timing matching
function extractEventTime(entry) {
    if (entry.time) {
        const timeStr = String(entry.time);
        const match = timeStr.match(/^(\d{2}):(\d{2})/);
        if (match) {
            return {
                hours: parseInt(match[1], 10),
                minutes: parseInt(match[2], 10)
            };
        }
    }

    if (entry.timestamp) {
        const date = new Date(normalizeTimestamp(entry.timestamp));
        return {
            hours: date.getHours(),
            minutes: date.getMinutes()
        };
    }

    return null;
}

// Find schedule berdasarkan waktu event
function findScheduleByTiming(eventTime) {
    if (!eventTime) {
        return null;
    }

    const eventMinutes = eventTime.hours * 60 + eventTime.minutes;

    // Iterate schedulePotsMap untuk cari yang cocok
    for (const [scheduleId, pots] of Object.entries(schedulePotsMap)) {
        const schedule = findScheduleDataById(scheduleId);
        if (!schedule || !schedule.time) {
            continue;
        }

        // Parse jadwal time (format: "HH:MM")
        const timeMatch = schedule.time.match(/^(\d{2}):(\d{2})/);
        if (!timeMatch) {
            continue;
        }

        const scheduleHours = parseInt(timeMatch[1], 10);
        const scheduleMinutes = parseInt(timeMatch[2], 10);
        const scheduleStartMinutes = scheduleHours * 60 + scheduleMinutes;

        // Durasi jadwal (default 30 detik jika tidak ada)
        const durationSeconds = schedule.duration || 30;
        const durationMinutes = Math.ceil(durationSeconds / 60);
        const scheduleEndMinutes = scheduleStartMinutes + durationMinutes;

        // Check apakah event time berada dalam range jadwal
        // Tambah buffer 2 menit sebelum dan sesudah untuk tolerance
        const toleranceMinutes = 2;
        if (
            eventMinutes >= scheduleStartMinutes - toleranceMinutes &&
            eventMinutes <= scheduleEndMinutes + toleranceMinutes
        ) {
            return pots;
        }
    }

    return null;
}

// Find schedule data dari scheduleDataMap
function findScheduleDataById(scheduleId) {
    return scheduleDataMap[scheduleId] || null;
}

// Authentication check
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }

        setElementDisplay('dashboardPage', 'block');
        setElementHidden('loginMessage', true);
        initializeHistory();
    } else {
        setElementDisplay('dashboardPage', 'none');
        setElementHidden('loginMessage', false);

        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

// Logout handler
const signOutBtn = document.getElementById('signOutBtn');
if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '../index.html';
        } catch (error) {
            showNotification('Error logging out: ' + error.message, 'error');
        }
    });
}

function initializeHistory() {
    const entriesSelect = document.getElementById('entriesPerPage');
    if (entriesSelect) {
        itemsPerPage = parseInt(entriesSelect.value, 10) || 20;
    }

    if (!listenersInitialized) {
        setupPagination();
        setupFilterHandlers();
        listenersInitialized = true;
    }

    loadScheduleAndThresholdData();
    loadHistoryFromFirebase();
}

function loadHistoryFromFirebase() {
    if (typeof stopHistorySubscription === 'function') {
        stopHistorySubscription();
        stopHistorySubscription = null;
    }

    stopHistorySubscription = onValue(historyRef, (snapshot) => {
        const rawHistory = snapshot.exists() ? snapshot.val() : {};
        historyData = transformHistoryToRows(rawHistory);
        applyFiltersAndSearch(false);

        if (!snapshot.exists()) {
            showNotification('Belum ada data histori di Firebase', 'warning');
        }
    }, (error) => {
        console.error('Gagal membaca data history:', error);
        showNotification('Gagal mengambil data histori dari Firebase', 'error');
    });
}

function transformHistoryToRows(historyObject) {
    const rows = [];
    let rowCounter = 0;

    function walk(node, context = {}) {
        if (!node || typeof node !== 'object') {
            return;
        }

        if (isLogObject(node)) {
            const parsedRows = parseLogObject(node, context);
            parsedRows.forEach((row) => {
                rowCounter += 1;
                row.id = `row-${rowCounter}`;
                rows.push(row);
            });
            return;
        }

        Object.entries(node).forEach(([key, value]) => {
            const nextContext = { ...context };

            if (!nextContext.date && isDateKey(key)) {
                nextContext.date = key;
            }

            if (!nextContext.time && isTimeKey(key)) {
                nextContext.time = normalizeTimeString(key);
            }

            walk(value, nextContext);
        });
    }

    walk(historyObject, {});
    rows.sort((a, b) => b.sortTimestamp - a.sortTimestamp);
    return rows;
}

function isLogObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return false;
    }

    const keys = Object.keys(value);
    return keys.some((key) => {
        const lowerKey = key.toLowerCase();
        return lowerKey.startsWith('soil_') ||
            lowerKey.startsWith('soil') ||
            lowerKey === 'kelembapan' ||
            lowerKey === 'moisture' ||
            lowerKey === 'temp' ||
            lowerKey === 'suhu' ||
            lowerKey === 'ldr' ||
            lowerKey === 'light' ||
            lowerKey === 'timestamp' ||
            lowerKey === 'water_flow' ||
            lowerKey === 'waterflow' ||
            lowerKey === 'type' ||
            lowerKey === 'event_type' ||
            lowerKey === 'activity_type' ||
            lowerKey === 'source' ||
            lowerKey === 'mode' ||
            lowerKey === 'activity' ||
            lowerKey === 'event' ||
            lowerKey === 'action' ||
            lowerKey === 'schedule_name' ||
            lowerKey === 'schedule_id' ||
            lowerKey === 'jadwal_name' ||
            lowerKey === 'jadwal_id' ||
            lowerKey === 'schedulename' ||
            lowerKey === 'scheduleid' ||
            lowerKey === 'pompa_air' ||
            lowerKey === 'pompaair' ||
            lowerKey === 'pompa_pupuk' ||
            lowerKey === 'pompapupuk' ||
            lowerKey === 'pompa_pengaduk' ||
            lowerKey === 'pompapengaduk' ||
            lowerKey === 'water_pump' ||
            lowerKey === 'fertilizer_pump' ||
            lowerKey === 'mixer_pump';
    });
}

function isDateKey(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeKey(value) {
    return /^\d{2}:\d{2}(:\d{2})?$/.test(value);
}

function parseLogObject(entry, context) {
    const resolvedDateTime = resolveDateTime(entry, context);
    const temperature = normalizeNumber(entry.suhu ?? entry.temp ?? entry.temperature);
    const light = normalizeLightValue(entry.ldr ?? entry.light ?? entry.cahaya);
    const waterFlow = normalizeNumber(entry.water_flow ?? entry.waterFlow ?? entry.flow);
    const status = resolveStatus(entry, waterFlow);
    const source = entry.source ?? entry.mode ?? entry.activity ?? entry.event ?? '-';
    const type = entry.type ?? entry.event_type ?? entry.activity_type ?? entry.action ?? '-';
    
    // Get allowed pots for filtering based on schedule/threshold
    const allowedPots = getAllowedPotsForEvent(entry);
    
    // DEBUG: Log penyiraman events untuk melihat struktur data
    if (type && (String(type).toLowerCase().includes('waktu_jadwal') || String(type).toLowerCase().includes('sensor_threshold'))) {
        console.log('🔍 Penyiraman Event:', {
            time: resolvedDateTime.time,
            type: type,
            jadwal_id: entry.jadwal_id,
            threshold_id: entry.threshold_id,
            allowedPots: allowedPots,
            allKeys: Object.keys(entry)
        });
    }
    
    const potRows = extractPotRows(entry, allowedPots);

    if (potRows.length > 0) {
        return potRows.map((potItem) => ({
            date: resolvedDateTime.date,
            time: resolvedDateTime.time,
            datetime: resolvedDateTime.datetime,
            sortTimestamp: resolvedDateTime.sortTimestamp,
            timestamp: resolvedDateTime.timestamp,
            pot: potItem.pot,
            temp: temperature,
            light,
            moisture: potItem.moisture,
            waterFlow,
            status,
            source,
            type,
            raw: entry
        }));
    }

    const fallbackPot = normalizeNumber(entry.pot ?? entry.pot_id ?? entry.potNumber);
    const fallbackMoisture = normalizeNumber(entry.kelembapan ?? entry.moisture);

    return [{
        date: resolvedDateTime.date,
        time: resolvedDateTime.time,
        datetime: resolvedDateTime.datetime,
        sortTimestamp: resolvedDateTime.sortTimestamp,
        timestamp: resolvedDateTime.timestamp,
        pot: fallbackPot,
        temp: temperature,
        light,
        moisture: fallbackMoisture,
        waterFlow,
        status,
        source,
        type,
        raw: entry
    }];
}

function extractPotRows(entry, allowedPots = null) {
    const rows = [];
    const seenPots = new Set();

    Object.entries(entry).forEach(([key, value]) => {
        const match = key.match(/^soil[_-]?(\d+)$/i);
        if (!match) {
            return;
        }

        const pot = parseInt(match[1], 10);
        const moisture = normalizeNumber(value);

        if (!Number.isFinite(pot) || moisture === null || seenPots.has(pot)) {
            return;
        }

        // Filter pot if allowedPots is specified (watering event with schedule/threshold info)
        if (allowedPots !== null && !allowedPots.includes(pot)) {
            return;
        }

        seenPots.add(pot);
        rows.push({ pot, moisture });
    });

    rows.sort((a, b) => a.pot - b.pot);
    return rows;
}

function resolveDateTime(entry, context) {
    const timestampRaw = normalizeNumber(entry.timestamp ?? entry.ts);
    const timestamp = normalizeTimestamp(timestampRaw);
    const dateFromTimestamp = timestamp ? new Date(timestamp) : null;

    const date = context.date || normalizeDateString(entry.date) || (dateFromTimestamp ? formatDate(dateFromTimestamp) : '-');
    const time = context.time || normalizeTimeString(entry.time) || (dateFromTimestamp ? formatTime(dateFromTimestamp) : '-');
    const datetime = `${date} ${time}`.trim();
    const sortTimestamp = timestamp || buildTimestampFromDateTime(date, time);

    return {
        date,
        time,
        datetime,
        timestamp,
        sortTimestamp
    };
}

function normalizeTimestamp(value) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return null;
    }

    if (value > 0 && value < 100000000000) {
        return Math.round(value * 1000);
    }

    return Math.round(value);
}

function buildTimestampFromDateTime(date, time) {
    if (!isDateKey(date)) {
        return 0;
    }

    const safeTime = isTimeKey(time) ? normalizeTimeString(time) : '00:00';
    const parsed = new Date(`${date}T${safeTime}:00`);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function normalizeDateString(value) {
    if (typeof value !== 'string') {
        return null;
    }

    if (isDateKey(value)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return formatDate(parsed);
}

function normalizeTimeString(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const match = value.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
    if (!match) {
        return null;
    }

    return `${match[1]}:${match[2]}`;
}

function formatDate(dateObject) {
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, '0');
    const day = String(dateObject.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTime(dateObject) {
    const hours = String(dateObject.getHours()).padStart(2, '0');
    const minutes = String(dateObject.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

function normalizeNumber(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function normalizeLightValue(value) {
    const numericValue = normalizeNumber(value);
    if (numericValue === null) {
        return null;
    }

    if (numericValue >= 0 && numericValue <= 1) {
        return Math.round(numericValue * 100);
    }

    if (numericValue > 1 && numericValue <= 100) {
        return Math.round(numericValue);
    }

    if (numericValue > 100 && numericValue <= 1023) {
        return Math.round((numericValue / 1023) * 100);
    }

    return Math.round(numericValue);
}

function resolveStatus(entry, waterFlow) {
    const type = String(entry.type ?? '').toLowerCase().trim();
    
    // Deteksi Penyiraman: mode waktu atau sensor threshold
    if (type.includes('waktu_jadwal') || type.includes('sensor_threshold')) {
        return 'Menyiram';
    }
    
    // Deteksi Monitoring: auto_log
    if (type === 'auto_log') {
        return 'Normal';
    }

    return 'Normal';
}

function getActivityType(item) {
    const status = item.status;
    if (status === 'Menyiram') {
        return 'Penyiraman';
    }
    return 'Monitoring';
}

function getActivityBadgeClass(activityType) {
    return activityType === 'Penyiraman' ? 'activity-watering' : 'activity-monitoring';
}

function formatDisplayValue(value, suffix = '', decimals = 0) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '-';
    }

    const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
    return `${formatted}${suffix}`;
}

// Display history data in table with pagination
function displayHistoryData() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">Tidak ada data</td></tr>';
        updatePaginationInfo(0, 0, 0);
        updatePaginationButtons();
        return;
    }

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);

    // Display data
    pageData.forEach((item) => {
        const potCell = Number.isFinite(item.pot)
            ? `<span class="pot-badge pot-${item.pot}-badge">Pot ${item.pot}</span>`
            : '-';
        
        const activityType = getActivityType(item);
        const badgeClass = getActivityBadgeClass(activityType);
        const activityBadge = `<span class="activity-badge ${badgeClass}">${activityType}</span>`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.datetime}</td>
            <td>${potCell}</td>
            <td>${formatDisplayValue(item.temp, ' C', 1)}</td>
            <td>${formatDisplayValue(item.light, '%')}</td>
            <td>${formatDisplayValue(item.moisture, '%')}</td>
            <td>${activityBadge}</td>
        `;
        tbody.appendChild(row);
    });

    // Update pagination info and controls
    updatePaginationInfo(startIndex + 1, endIndex, filteredData.length);
    updatePaginationButtons();
}

// Update statistics
function updateStatistics(data) {
    // Statistics cards have been removed, this function is kept for compatibility
    // but doesn't update any elements anymore
    return data;
}

function setupFilterHandlers() {
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', () => {
            applyFiltersAndSearch(true);
            showNotification('Filter diterapkan', 'success');
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            applyFiltersAndSearch(true);
        });
    }
}

function applyFiltersAndSearch(resetPage) {
    const potFilter = document.getElementById('potFilter')?.value || 'all';
    const searchTerm = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();

    filteredData = historyData.filter((item) => {
        const passPot = potFilter === 'all' || item.pot === parseInt(potFilter, 10);
        if (!passPot) {
            return false;
        }

        if (!searchTerm) {
            return true;
        }

        const searchableText = [
            item.datetime,
            item.date,
            item.time,
            item.pot,
            item.temp,
            item.light,
            item.moisture,
            item.status,
            item.type,
            item.source
        ].join(' ').toLowerCase();

        return searchableText.includes(searchTerm);
    });

    if (resetPage) {
        currentPage = 1;
    }

    displayHistoryData();
    updateStatistics(filteredData);
}

// Setup pagination controls
function setupPagination() {
    // Entries per page
    const entriesSelect = document.getElementById('entriesPerPage');
    if (entriesSelect) {
        entriesSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value, 10);
            currentPage = 1;
            displayHistoryData();
        });
    }

    // Previous page
    const prevBtn = document.getElementById('prevPage');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayHistoryData();
            }
        });
    }

    // Next page
    const nextBtn = document.getElementById('nextPage');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayHistoryData();
            }
        });
    }
}

// Update pagination info text
function updatePaginationInfo(start, end, total) {
    const info = document.getElementById('paginationInfo');
    if (!info) {
        return;
    }

    if (total === 0) {
        info.textContent = 'Showing 0 to 0 of 0 entries';
    } else {
        info.textContent = `Showing ${start} to ${end} of ${total} entries`;
    }
}

// Update pagination buttons state
function updatePaginationButtons() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Disable/enable buttons
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // Update page numbers
    updatePageNumbers(totalPages);
}

// Update page number buttons
function updatePageNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById('pageNumbers');
    if (!pageNumbersContainer) {
        return;
    }

    pageNumbersContainer.innerHTML = '';

    if (totalPages === 0) return;

    // Show max 3 page numbers
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    // Adjust if we're near the end
    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'btn-page-number';
        pageBtn.textContent = i;

        if (i === currentPage) {
            pageBtn.classList.add('active');
        }

        pageBtn.addEventListener('click', () => {
            currentPage = i;
            displayHistoryData();
        });

        pageNumbersContainer.appendChild(pageBtn);
    }

    // Add next indicator if there are more pages
    if (endPage < totalPages) {
        const dots = document.createElement('span');
        dots.className = 'page-dots';
        dots.textContent = '>';
        pageNumbersContainer.appendChild(dots);
    }
}
