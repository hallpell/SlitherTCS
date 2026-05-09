let editor;

export function initEditor() {
    editor = CodeMirror(
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
}

export function getEditor() {
    return editor;
}
