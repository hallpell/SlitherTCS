import { login, signup, logout } from "/src/js/auth.js";
import { toggleDBGopen } from "/src/js/modalBackground.js";
import { db, auth } from "/src/js/firebase.js";
import { logoutUI, setAccountUI } from "/src/js/accountStateUI.js";
import { setEditor } from "/src/js/codeMirror.js";
import { loadFromUIDs } from "/src/js/loading.js";
import { isInvalidDocumentName, logErrors } from "/src/js/firebaseHelpers.js";
import { debouncedObjFactory, makeSafe } from "/src/js/jsUtils.js";
import { setProjectName, setProjectId, setOwns, getProjectId } from "/src/js/currentProject.js";
import { errorShake } from "/src/js/DOMhelpers.js";
import { setAutosave } from "/src/js/autosaveState.js";

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, collection, setDoc, getDoc, getDocs, serverTimestamp, runTransaction } from
"https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

let validSignup = { username: false, email: false, password: false };

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
    
    let v = isInvalidDocumentName(username);
    if (v) {
	return "Username invalid: " + v;
    }
    
    return false;
}

async function validateUsernameUI() {
    const proposedUsername = document.getElementById('signup-form-username').value;
    const valElement = document.getElementById("signup-form-username-validation");

    if (proposedUsername === "") {
	valElement.textContent = '';
	validSignup.username = false;
	return false;
    }

    const localInvalid = isUsernameInvalid(proposedUsername);
    if (localInvalid) {
	valElement.textContent = localInvalid;
	validSignup.username = false;
	return false;
    }

    try {
	const snap = await getDoc(doc(db, "usernames", makeSafe(proposedUsername)));
    } catch (error) {
	console.error(error);
    }
    if (snap.exists()) {
	valElement.textContent = 'Username not available';
	validSignup.username = false;
	return false;
    }

    valElement.textContent = '';
    validSignup.username = true;
    return true;
}

function validateEmailUI() {
    const emailEl = document.getElementById('signup-form-email');
    const valElement = document.getElementById("signup-form-email-validation");

    if (emailEl.validity.valid) {
	valElement.textContent = '';
	validSignup.email = true;
	return true;
    }

    if (emailEl.validity.valueMissing) {
	valElement.textContent = "";
    } else if (emailEl.validity.typeMismatch) {
	valElement.textContent = "Please enter a valid email address.";
    } else {
	valElement.textContent = email.validationMessage;
    }
    validSignup.email = false;
    return false;
}

function validatePasswordUI() {
    const proposedPassword = document.getElementById('signup-form-password').value;

    const valElement = document.getElementById("signup-form-password-validation");
    
    if (proposedPassword.length < 6) {
	valElement.textContent = 'Password must be at least 6 characters';
	validSignup.password = false;
	return false;
    } else {
	valElement.textContent = '';
	validSignup.password = true;
	return true;
    }
}

// returns an array of objects.
//   Length of array will equal number of projects in colSnap
//   Each object will have 'time', 'name', and 'id'
//   The array will be sorted by the 'time' attributes of the elements
function buildTemporallySortedProjects(colSnap) {
    let tsps = [];
    colSnap.forEach((d) => {
	const data = d.data();
	let val = {
	    time: data.updatedAt,
	    name: data.displayName,
	    id: data.projectId
	}
	
	// insertion sort
	let i = 0;
	while (i < tsps.length && tsps[i].time < val.time) {
	    i++;
	}
	tsps.splice(i, 0, val);
    })
    return tsps;
}

// takes the output of buildTemporallySortedProjects and
//   inserts them into the DOM in profileList
function insertProjects(projs) {
    const frag = document.createDocumentFragment();
    
    projs.forEach((p) => {
	const li = document.createElement('li');
	const span = document.createElement('span');
	span.textContent = p.name;

	li.classList.add('userProject');

	// prepend to reverse order
	frag.prepend(li);
	li.appendChild(span);
	li.addEventListener("click", () => {
	    loadFromUIDs(auth.currentUser.uid, p.id);
	})
    })

    const profileList = document.getElementById("profileList");
    profileList.insertBefore(frag, document.getElementById("signOut"));
}

export function initAccountUI() {
    const loginDialog = document.getElementById("login-dialog");
    const signupDialog = document.getElementById("signup-dialog");
    loginDialog.addEventListener("toggle", toggleDBGopen);
    signupDialog.addEventListener("toggle", toggleDBGopen);
    document.getElementById("generic-error-dialog").addEventListener("toggle", toggleDBGopen);

    document.getElementById("login-to-signup").addEventListener("click", () => {
	signupDialog.showPopover();
	loginDialog.hidePopover();
    })

    document.getElementById("signup-to-login").addEventListener("click", () => {
	loginDialog.showPopover();
	signupDialog.hidePopover();
    })

    document.getElementById("newProject").addEventListener("click", () => {
	// TODO: Complain if project is dirty
	setEditor("");
	setProjectName(null);
	setProjectId(null);
	setOwns(false);

	history.pushState({}, "", "/");

	document.getElementById("profileDropdown").hidePopover();
    })
    
    onAuthStateChanged(auth, (user) => {
	// if user is signing in
	if (user) {
	    // check if they have saved theme settings
	    getDoc(doc(db, 'users', user.uid)).then((snap) => {
		if (snap.exists()) {
		    const data = snap.data();
		    if ("displayName" in data) {
			setAccountUI(data.displayName);
		    } else { setAccountUI("Profile"); }

		    if ("cmTheme" in data) {
			const cmThemeOption = document.getElementById("cmTheme");
			cmThemeOption.value = data.cmTheme;
			cmThemeOption.dispatchEvent(new Event("change"));
		    }

		    if ("terminalTheme" in data) {
			const terminalThemeOption = document.getElementById("terminalTheme");
			terminalThemeOption.value = data.terminalTheme;
			terminalThemeOption.dispatchEvent(new Event("change"));
		    }

		    if ("autosave" in data) {
			setAutosave(data.autosave);
		    }
		} else {
		    console.log("No display name stored for " + user.uid);
		    setAccountUI("Profile");
		}
	    }).catch((error) => {
		console.log("Couldn't retrieve user profile for " + user.uid);
		console.error(error);
		setAccountUI("Profile");
	    })

	    // add all user projects to dropdown menu allowing them to load projects
	    getDocs(collection(db, 'users', user.uid, 'projectNames')).then((colSnapshot) => {
		// TODO: handle 0 projects intelligently
		if (colSnapshot.length === 0) {
		    return
		}
		let tsps = buildTemporallySortedProjects(colSnapshot);
		insertProjects(tsps);
	    }).catch((error) => {
		console.log("Couldn't read projects to make loading bar");
		console.error(error);
	    })
	} else {
	    logoutUI();
	    document.querySelectorAll(".userProject").forEach((el) => {
		el.remove();
	    })
	}
    })

    
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", async (event) => {
	event.preventDefault();

	const formData = new FormData(loginForm);

	const identifier = formData.get("identifier");
	const password = formData.get("password");
	let email;
	let username;
	
	if (!identifier.includes("@")) {
	    username = identifier;

	    try {
		const snap = await getDoc(doc(db, "usernames", makeSafe(identifier)));
	    } catch (error) {
		console.error(error);
	    }
	    if (snap.exists()) {
		email = snap.data().email;
	    } else {
		const valEl = document.getElementById("login-form-username-validation")
		valEl.textContent = 'Username not found';
		errorShake(valEl);
		return
	    }
	} else {
	    email = identifier;
	}

	login(email, password).then(() => {
	    console.log("Logged in successfully");

	    // onAuthStateChanged will handle some of the UI (profile buttons, etc)

	    loginForm.reset();
	    loginDialog.hidePopover();
	}).catch((error) => {
	    if (error.code === 'auth/invalid-email') {
		const valEl = document.getElementById("login-form-username-validation");
		valEl.textContent = 'Invalid email';
		errorShake(valEl);
	    } else if (error.code === 'auth/invalid-credential' ||
		       error.code === 'auth/wrong-password' ||
		       error.code === 'auth/user-not-found') {
		const valEl = document.getElementById("login-form-username-validation");
		valEl.textContent = 'Invalid credentials';
		errorShake(valEl)
		const valEl2 = document.getElementById("login-form-password-validation");
		valEl2.textContent = 'Invalid credentials';
		errorShake(valEl2);
	    } else if (error.code === 'auth/too-many-requests') {
		const valEl = document.getElementById("login-form-password-validation");
		valEl.textContent = 'Too many login attempts. Please try again later';
		errorShake(valEl);
	    } else if (error.code === 'auth/network-request-failed') {
		const valEl = document.getElementById("login-form-username-validation");
		valEl.textContent = 'Network error';
		errorShake(valEl);		
	    } else {
		const valEl = document.getElementById("login-form-username-validation");
		valEl.textContent = 'Failed to login: ' + error.code;
		errorShake(valEl);
		console.log(error, error.code, error.message);
		logErrors("Error creating account with weird code: '" + error.code + "'", error.message);
	    }
	})
    });

    // add tooltip to when username is selected
    let unInput = document.getElementById("signup-form-username")
    unInput.addEventListener("focus", () => {
	// this janky timeout is to avoid the popover from showing, then immediately
	//   hiding because it recognizes a click outside of it's area
	setTimeout(() => {
	    document.getElementById("real-name-popover").showPopover({source: unInput});
	}, 100);
    })

    unInput.addEventListener("blur", () => {
	document.getElementById("real-name-popover").hidePopover();
    })
								    
    
    // this is debounced for longer to avoid extraneous fetches from Firebase
    const debouncedUsername = debouncedObjFactory(validateUsernameUI, 500);
    document.getElementById('signup-form-username').
	addEventListener("input", () => { debouncedUsername.run() });
    document.getElementById('signup-form-username').
	addEventListener("blur", () => { debouncedUsername.flush() });

    const debouncedEmail = debouncedObjFactory(validateEmailUI, 300);
    document.getElementById('signup-form-email').
	addEventListener("input", () => { debouncedEmail.run() });
    document.getElementById('signup-form-email').
	addEventListener("blur", () => { debouncedEmail.flush() });

    const debouncedPassword = debouncedObjFactory(validatePasswordUI, 300);
    document.getElementById('signup-form-password').
	addEventListener("input", () => { debouncedPassword.run() });
    document.getElementById('signup-form-password').
	addEventListener("blur", () => { debouncedPassword.flush() });
    
    const signupForm = document.getElementById("signup-form");
    signupForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	
	const formData = new FormData(signupForm);

	const username = formData.get("username");
	const email = formData.get("email");
	const password = formData.get("password");

	if (!validSignup.username || !validSignup.email || !validSignup.password) {
	    if (!validSignup.username) {
		errorShake(document.getElementById("signup-form-username-validation"));
	    }
	    if (!validSignup.email) {
		errorShake(document.getElementById("signup-form-email-validation"));
	    }
	    if (!validSignup.password) {
		errorShake(document.getElementById("signup-form-password-validation"));
	    }
	    return
	}

	// in case the user is editing the UN last and hits enter before the debounce checks it,
	//   I want to double check that it's valid cause the database could get weird and need
	//   manual fixing otherwise
	const doubleCheckUn = await validateUsernameUI();
	if (!doubleCheckUn) {
	    // the validateUsernameUI will already display + shake the proper error message
	    return
	}

	signup(email, password).then((userCred) => {
	    try {
		runTransaction(db, async (transaction) => {
		    transaction.set(doc(db, "usernames", makeSafe(username)), {
			uid: userCred.user.uid,
			email: email
		    })

		    transaction.set(doc(db, "users", userCred.user.uid), {
			displayName: username,
			safeName: makeSafe(username),
			createdAt: serverTimestamp()
		    })

		})
		// when we signup, onAuthStateChange will run before these transactions are
		//   recognized, so we set our new username after half a second
		setTimeout(() => {
		    setAccountUI(username)
		}, 500);
	    } catch (error) {
		// this should only be from Firebase errors
		logErrors("Issue running transaction creating new user: '" + makeSafe(username)
			  + "' with UID: '" + userCred.user.uid + "'", error.message);
	    }
	    
	    signupForm.reset();
	    signupDialog.hidePopover();
	}).catch((error) => {
	    if (error.code === 'auth/email-already-in-use') {
		const valEl = document.getElementById("signup-form-email-validation");
		valEl.textContent = 'An account already exists for that email. Try logging in instead';
		errorShake(valEl);
	    } else if (error.code === 'auth/invalid-email') {
		const valEl = document.getElementById("signup-form-email-validation");
		valEl.textContent = 'Submitted email invalid';
		errorShake(valEl);
	    } else if (error.code === 'auth/weak-password') {
		const valEl = document.getElementById("signup-form-password-validation");
		valEl.textContent = 'Password must be at least 6 characters';
		errorShake(valEl);
	    } else if (error.code === 'auth/network-request-failed') {
		const valEl = document.getElementById("signup-form-username-validation");
		valEl.textContent = 'Network error';
		errorShake(valEl);
	    } else {
		const valEl = document.getElementById("signup-form-username-validation");
		valEl.textContent = 'Failed to create account: ' + error.code;
		errorShake(valEl);
		console.log(error, error.code, error.message);
		logErrors("Error creating account with weird code: '" + error.code + "'", error.message);
	    }
	})
    });

    const signOut = document.getElementById("signOut")
    signOut.addEventListener("click", () => {
	logout().then(() => {
	    document.getElementById("profileDropdown").hidePopover();

	    logoutUI();
	}).catch((error) => {
	    // TODO: handle errors
	    console.error("Error logging out", error.code, error.message);
	})
    })
}
