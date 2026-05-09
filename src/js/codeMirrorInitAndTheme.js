const editor = CodeMirror(
    document.getElementById("editor"),
    {
	mode: 'python',
	lineNumbers: true,
	indentUnit: 2,
	tabSize: 2,
	indentWithTabs: false,
	lineWrapping: false,
	theme: "eclipse"
    });

const cmThemeOption = document.getElementById("cmTheme");
cmThemeOption.addEventListener('change', () => {
    editor.setOption("theme", cmThemeOption.value);
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

export default editor;
