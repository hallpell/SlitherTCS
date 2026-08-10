import { getRunningStatus, setRunningStatus, sendInterrupt } from "/src/js/runningStatus.js";
import { worker } from "/src/js/workerClient.js";
import { runTerminalCode } from "/src/js/runner.js";
import { getEditor } from "/src/js/codeMirror.js";

export async function initTerminalUI() {
    const ourInput = document.getElementById("repl-input");
    const output = document.getElementById("output");
    const terminal = document.getElementById("terminal");


    // for focus reasons
    let isDragging = false;
    let startCoords = null;

    terminal.addEventListener("mousedown", (e) => {
	isDragging = false;
	startCoords = {x: e.screenX, y: e.screenY};
    });

    terminal.addEventListener("mousemove", (e) => {
	isDragging = true;
    });
    
    terminal.addEventListener("click", (e) => {
	// don't focus if we click on the bar
	if (document.getElementById("terminalBar").contains(e.target)) {
	    return;
	}

	// don't focus if the user has selected (highlighted) something
	const selection = window.getSelection();
	if (selection && !selection.isCollapsed) {
	    return
	}

	// don't focus if the mouse moved more than 5 px as part of this click
	if (isDragging &&
	    ((e.screenX - startCoords.x)**2 + (e.screenY - startCoords.y)**2) >= 25) {
	    return;
	}
	
	ourInput.focus();
    })

    // this prevents the terminal clear button from being focused from a click (mainly to maintain focus in the terminal)
    document.getElementById("terminalClear").addEventListener('mousedown', (e) => { e.preventDefault() });
    // this actually clears the terminal when the button is clicked
    document.getElementById("terminalClear").addEventListener('click', output.clearTerminal);
    
    let history = [];
    let historyIndex = -1;
    let buffer = "";
    
    ourInput.addEventListener("keydown", async (e) => {
	if (e.key === "Enter") {
	    if (getRunningStatus() == 'ready' || getRunningStatus() == 'awaitingIncomplete') {
		const code = ourInput.value;
		output.appendText(code);
		output.addText("");

		if (code.trim().length > 0) {
		    history.push(code);
		    historyIndex = history.length;
		}
		buffer = "";
		
		ourInput.value = "";
		await runTerminalCode(code);
	    } else if (getRunningStatus() == 'awaitingInput') {
		const response = ourInput.value;
		output.appendInput(response);
		output.addText("");
		
		ourInput.value = "";
		worker.postMessage({ type: "input-response", value: response });

		setRunningStatus('busy');
	    } else {
		// pass, terminal status is busy.
		// TODO: Think about good UI to indicate nothing is happening
	    }
	} // Enter

	else if (e.key === "Tab" && e.shiftKey) {
	    e.preventDefault();

	    getEditor().focus();
	} else if (e.key === "Tab") {
	    e.preventDefault();

	    const start = ourInput.selectionStart;
	    const end = ourInput.selectionEnd;
	    const val = ourInput.value;

	    // if everything before the cursor is whitespace
	    if (val.slice(0, start).trim().length === 0) {
		// add an indent level to ourInput
		let numSpaces = 2*(Math.floor(start/2)+1);
		ourInput.value = " ".repeat(numSpaces) + val.slice(end);
		ourInput.setSelectionRange(numSpaces, numSpaces);
	    } else {
		// replace tab with 2 spaces
		//   (I'm not sure how reasonable this is -
		//      I'd like it to be autocomplete (or fail and pass), but that's not currently very feasible?)
		ourInput.value = val.slice(0, start) + "  " + val.slice(end);
		ourInput.setSelectionRange(start, start);
	    }
	}
	
	if (e.key === "ArrowUp") {
	    if (historyIndex > 0) {
		// if we're at the end of history and the user has entered things,
		//   store it in our buffer
		if (historyIndex == history.length && ourInput.value.trim().length > 0) {
		    buffer = ourInput.value;
		    console.log(buffer);
		}
		historyIndex--;
		ourInput.value = history[historyIndex];
		// set cursor to the end of the line
		const l = ourInput.value.length;
		ourInput.setSelectionRange(l,l);
	    }
	    e.preventDefault();
	}
	
	if (e.key === "ArrowDown") {
	    if (historyIndex < history.length - 1) {
		historyIndex++;
		ourInput.value = history[historyIndex];
	    } else {
		historyIndex = history.length;
		ourInput.value = buffer;
		buffer = "";
	    }
	    // set cursor to the end of the line
	    const l = ourInput.value.length;
	    ourInput.setSelectionRange(l,l);
	    e.preventDefault();
	}

	if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "l") {
	    e.preventDefault();
	    output.clearTerminal();
	}
	
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
	    // TODO: maybe don't prevent default? Allow Ctrl+C to copy from terminal
	    //         as well as sending interrupt?
	    //e.preventDefault();
	    sendInterrupt();
	}
    });
}
