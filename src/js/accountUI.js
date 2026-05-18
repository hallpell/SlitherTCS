import { login, signup, logout } from "./auth.js";
import { toggleDBGopen } from "./modalBackground.js";

export function initAccountUI() {
    const loginDialog = document.getElementById("login-dialog");
    const signupDialog = document.getElementById("signup-dialog");
    loginDialog.addEventListener("toggle", toggleDBGopen);
    signupDialog.addEventListener("toggle", toggleDBGopen);

    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const formData = new FormData(loginForm);

	const email = formData.get("email");
	const password = formData.get("password");

	console.log("Logging in with", email, password);

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
	
	const email = formData.get("email");
	const password = formData.get("password");

	if (password.length < 6) {
	    // TODO: error: password must be at least 6 characters long
	    alert("Password must be at least characters");
	    return;
	}
	
	console.log("Creating account with", email, password);

	signup(email, password).then((userCred) => {
	    // TODO: Update UI to signed in state
	    signupForm.reset();

	    signupDialog.hidePopover();
	}).catch((error) => {
	    // TODO: handle errors
	    console.log(error.code, error.message);
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
