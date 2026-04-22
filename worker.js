// worker.js

importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");

let pyodide;
//let inputPromiseResolution = null;

async function init() {
    pyodide = await loadPyodide();

    /* emulating stdin by hacking at input
    pyodide.setStdin({
	isatty: true,
	stdin: () => {
	    return "test\n"; //Promise.resolve("test\n");
	    //new Promise((resolve) => {
	    //  inputPromiseResolution = resolve;

	    //	self.postMessage({ type: "stdin-request" });
	    //}); 
	},
    }); */

    pyodide.setStdout({
	batched: (text) => {
	    self.postMessage({ type: "stdout", message: text });
	}
    });
    
    pyodide.setStderr({
	batched: (text) => {
	    self.postMessage({ type: "stderr", message: text });
	}
    });

    console.log("Hacky python import");
    const response = await fetch("runner.py");
    const code = await response.text();

    pyodide.FS.writeFile("runner.py", code);
    await pyodide.runPythonAsync(`import runner`);
    console.log("Succeeded");
//    pyodide.setDebug(true);
}

const ready = init();

/* code added for custom turtle workaround */
//let graphics = document.getElementById("graphics")
let hasTurtle = false;

self.sendTurtleData = (e) => {
    self.postMessage({ type: "turtle_graphics", message: e.toJs ? e.toJs() : e });
}

/*const fakeBasthonPackage = {
    kernel: {
        display_event: (e) => graphics.innerHTML = elementFromProps(e.toJs().get("content")).outerHTML,
        locals: () => pyodide.runPython("globals()"),
    },
};

const elementFromProps = (map) => {
    const tag = map.get("tag");
    if (!tag) { return document.createTextNode(map.get("text")); }
    
    const node = document.createElement(map.get("tag"));
    
    for (const [key, value] of map.get("props")) { node.setAttribute(key, value); }
    for (const childProps of map.get("children")) { node.appendChild(elementFromProps(childProps)); }
    
    return node;
}*/
/* end turtle additions */

let pythonFutures = []

self.requestInput = function(inputPrompt) {
    self.postMessage({
	type: "stdin_request",
	value: inputPrompt
    });
}

self.onmessage = async (event) => {
    await ready;

    if (event.data.type == "refresh") {
	//await pyodide.runPythonAsync(`runner.refresh()`);

	self.postMessage({ type: "status", message: "refreshed" });
    }

    if (event.data.type == "input-response") {
	console.log("Recieved", event.data.value);
	const resolve = self._pending_inputs.toJs().pop();
	if (resolve) {
	    resolve.set_result(event.data.value);
	}
    }
    
    if (event.data.type == "run") {
	try {
	    await pyodide.loadPackagesFromImports(event.data.python);

	    if (event.data.python.includes("turtle") && !hasTurtle) {
		hasTurtle = true;
		pyodide.registerJsModule("turtleSender", { send: self.sendTurtleData });
		await pyodide.loadPackage('micropip');
		await pyodide.runPythonAsync(`
import micropip
await micropip.install('./vendor/turtle-0.0.1-py3-none-any.whl')`);
	    }
	    
	    pyodide.globals.set("__code_to_evaluate__", event.data.python);
	    let hasRun
	    if (event.data.source === "terminal") { // TODO: check multiline stuff
		hasRun = await pyodide.runPythonAsync(
		    `runner.feed_code(__code_to_evaluate__)`);
	    } else if (event.data.source === "editor") {
		hasTurtle = false;
		hasRun = await pyodide.runPythonAsync(`runner.exec_file(__code_to_evaluate__)`);
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
	    self.postMessage({ type: "stderr", message: err.message });
	    self.postMessage({ type: "status", message: "error" });
	}
    }
};
