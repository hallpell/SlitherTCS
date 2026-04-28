importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js");

let pyodide;
let interruptBuffer;

async function init() {
    pyodide = await loadPyodide();

    /* this may be useful when dealing with STDIN later,
    // but input is overwritten to not use STDIN (which is the main way
    // I expect students to interact with STDIN)
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

    // refactor these imports into a wheel once stable
    console.log("Hacky python import"); 
    const response = await fetch("runner.py");
    const code = await response.text();

    pyodide.FS.writeFile("runner.py", code);
    await pyodide.runPythonAsync(`import runner`);

    console.log("Overwritting input")
    await pyodide.runPythonAsync(`import asyncio
import js
import builtins

def input(prompt=""):
    loop = asyncio.get_event_loop()
    fut = loop.create_future()
    js._pending_input = fut
    js.requestInput(prompt)
    return loop.run_until_complete(fut)

builtins.input = input`)



    console.log("Done loading")
    //    pyodide.setDebug(true);
}

const ready = init();

let graphicsWidth;
let graphicsHeight;

// code for handling turtle
let hasTurtle = false;
self.sendTurtleData = (e) => {
    self.postMessage({ type: "turtle_graphics", message: e.toJs ? e.toJs() : e });
}

self.requestInput = function(inputPrompt) {
    self.postMessage({
	type: "stdin_request",
	message: inputPrompt
    });
}

self.onmessage = async (event) => {
    await ready;

    if (event.data.type == "init_buffer") {
	interruptBuffer = event.data.interruptBuffer
	pyodide.setInterruptBuffer(interruptBuffer);
	console.log("Interrupt Buffer Connected");
    }

    if (event.data.type == "init_graphics") {
	graphicsWidth = event.data.width;
	graphicsHeight = event.data.height;
    }
    
    if (event.data.type == "refresh") {
	await pyodide.runPythonAsync(`runner.refresh()`);
	
	self.postMessage({ type: "status", message: "refreshed" });
    }

    if (event.data.type == "input-response") {
	console.log("Recieved", event.data.value);
	const resolve = self._pending_input.toJs();
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
//		self.postMessage({type: "stdout", message: "importing turtle"});
		await pyodide.loadPackage('micropip');
		await pyodide.runPythonAsync(`
import micropip
print("loading turtle")
await micropip.install('./vendor/turtle-0.0.1-py3-none-any.whl')
import turtle
import turtleSender
turtle._CFG['canvwidth'] = ${graphicsWidth}
turtle._CFG['canvheight'] = ${graphicsHeight}`);
	    }
	    
	    pyodide.globals.set("__code_to_evaluate__", event.data.python);
	    let hasRun
	    if (event.data.source === "terminal") {
		hasRun = await pyodide.runPythonAsync(
		    `runner.feed_code(__code_to_evaluate__)`);
	    } else if (event.data.source === "editor") {
		//hasTurtle = false;
		// this is not necessary since we're still in the same pyodide
		//  instance so micropip is still loaded and our custom turtle wheel is registered
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
