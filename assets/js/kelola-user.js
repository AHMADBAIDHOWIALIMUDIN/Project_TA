import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// Your web app's Firebase configuration
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
const db = getFirestore(app);

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('dashboardPage').hidden = false;
        document.getElementById('loginMessage').hidden = true;
        document.getElementById('userEmail').textContent = user.email;
        loadUsers();
    } else {
        document.getElementById('dashboardPage').hidden = true;
        document.getElementById('loginMessage').hidden = false;
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
    }
});

// Sign out function
document.getElementById('signOutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log('User signed out');
        window.location.href = '/login.html';
    }).catch((error) => {
        console.error(error);
    });
});

// Add account function
document.getElementById('addAccountBtn').addEventListener('click', async () => {
    const email = document.getElementById('newAccountEmail').value;
    const password = document.getElementById('newAccountPassword').value;

    if (!email || !password) {
        alert('Email dan password harus diisi!');
        return;
    }

    if (password.length < 6) {
        alert('Password harus minimal 6 karakter!');
        return;
    }

    try {
        // Simpan data admin yang sedang login
        const currentUser = auth.currentUser;
        const adminEmail = currentUser.email;
        
        // Buat akun baru di Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        console.log('Akun baru berhasil dibuat:', newUser);
        
        // Simpan data user ke Firestore
        await setDoc(doc(db, 'users', newUser.uid), {
            email: email,
            uid: newUser.uid,
            createdAt: new Date()
        });
        
        // Logout akun baru yang baru dibuat
        await signOut(auth);
        
        // Minta password admin untuk login kembali
        const adminPassword = prompt('Akun berhasil dibuat! Masukkan password Anda untuk login kembali:');
        
        if (adminPassword) {
            await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            
            // Clear form
            document.getElementById('newAccountEmail').value = '';
            document.getElementById('newAccountPassword').value = '';
            
            alert('Akun baru berhasil ditambahkan ke Firebase Authentication!');
            loadUsers();
        }
    } catch (error) {
        console.error('Error adding account:', error);
        alert('Error: ' + error.message);
    }
});

// Load users from Firestore
async function loadUsers() {
    const userTableBody = document.getElementById('userTableBody');
    userTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        userTableBody.innerHTML = '';
        
        if (querySnapshot.empty) {
            userTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Belum ada user</td></tr>';
            return;
        }

        let no = 1;
        querySnapshot.forEach((docSnapshot) => {
            const user = docSnapshot.data();
            const row = document.createElement('tr');
            
            const createdDate = user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('id-ID') : 'N/A';
            
            row.innerHTML = `
                <td>${no++}</td>
                <td>${user.email}</td>
                <td>${createdDate}</td>
                <td>
                    <button class="btn-delete" onclick="deleteUser('${user.uid}', '${user.email}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            `;
            
            userTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        userTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Error loading users</td></tr>';
    }
}

// Delete user function
window.deleteUser = async function(userId, email) {
    if (confirm(`Apakah Anda yakin ingin menghapus user ${email}?`)) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            alert('User berhasil dihapus dari database!');
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error: ' + error.message);
        }
    }
}
