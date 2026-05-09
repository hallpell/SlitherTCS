import { getEditor } from "./codeMirrorInit.js";

export function initThemeUpdates() {
    const cmThemeOption = document.getElementById("cmTheme");
    cmThemeOption.addEventListener('change', () => {
	getEditor().setOption("theme", cmThemeOption.value);
    })
    
    const terminalThemeOption = document.getElementById("terminalTheme");
    const terminalEl = document.getElementById("terminal");
    terminalThemeOption.addEventListener('change', () => {
	console.log("Stuff");
	if (terminalThemeOption.value == 'light') {
	    terminalEl.classList.add("terminal-light-theme");
	    terminalEl.classList.remove("terminal-dark-theme");
	} else if (terminalThemeOption.value == 'dark') {
	    terminalEl.classList.add("terminal-dark-theme");
	    terminalEl.classList.remove("terminal-light-theme");
	}
    })
}
