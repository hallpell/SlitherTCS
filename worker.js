// worker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");

let pyodide;

async function init() {
    pyodide = await loadPyodide({
	stdout: (text) => {
	    self.postMessage({ type: "stdout", message: text });
	},
	stderr: (text) => {
	    self.postMessage({ type: "stderr", message: text });
	}
    });

    console.log("Hacky python import");
    const response = await fetch("replMultiline.py");
    const code = await response.text();

    pyodide.FS.writeFile("replMultiline.py", code);
    await pyodide.runPythonAsync(`import replMultiline`);
    console.log("Succeeded");
}

const ready = init();
let terminalBuffer = "";

self.onmessage = async (event) => {
    await ready;

    if (event.data.type === "runEditor") {
	try {
	    //self.postMessage({ type: "status", message: "loading modules" });
	    await pyodide.loadPackagesFromImports(event.data.python);
	    //self.postMessage({ type: "status", message: "running" });
	    
	    const result = await pyodide.runPythonAsync(event.data.python);
	    
	    self.postMessage({ type: "result", message: result });
	    self.postMessage({ type: "status", message: "done" });
	} catch (err) {
	    self.postMessage({ type: "stderr", message: err.message });
	    self.postMessage({ type: "status", message: "error" });
	}
    } else if (event.data.type === "runTerminal") {
	//self.postMessage({ type: "status", message: "Starting runTermial" });
	terminalBuffer += event.data.python + "\n";
	pyodide.globals.set("__code_to_evaluate__", terminalBuffer);
	const readyToExecute = await pyodide.runPythonAsync(`
replMultiline.is_complete(__code_to_evaluate__)
`);
	
	if (readyToExecute) {
	    try {
		//self.postMessage({ type: "status", message: "loading modules" });
		await pyodide.loadPackagesFromImports(event.data.python);
		//self.postMessage({ type: "status", message: "running" });
		
		const result = await pyodide.runPythonAsync(terminalBuffer);

		console.log("In worker result: " + result);
		console.log("In worker JSON: " + JSON.stringify(result));
		
		self.postMessage({ type: "result", message: JSON.stringify(result) });
		self.postMessage({ type: "status", message: "done" });
	    } catch (err) {
		self.postMessage({ type: "stderr", message: err.message });
		self.postMessage({ type: "status", message: "error" });
	    }
	    terminalBuffer = "";
	} else {
	    self.postMessage({ type: "incomplete" });
	    // documenting behavior (as of 4/9/2026):
	    // compared to an interactive python instance on a terminal, this doesn't handle
	    // backslashes in normal strings as continuation of lines nicely, and I don't think
	    // there's a good way to handle it so is staying as a bug for now. I.e.
	    // >>> "abc\
	    // ... def"
	    // is valid in a normal python session, but invalid here. Triple quote multiline 
	    // strings still work as expected, i.e. the following is valid:
	    // >>> """abc
	    // ... def"""
	    // gives the result "abc\ndef". To avoid the newline character, a backslash can be used:
	    // >>> """abc\
	    // ... def"""
	    // gives the result "abcdef"
	}
    }
};
