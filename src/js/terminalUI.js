import { getRunningStatus, setRunningStatus, sendInterrupt } from "/src/js/runningStatus.js";
import { worker } from "/src/js/workerClient.js";
import { runTerminalCode } from "/src/js/runner.js";

export async function initTerminalUI() {
    const ourInput = document.getElementById("repl-input");
    const output = document.getElementById("output");

    document.getElementById("terminal").addEventListener("click", (e) => {
	// don't focus if we click on the bar
	if (document.getElementById("terminalBar").contains(e.target)) {
	    return;
	}
	ourInput.focus();
    })
    
    let history = [];
    let historyIndex = -1;
    let buffer = "";
    
    ourInput.addEventListener("keydown", async (e) => {
	if (e.key === "Enter") {
	    if (getRunningStatus() == 'ready') {
		const code = ourInput.value;
		output.appendText(code);
		
		history.push(code);
		historyIndex = history.length;
		
		ourInput.value = "";
		await runTerminalCode(code);
	    } else if (getRunningStatus() == 'awaitingInput') {
		const response = ourInput.value;
		output.appendInput(response);
		
		ourInput.value = "";
		worker.postMessage({type: "input-response", value: response});

		// WARNING: this was changed from 'ready' to 'busy' without testing
		//   (I think we're handing execution back to the worker, but worried)
		setRunningStatus('busy');
	    } else if (getRunningStatus() == 'awaitingIncomplete') {
		// not actually using this, delete?
	    } else {
		// pass, terminal status is busy. Think about what UI response should happen
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
	    e.preventDefault();
	    console.log("Saw Ctrl+C");
	    sendInterrupt();
	}
    });
}
