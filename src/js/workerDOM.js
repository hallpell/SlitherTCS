import { worker } from "/src/js/workerClient.js";
import { setTerminalStatus } from "/src/js/main.js";

// code to jam turtle graphics into the graphics box
const elementFromProps = (map) => {
    const tag = map.get("tag");
    if (!tag) { return document.createTextNode(map.get("tag")); }
    
    const node = document.createElement(map.get("tag"));
    
    const pProps = map.get("props")
    const props = pProps instanceof Map ? pProps : new Map(Object.entries(pProps))
    
    for (const [key, value] of props) { node.setAttribute(key, value); }
    for (let i = 0; i < map.get("children").length; i++) {
	node.appendChild(elementFromProps(new Map(Object.entries(map.get("children")[i]))));
    }
    
    return node;
}

export function initWorkerDOM() {
    const output = document.getElementById("output");
    const ourInput = document.getElementById("repl-input");
    worker.onmessage = function (event) {
	const { type, message } = event.data;
	
	switch (type) {
	case "stdout":
	    output.addText(message);
	    break;
	    
	case "stderr":
	    // most errors will have a trace through 2 Pyodide files that won't be relevant to
	    //   the user so we jump to part of the error message that involves the user's code
	    console.log(message);
	    let userError = message.indexOf('File "<string>"');
	    let errorMessage = message
	    if (userError != -1) {
		errorMessage = message.substring(userError);
	    }
	    output.addError(errorMessage);
	    break;
	    
	case "result":
	    if (message) {
		// result is often undefined as we do not use
		//   the "return value" of executing python very often
		//   if it is not present, we skip this and just display another prompt
		output.addText(message);
	    }
	    console.log("Result: " + message);
	    break;
	    
	case "status":
	    if (message === "done" || message === "error") {
		output.printPrompt();
		setTerminalStatus('ready');
	    }
	    console.log("Status:", message);
	    break;
	    
	case "incomplete":
	    console.log("Incomplete line detected");
	    output.addText("... ");
	    setTerminalStatus('ready');
	    break;
	    
	case "turtle_graphics":
	    console.log("Turtle graphics detected");
	    const turtleGraphicEl = elementFromProps(new Map(Object.entries(message)));
	    // this prevents it from using extra vertical space, which breaks the layout
	    turtleGraphicEl.style.display = 'block';
	    document.getElementById("graphics").innerHTML = turtleGraphicEl.outerHTML;
	    break;
	    
	case "stdin_request":
	    console.log("stdin_request detected")
	    output.addText(message);
	    setTerminalStatus('awaitingInput');
	    // force the focus on input (which will also make the cursor blink)
	    ourInput.focus();
	    break;
	}
    }
} 
