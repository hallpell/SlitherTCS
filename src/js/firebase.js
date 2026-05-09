// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBQO19SSny8OcjA99VQ8bgKRUkPIkL0uLo",
    authDomain: "slithertcs.firebaseapp.com",
    projectId: "slithertcs",
    storageBucket: "slithertcs.firebasestorage.app",
    messagingSenderId: "274730040265",
    appId: "1:274730040265:web:3a6d9e8455c579b3684618"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
