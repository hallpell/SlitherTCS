// worker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");

let pyodide;

async function init() {
    pyodide = await loadPyodide({
	stdout: (text) => {
	    self.postMessage({ type: "stdout", text });
	},
	stderr: (text) => {
	    self.postMessage({ type: "stderr", text });
	}
    });
}

const ready = init();

self.onmessage = async (event) => {
    await ready;

    
    if (event.data.type === "run") {
	try {
	    self.postMessage({ type: "status", message: "running" });
	    console.log(event.data.python);
	    
	    const result = await pyodide.runPythonAsync(event.data.python);
	    
	    self.postMessage({ type: "result", result });
	    self.postMessage({ type: "status", message: "done" });
	} catch (err) {
	    self.postMessage({ type: "stderr", text: err.message });
	    self.postMessage({ type: "status", message: "error" });
	}
    }
};
