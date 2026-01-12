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
    
    for (let i = 0; i < 100; i++) {
        const date = new Date(now - (i * 1800000)); // Every 30 minutes
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
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 20;

function initializeHistory() {
    // Load or generate history data
    const savedData = localStorage.getItem('historyData');
    if (savedData) {
        historyData = JSON.parse(savedData);
    } else {
        historyData = generateHistoryData();
        localStorage.setItem('historyData', JSON.stringify(historyData));
    }
    
    // Initialize filtered data
    filteredData = [...historyData];
    
    // Display data with pagination
    displayHistoryData();
    updateStatistics(filteredData);
    setupPagination();
}

// Display history data in table with pagination
function displayHistoryData() {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Tidak ada data</td></tr>';
        updatePaginationInfo(0, 0, 0);
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);
    
    // Display data
    pageData.forEach(item => {
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
    
    // Update pagination info and controls
    updatePaginationInfo(startIndex + 1, endIndex, filteredData.length);
    updatePaginationButtons();
}

// Update statistics
function updateStatistics(data) {
    // Statistics cards have been removed, this function is kept for compatibility
    // but doesn't update any elements anymore
    return;
}

// Filter data
document.getElementById('applyFilter').addEventListener('click', () => {
    const potFilter = document.getElementById('potFilter').value;
    
    let filtered = historyData;
    
    // Filter by pot
    if (potFilter !== 'all') {
        filtered = filtered.filter(item => item.pot === parseInt(potFilter));
    }
    
    filteredData = filtered;
    currentPage = 1;
    
    displayHistoryData();
    updateStatistics(filteredData);
    showNotification('Filter diterapkan', 'success');
});

// Setup pagination controls
function setupPagination() {
    // Entries per page
    document.getElementById('entriesPerPage').addEventListener('change', function() {
        itemsPerPage = parseInt(this.value);
        currentPage = 1;
        displayHistoryData();
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        if (searchTerm === '') {
            filteredData = [...historyData];
        } else {
            filteredData = historyData.filter(item => {
                return item.datetime.toLowerCase().includes(searchTerm) ||
                       item.pot.toString().includes(searchTerm) ||
                       item.temp.toString().includes(searchTerm) ||
                       item.light.toString().includes(searchTerm) ||
                       item.moisture.toString().includes(searchTerm) ||
                       item.status.toLowerCase().includes(searchTerm);
            });
        }
        currentPage = 1;
        displayHistoryData();
        updateStatistics(filteredData);
    });
    
    // Previous page
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayHistoryData();
        }
    });
    
    // Next page
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayHistoryData();
        }
    });
}

// Update pagination info text
function updatePaginationInfo(start, end, total) {
    const info = document.getElementById('paginationInfo');
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
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
    
    // Update page numbers
    updatePageNumbers(totalPages);
}

// Update page number buttons
function updatePageNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById('pageNumbers');
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
        dots.textContent = '›';
        pageNumbersContainer.appendChild(dots);
    }
}

// View detail function
window.viewDetail = function(datetime) {
    showNotification('Detail untuk: ' + datetime, 'info');
};
