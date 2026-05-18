import { login, signup, logout } from "./auth.js";
import { toggleDBGopen } from "./modalBackground.js";
import { db, auth } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export function initAccountUI() {
    const loginDialog = document.getElementById("login-dialog");
    const signupDialog = document.getElementById("signup-dialog");
    loginDialog.addEventListener("toggle", toggleDBGopen);
    signupDialog.addEventListener("toggle", toggleDBGopen);

    // returns false if no issues, otherwise returns a string with a reason
    function isUsernameInvalid(username) {
	const regex = /^(?=.{3,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/;
	
	const reserved = new Set([
	    "admin",
	    "root",
	    "support",
	    "help",
	    "login",
	    "signup"
	]);
	
	if (!regex.test(username)) {
	    return "Invalid format";
	}
	
	if (reserved.has(username.toLowerCase())) {
	    return "Username is reserved";
	}
	
	return false;
    }
    
    
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const formData = new FormData(loginForm);

	const identifier = formData.get("identifier");
	const password = formData.get("password");
	let email;
	
	if (!identifier.includes("@")) {
	    // try to resolve to email
	} else {
	    email = identifier;
	}

	login(email, password).then(() => {
	    console.log("Logged in successfully");
	    // TODO: Update UI to logged in state

	    loginForm.reset();
	    
	    loginDialog.hidePopover();
	}).catch((error) => {
	    // TODO: Handle errors + display reasonably
	    console.error("Error logging in:", error.code, error.message);
	})
    });

    const signupForm = document.getElementById("signup-form");
    signupForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	
	const formData = new FormData(signupForm);

	const username = formData.get("username");
	const email = formData.get("email");
	const password = formData.get("password");

	let invalid = isUsernameInvalid(username);

	if (invalid) {
	    alert(invalid);
	    return;
	}

	// TODO: Check username uniqueness
	const myDoc = await getDoc(doc(db, "usernames", username));
	if (myDoc.exists()) {
	    alert("Username not available");
	    return
	}
	
	if (password.length < 6) {
	    // TODO: error: password must be at least 6 characters long
	    alert("Password must be at least characters");
	    return;
	}

	console.log("Creating account with", email, password);

	signup(email, password).then((userCred) => {
	    // TODO: Update UI to signed in state

	    setDoc(doc(db, "usernames", username), { uid: userCred.user.uid }).catch((error) => {
		console.log(error);
		alert("Couldn't write username (but account exists)");
	    });
	    // TODO: Write UN->UID doc for (a) checking UN uniqueness (b) prettier URL resolution
	    signupForm.reset();

	    signupDialog.hidePopover();
	}).catch((error) => {
	    // TODO: handle errors
	    console.log(error, error.code, error.message);
	})
    });

    const signOut = document.getElementById("signOut")
    signOut.addEventListener("click", () => {
	logout().then(() => {
	    console.log("Successfully logged out");
	    // TODO: Update UI to logged out state
	}).catch((error) => {
	    // TODO: handle errors?
	    console.error("Error logging out", error.code, error.message);
	})
    })
}
