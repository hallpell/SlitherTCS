import { login, signup, logout } from "./auth.js";
import { toggleDBGopen } from "./modalBackground.js";
import { db, auth } from "./firebase.js";
import { logoutUI, setAccountUI } from "./accountStateUI.js";
import { setEditor } from "./codeMirrorInit.js";
import { loadFromUIDs } from "./loading.js";
import { isInvalidDocumentName } from "./firebaseHelpers.js";
import { setProjectName, setProjectId, setOwns } from "./currentProject.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { doc, collection, setDoc, getDoc, getDocs } from
"https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

function buildTemporallySortedProjects(colSnap) {
    let tsps = [];
    colSnap.forEach((d) => {
	const data = d.data();
	let val = {
	    time: data.updatedAt,
	    name: data.name,
	    id: d.id
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

function insertProjects(projs) {
    const frag = document.createDocumentFragment();
    
    projs.forEach((p) => {
	const li = document.createElement('li');
	const span = document.createElement('span');
	span.textContent = p.name;

	li.classList.add('userProject');

	frag.appendChild(li);
	li.appendChild(span);
	li.addEventListener("click", () => {
	    loadFromUIDs(auth.currentUser.uid, p.id);
	})
    })

    const profileList = document.getElementById("profileList");
    profileList.insertBefore(frag, document.getElementById("signOutLI"));
}

export function initAccountUI() {
    const loginDialog = document.getElementById("login-dialog");
    const signupDialog = document.getElementById("signup-dialog");
    loginDialog.addEventListener("toggle", toggleDBGopen);
    signupDialog.addEventListener("toggle", toggleDBGopen);

    document.getElementById("newProject").addEventListener("click", () => {
	// TODO: Complain if project is dirty
	setEditor("");
	setProjectName(null);
	setProjectId(null);
	setOwns(false);

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
	    getDocs(collection(db, 'users', user.uid, 'projects')).then((colSnapshot) => {
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

	    const snap = await getDoc(doc(db, "usernames", identifier.toLowerCase()));
	    if (snap.exists()) {
		email = snap.data().email;
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
	    // TODO: Handle errors + display reasonably
	    console.error("Error logging in:");
	    console.error(error);
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

	const myDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
	if (myDoc.exists()) {
	    // TODO: Prettier errors
	    alert("Username not available");
	    return
	}
	
	if (password.length < 6) {
	    // TODO: prettier errors
	    alert("Password must be at least characters");
	    return;
	}

	console.log("Creating account with", email, password);

	signup(email, password).then((userCred) => {
	    // onAuthStateChanged handles some UI

	    setDoc(doc(db, "usernames", username.toLowerCase()), {
		uid: userCred.user.uid,
		email: email
	    }).catch((error) => {
		console.log(error);
		alert("Couldn't write username (but account exists)");
	    });

	    setDoc(doc(db, "users", userCred.user.uid), {
		displayName: username,
		createdAt: Date.now()
	    }).catch((error) => {
		console.log("Couldn't create user profile in firebase");
	    })
	    
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
	    document.getElementById("profileDropdown").hidePopover();

	    logoutUI();
	}).catch((error) => {
	    // TODO: handle errors
	    console.error("Error logging out", error.code, error.message);
	})
    })
}
