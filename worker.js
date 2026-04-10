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
    const response = await fetch("runner.py");
    const code = await response.text();

    pyodide.FS.writeFile("runner.py", code);
    await pyodide.runPythonAsync(`import runner`);
    console.log("Succeeded");
}

const ready = init();

self.onmessage = async (event) => {
    await ready;

    if (event.data.type == "refresh") {
	await pyodide.runPythonAsync(`runner.refresh()`);

	self.postMessage({ type: "status", message: "refreshed" });
    }
    
    if (event.data.type == "run") {
	try {
	    await pyodide.loadPackagesFromImports(event.data.python);

	    pyodide.globals.set("__code_to_evaluate__", event.data.python);
	    let hasRun
	    if (event.data.source === "terminal") {
		hasRun = await pyodide.runPythonAsync(
		    `runner.feed_code(__code_to_evaluate__)`);
	    } else if (event.data.source === "editor") {
		hasRun = await pyodide.runPythonAsync(
		    `runner.exec_file(__code_to_evaluate__)`);
	    }
	    
	    if (hasRun) {
		if (hasRun === true) {
		    self.postMessage({ type: "result", message: undefined });
		} else {
		    self.postMessage({ type: "result", message: hasRun });
		}
		self.postMessage({ type: "status", message: "done" });
	    } else {
		self.postMessage({ type: "incomplete" });
	    }
	} catch (err) {
	    self.postMessage({ type: "error", message: err.message });
	    self.postMessage({ type: "status", message: "error" });
	}
    }

    if (event.data.type === "runEditor") {
	
    }
};
