export async function initTerminalUI() {
    const ourInput = document.getElementById("repl-input");
    const output = document.getElementById("output");
    const main = await import("./main.js");
    const workerModule =  await import("./workerClient.js");
    const runnerModule =  await import("./runner.js");

    document.getElementById("terminal").addEventListener("click", (e) => {
	ourInput.focus();
    })
    
    let history = [];
    let historyIndex = -1;
    let buffer = "";
    
    ourInput.addEventListener("keydown", async (e) => {
	if (e.key === "Enter") {
	    if (main.terminalStatus == 'ready') {
		const code = ourInput.value;
		output.appendText(code);
		
		history.push(code);
		historyIndex = history.length;
		
		ourInput.value = "";
		await runnerModule.runTerminalCode(code);
	    } else if (main.terminalStatus == 'awaitingInput') {
		const response = ourInput.value;
		output.appendInput(response);
		
		ourInput.value = "";
		workerModule.worker.postMessage({type: "input-response", value: response});
		
		main.setTerminalStatus('ready');
	    } else if (main.terminalStatus == 'awaitingIncomplete') {
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
