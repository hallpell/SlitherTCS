import { getRunningStatus, setRunningStatus, sendInterrupt } from "/src/js/runningStatus.js";
import { worker } from "/src/js/workerClient.js";
import { runTerminalCode } from "/src/js/runner.js";

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
    
    let history = [];
    let historyIndex = -1;
    let buffer = "";
    
    ourInput.addEventListener("keydown", async (e) => {
	if (e.key === "Enter") {
	    if (getRunningStatus() == 'ready' || getRunningStatus() == 'awaitingIncomplete') {
		const code = ourInput.value;
		output.appendText(code);
		output.addText("");
		
		history.push(code);
		historyIndex = history.length;
		
		ourInput.value = "";
		await runTerminalCode(code);
	    } else if (getRunningStatus() == 'awaitingInput') {
		const response = ourInput.value;
		output.appendInput(response);
		output.addText("");
		
		ourInput.value = "";
		worker.postMessage({ type: "input-response", value: response });

		// WARNING: this was changed from 'ready' to 'busy' without testing
		//   (I think we're handing execution back to the worker, but worried)
		setRunningStatus('busy');
	    } else {
		// pass, terminal status is busy.
		// TODO: Think about good UI to indicate nothing is happening
	    }
	}
	
	if (e.key === "ArrowUp") {
	    if (historyIndex > 0) {
		historyIndex--;
		ourInput.value = history[historyIndex];
	    }
	    e.preventDefault();
	}
	
	if (e.key === "ArrowDown") {
	    if (historyIndex < history.length - 1) {
		historyIndex++;
		ourInput.value = history[historyIndex];
	    } else {
		ourInput.value = "";
	    }
	    e.preventDefault();
	}
	
	if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
	    // TODO: maybe don't prevent default? Allow Ctrl+C to copy from terminal
	    //         as well as sending interrupt?
	    e.preventDefault();
	    sendInterrupt();
	}
    });
}
