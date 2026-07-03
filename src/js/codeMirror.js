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
	    theme: "eclipse",
	    extraKeys: {
		Tab: function(cm) {
		    if (cm.somethingSelected()) {
			cm.execCommand("indentMore");
		    } else {
			cm.execCommand("insertSoftTab");
		    }
		},
		"Shift-Tab": "indentLess"
	    }
	});
}

export function getEditor() {
    return editor;
}

export function setEditor(val) {
    editor.setValue(val);
}
