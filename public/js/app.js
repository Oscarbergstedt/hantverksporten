import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, setDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

function showForm(formId) {
    document.getElementById('register').style.display = 'none';
    document.getElementById('login').style.display = 'none';
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('contractor-profile').style.display = 'none';
    document.getElementById(formId).style.display = 'block';
}

async function registerUser() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const userType = document.querySelector('input[name="userType"]:checked').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
            email: user.email,
            userType: userType,
        });

        alert('User registered successfully');
        showForm('login');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.userType === 'contractor') {
                showForm('contractor-profile');
            } else {
                showForm('welcome');
            }
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('logout-btn').style.display = 'block';
        } else {
            alert('User data not found');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

function logoutUser() {
    signOut(auth).then(() => {
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('logout-btn').style.display = 'none';
        showForm('login');
        alert('Logged out successfully');
    }).catch((error) => {
        alert('Error: ' + error.message);
    });
}

async function updateContractorProfile() {
    const user = auth.currentUser;
    const name = document.getElementById('contractor-name').value;
    const phone = document.getElementById('contractor-phone').value;
    const address = document.getElementById('contractor-address').value;

    try {
        await updateDoc(doc(db, 'users', user.uid), {
            name: name,
            phone: phone,
            address: address,
        });

        alert('Profile updated successfully');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}