// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZCtX7Ygcp0yUvAVdGZejLK8l2iGNhpTU",
    authDomain: "slithertcs-b7d93.firebaseapp.com",
    projectId: "slithertcs-b7d93",
    storageBucket: "slithertcs-b7d93.firebasestorage.app",
    messagingSenderId: "733383008062",
    appId: "1:733383008062:web:9a395a020b91d031b5966f",
    measurementId: "G-6J39R2KXWZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
