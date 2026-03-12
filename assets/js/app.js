import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, update } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// Your web app's Firebase configuration
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
const aktuatorRef = ref(database, 'aktuator');

// Pot states (all ON by default)
const potStates = {
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
};

// Water/Fertilizer states
const actuatorStates = {
    water: true,  // mosvet_6
    fertilizer: true  // mosvet_7
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
    
    // Update Firebase
    const mosvetKey = `mosvet_${potNumber}`;
    update(aktuatorRef, {
        [mosvetKey]: potStates[potNumber]
    }).then(() => {
        console.log(`POT ${potNumber} updated to ${potStates[potNumber]}`);
    }).catch((error) => {
        console.error('Error updating Firebase:', error);
    });
};

// Toggle water actuator (mosvet_6)
window.toggleWater = function() {
    const newWaterState = !actuatorStates.water;
    
    // If turning water ON, turn fertilizer OFF
    if (newWaterState) {
        actuatorStates.water = true;
        actuatorStates.fertilizer = false;
        
        // Update water UI
        const waterStatusEl = document.getElementById('waterStatus');
        const waterIndicatorEl = document.getElementById('waterIndicator');
        waterStatusEl.textContent = 'ON';
        waterIndicatorEl.classList.add('active');
        waterIndicatorEl.classList.remove('inactive');
        
        // Update fertilizer UI to OFF
        const fertilizerStatusEl = document.getElementById('fertilizerStatus');
        const fertilizerIndicatorEl = document.getElementById('fertilizerIndicator');
        fertilizerStatusEl.textContent = 'OFF';
        fertilizerIndicatorEl.classList.add('inactive');
        fertilizerIndicatorEl.classList.remove('active');
        
        // Update Firebase for both
        update(aktuatorRef, {
            mosvet_6: true,
            mosvet_7: false
        }).then(() => {
            console.log('Water ON, Fertilizer OFF');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
        });
    } else {
        // Turning water OFF (fertilizer stays OFF)
        actuatorStates.water = false;
        
        const waterStatusEl = document.getElementById('waterStatus');
        const waterIndicatorEl = document.getElementById('waterIndicator');
        waterStatusEl.textContent = 'OFF';
        waterIndicatorEl.classList.add('inactive');
        waterIndicatorEl.classList.remove('active');
        
        update(aktuatorRef, {
            mosvet_6: false
        }).then(() => {
            console.log('Water OFF');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
        });
    }
};

// Toggle fertilizer actuator (mosvet_7)
window.toggleFertilizer = function() {
    const newFertilizerState = !actuatorStates.fertilizer;
    
    // If turning fertilizer ON, turn water OFF
    if (newFertilizerState) {
        actuatorStates.fertilizer = true;
        actuatorStates.water = false;
        
        // Update fertilizer UI
        const fertilizerStatusEl = document.getElementById('fertilizerStatus');
        const fertilizerIndicatorEl = document.getElementById('fertilizerIndicator');
        fertilizerStatusEl.textContent = 'ON';
        fertilizerIndicatorEl.classList.add('active');
        fertilizerIndicatorEl.classList.remove('inactive');
        
        // Update water UI to OFF
        const waterStatusEl = document.getElementById('waterStatus');
        const waterIndicatorEl = document.getElementById('waterIndicator');
        waterStatusEl.textContent = 'OFF';
        waterIndicatorEl.classList.add('inactive');
        waterIndicatorEl.classList.remove('active');
        
        // Update Firebase for both
        update(aktuatorRef, {
            mosvet_6: false,
            mosvet_7: true
        }).then(() => {
            console.log('Fertilizer ON, Water OFF');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
        });
    } else {
        // Turning fertilizer OFF (water stays OFF)
        actuatorStates.fertilizer = false;
        
        const fertilizerStatusEl = document.getElementById('fertilizerStatus');
        const fertilizerIndicatorEl = document.getElementById('fertilizerIndicator');
        fertilizerStatusEl.textContent = 'OFF';
        fertilizerIndicatorEl.classList.add('inactive');
        fertilizerIndicatorEl.classList.remove('active');
        
        update(aktuatorRef, {
            mosvet_7: false
        }).then(() => {
            console.log('Fertilizer OFF');
        }).catch((error) => {
            console.error('Error updating Firebase:', error);
        });
    }
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
        
        // Load actuator states from Firebase
        loadActuatorStates();
    } else {
        document.getElementById('dashboardPage').hidden = true;
        document.getElementById('loginMessage').hidden = false;
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
});

// Load actuator states from Firebase
function loadActuatorStates() {
    onValue(aktuatorRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('Actuator data loaded:', data);
            
            // Update pot states (mosvet_1 to mosvet_5)
            for (let i = 1; i <= 5; i++) {
                const mosvetKey = `mosvet_${i}`;
                if (data[mosvetKey] !== undefined) {
                    potStates[i] = data[mosvetKey];
                    const statusEl = document.getElementById(`status${i}`);
                    const indicatorEl = document.getElementById(`indicator${i}`);
                    
                    if (statusEl && indicatorEl) {
                        if (potStates[i]) {
                            statusEl.textContent = 'ON';
                            indicatorEl.classList.add('active');
                            indicatorEl.classList.remove('inactive');
                        } else {
                            statusEl.textContent = 'OFF';
                            indicatorEl.classList.add('inactive');
                            indicatorEl.classList.remove('active');
                        }
                    }
                }
            }
            
            // Update water state (mosvet_6)
            if (data.mosvet_6 !== undefined) {
                actuatorStates.water = data.mosvet_6;
                const statusEl = document.getElementById('waterStatus');
                const indicatorEl = document.getElementById('waterIndicator');
                
                if (statusEl && indicatorEl) {
                    if (actuatorStates.water) {
                        statusEl.textContent = 'ON';
                        indicatorEl.classList.add('active');
                        indicatorEl.classList.remove('inactive');
                    } else {
                        statusEl.textContent = 'OFF';
                        indicatorEl.classList.add('inactive');
                        indicatorEl.classList.remove('active');
                    }
                }
            }
            
            // Update fertilizer state (mosvet_7)
            if (data.mosvet_7 !== undefined) {
                actuatorStates.fertilizer = data.mosvet_7;
                const statusEl = document.getElementById('fertilizerStatus');
                const indicatorEl = document.getElementById('fertilizerIndicator');
                
                if (statusEl && indicatorEl) {
                    if (actuatorStates.fertilizer) {
                        statusEl.textContent = 'ON';
                        indicatorEl.classList.add('active');
                        indicatorEl.classList.remove('inactive');
                    } else {
                        statusEl.textContent = 'OFF';
                        indicatorEl.classList.add('inactive');
                        indicatorEl.classList.remove('active');
                    }
                }
            }
        } else {
            // Initialize default values
            initializeDefaultActuatorStates();
        }
    });
}

// Initialize default actuator states
function initializeDefaultActuatorStates() {
    const defaultData = {
        mosvet_1: true,
        mosvet_2: true,
        mosvet_3: true,
        mosvet_4: true,
        mosvet_5: true,
        mosvet_6: true,
        mosvet_7: true
    };
    
    set(aktuatorRef, defaultData)
        .then(() => {
            console.log('Default actuator states initialized');
        })
        .catch((error) => {
            console.error('Error initializing actuator states:', error);
        });
}

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