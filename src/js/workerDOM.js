import { getWorker } from "/src/js/workerClient.js";
import { setRunningStatus } from "/src/js/runningStatus.js";

const SVG_NS = "http://www.w3.org/2000/svg";
// code to jam turtle graphics into the graphics box
const elementFromProps = (map) => {
    const tag = map.get("tag");
    if (!tag) { return document.createTextNode(map.get("tag")); }
    
    const node = document.createElementNS(SVG_NS, map.get("tag"));
    
    const pProps = map.get("props")
    const props = pProps instanceof Map ? pProps : new Map(Object.entries(pProps))
    
    for (const [key, value] of props) { node.setAttribute(key, value); }
    for (let i = 0; i < map.get("children").length; i++) {
	node.appendChild(elementFromProps(new Map(Object.entries(map.get("children")[i]))));
    }
    
    return node;
}

export function initWorkerDOM() {
    attachMainWorker();
}

export function attachMainWorker() {    
    const output = document.getElementById("output");
    const ourInput = document.getElementById("repl-input");
    getWorker().onmessage = function (event) {
	const { type, message } = event.data;
	
	switch (type) {
	case "stdout":
	    output.addText(message);
	    break;
	    
	case "stderr":
	    // most errors will have a trace through 2 Pyodide files that won't be relevant to
	    //   the user so we jump to part of the error message that involves the user's code
	    //console.log(message);
	    if (message.substring(message.length-18, message.length-1) == "KeyboardInterrupt") {
		output.addError("KeyboardInterrupt");
	    } else {
		let userError = message.indexOf('File "<string>"');
		let errorMessage = message
		if (userError != -1) {
		    errorMessage = message.substring(userError);
		}
		output.addError(errorMessage);

		// if we get an error and the terminal is hidden, add a pulse to the collapsed text to
		//   draw the user's eye that an error occurred
		if (document.getElementById('collapsedTerminal').style.display != 'none') {
		    document.getElementById('collapsedTerminalText').classList.add('error-pulse')
		}
	    }
	    break;
	    
	case "result":
	    if (message) {
		// result is often undefined as we do not use
		//   the "return value" of executing python very often
		//   if it is not present, we skip this and just display another prompt
		output.addText(message);
	    }
	    break;
	    
	case "status":
	    if (message === "done" || message === "error" || message === "abandoned") {
		if (message === "abandoned") {
		    output.addError("KeyboardInterrupt");
		}
		output.printPrompt();
		setRunningStatus('ready');
	    }
	    if (message === "initialized") {
		output.printPrompt();
		setRunningStatus('ready');
	    }
	    break;
	    
	case "incomplete":
	    output.printIncomplete();
	    setRunningStatus('awaitingIncomplete');
	    break;
	    
	case "turtle_graphics":
	    const turtleGraphicEl = elementFromProps(new Map(Object.entries(message)));
	    // this prevents it from using extra vertical space, which breaks the layout
	    turtleGraphicEl.style.display = 'block';
	    document.getElementById("graphics").innerHTML = turtleGraphicEl.outerHTML;
	    turtleGraphicEl.setCurrentTime(0);
	    break;

	case "matplotlib":
	    const blob = new Blob([message], { type: 'image/png' });
	    const url = URL.createObjectURL(blob);

	    const img = document.createElement("img");
	    img.src = url;
	    img.onload = () => URL.revokeObjectURL(url);
	    
	    document.getElementById("graphics").replaceChildren(img);
	    break;
	    
	case "stdin_request":
	    output.addText(message);
	    setRunningStatus('awaitingInput');
	    // force the focus on input (which will also make the cursor blink)
	    ourInput.focus();
	    break;
	}
    }
    getWorker().postMessage({type: "promoted_to_main"});
}
