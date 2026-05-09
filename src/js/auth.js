import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
}
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import { auth } from "./firebase.js";

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
