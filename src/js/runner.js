import { worker } from "/src/js/workerClient.js"
import { getRunningStatus, setRunningStatus } from "/src/js/runningStatus.js"
import { getEditor } from "/src/js/codeMirror.js"

export async function runEditorCode(code){
    console.log("Starting to run editor code", code);
    
    setRunningStatus('busy');
	
    // send a message to reset the interactive console
    worker.postMessage({
	type: "refresh",
	python: undefined
    });
    
    worker.postMessage({
	type: "run",
	python: code,
	source: "editor"
    });
}

export async function runTerminalCode(code){
    console.log("Starting to run terminal code", code)
    
    setRunningStatus('busy');
    
    worker.postMessage({
	type: "run",
	python: code,
	source: "terminal"
    });
}

// this is for running the code in the editor
export async function gatherAndRunEditorCode() {
    if (getRunningStatus() === 'ready') {
	document.getElementById("output").addError("Running file, refreshing environment");
	let code = getEditor().getValue();
	await runEditorCode(code);
    } else {
	console.log("Couldn't run, code status is: " + getRunningStatus());
	// TODO: add errors for edge cases?
    }
}
    

