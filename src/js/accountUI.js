import { login, signup, logout } from "./auth.js";

export function initAccountUI() {
    const dialogBackgrounds = document.getElementById('dialogBackgrounds')

    function toggleDBGopen() {
	if (dialogBackgrounds.classList.contains("open")) {
	    dialogBackgrounds.classList.remove("open");
	} else {
	    dialogBackgrounds.classList.add("open");
	}
    }

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
	    loginDialog.hidePopover();
	}).catch((error) => {
	    console.error("Error logging in:", error.code, error.message);
	})
    });

    const signupForm = document.getElementById("signup-form");
    signupForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	
	const formData = new FormData(signupForm);
	
	const email = formData.get("email");
	const password = formData.get("password");
	
	console.log("Creating account with", email, password);

	signup(email, password).then((userCred) => {
	    console.log(userCred);
	    
	    signupDialog.hidePopover();
	}).catch((error) => {
	    console.log(error.code, error.message);
	})
    });

    const signOut = document.getElementById("signOut")
    signOut.addEventListener("click", () => {
	logout().then(() => {
	    console.log("Successfully logged out");
	}).catch((error) => {
	    console.error("Error logging out", error.code, error.message);
	})
    })
    
}
