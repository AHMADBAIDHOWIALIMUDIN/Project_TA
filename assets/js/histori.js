import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

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
        initializeHistory();
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

// Generate sample history data
function generateHistoryData() {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
        const date = new Date(now - (i * 3600000)); // Every hour
        const pot = Math.floor(Math.random() * 5) + 1;
        const temp = (Math.random() * (35 - 25) + 25).toFixed(1);
        const light = Math.floor(Math.random() * (100 - 60) + 60);
        const moisture = Math.floor(Math.random() * (80 - 20) + 20);
        const status = moisture < 30 ? 'Menyiram' : 'Normal';
        
        data.push({
            datetime: date.toLocaleString('id-ID'),
            pot: pot,
            temp: temp,
            light: light,
            moisture: moisture,
            status: status
        });
    }
    
    return data;
}

// Initialize history data
let historyData = [];

function initializeHistory() {
    // Load or generate history data
    const savedData = localStorage.getItem('historyData');
    if (savedData) {
        historyData = JSON.parse(savedData);
    } else {
        historyData = generateHistoryData();
        localStorage.setItem('historyData', JSON.stringify(historyData));
    }
    
    // Set default dates
    const today = new Date();
    const lastWeek = new Date(today - 7 * 24 * 3600000);
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = lastWeek;
    
    // Display data
    displayHistoryData(historyData);
    updateStatistics(historyData);
}

// Display history data in table
function displayHistoryData(data) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Tidak ada data</td></tr>';
        return;
    }
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.datetime}</td>
            <td><span class="pot-badge pot-${item.pot}-badge">Pot ${item.pot}</span></td>
            <td>${item.temp}°C</td>
            <td>${item.light}%</td>
            <td>${item.moisture}%</td>
            <td><span class="status-badge ${item.status === 'Menyiram' ? 'status-watering' : 'status-normal'}">${item.status}</span></td>
            <td><button class="btn-detail" onclick="viewDetail('${item.datetime}')"><i class="fas fa-eye"></i></button></td>
        `;
        tbody.appendChild(row);
    });
}

// Update statistics
function updateStatistics(data) {
    const totalWatering = data.filter(item => item.status === 'Menyiram').length;
    const avgTemp = data.reduce((sum, item) => sum + parseFloat(item.temp), 0) / data.length;
    const avgMoisture = data.reduce((sum, item) => sum + parseInt(item.moisture), 0) / data.length;
    
    document.getElementById('totalWatering').textContent = totalWatering;
    document.getElementById('avgTemp').textContent = avgTemp.toFixed(1) + '°C';
    document.getElementById('avgMoisture').textContent = avgMoisture.toFixed(0) + '%';
}

// Filter data
document.getElementById('applyFilter').addEventListener('click', () => {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const potFilter = document.getElementById('potFilter').value;
    
    let filtered = historyData;
    
    // Filter by pot
    if (potFilter !== 'all') {
        filtered = filtered.filter(item => item.pot === parseInt(potFilter));
    }
    
    // Filter by date (simplified - would need proper date parsing)
    // For now just showing all data
    
    displayHistoryData(filtered);
    updateStatistics(filtered);
    showNotification('Filter diterapkan', 'success');
});

// View detail function
window.viewDetail = function(datetime) {
    showNotification('Detail untuk: ' + datetime, 'info');
};
