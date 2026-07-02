import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { auth } from "/src/js/firebase.js";

export async function signup(email, password) {
    return createUserWithEmailAndPassword(
	auth,
	email,
	password
    );
}

export async function login(email, password) {
    return signInWithEmailAndPassword(
	auth,
	email,
	password
    );
}

export async function logout() {
    return signOut(auth);
}

export async function passwordReset(email) {
    try {
	await sendPasswordResetEmail(auth, email);
	return true;
    } catch (e) {
	console.error(e.code, e.message);
	return e.code;
    }
}
