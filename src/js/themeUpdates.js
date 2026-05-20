import { getEditor } from "./codeMirrorInit.js";
import { db, auth } from "./firebase.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

export function initThemeUpdates() {
    const cmThemeOption = document.getElementById("cmTheme");
    cmThemeOption.addEventListener('change', () => {
	if (auth.currentUser) {
	    setDoc(doc(db, 'users', auth.currentUser.uid), {
		cmTheme: cmThemeOption.value
	    }, { merge: true }).catch((error) => {
		console.log("Error writing Code Mirror Theme to profile");
		console.error(error);
	    });
	}
	getEditor().setOption("theme", cmThemeOption.value);
    })
    
    const terminalThemeOption = document.getElementById("terminalTheme");
    const terminalEl = document.getElementById("terminal");
    terminalThemeOption.addEventListener('change', () => {
	if (auth.currentUser) {
	    setDoc(doc(db, 'users', auth.currentUser.uid), {
		terminalTheme: terminalThemeOption.value
	    }, { merge: true }).catch((error) => {
		console.log("Error writing Terminal Theme to profile");
		console.error(error);
	    });
	}
	if (terminalThemeOption.value == 'light') {
	    terminalEl.classList.add("terminal-light-theme");
	    terminalEl.classList.remove("terminal-dark-theme");
	} else if (terminalThemeOption.value == 'dark') {
	    terminalEl.classList.add("terminal-dark-theme");
	    terminalEl.classList.remove("terminal-light-theme");
	}
    })
}
