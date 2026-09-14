import { getWorker } from "/src/js/workerClient.js"
import { getEditor } from "/src/js/codeMirror.js"
import { getRunningStatus, setRunningStatus, getTerminalFresh, makeTerminalDirty }
  from "/src/js/runningStatus.js"

export async function runEditorCode(code){
    makeTerminalDirty();
    setRunningStatus('busy');

    let worker = getWorker();
    
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
    makeTerminalDirty();
    setRunningStatus('busy');
    
    getWorker().postMessage({
	type: "run",
	python: code,
	source: "terminal"
    });
}

// this is for running the code in the editor
export async function gatherAndRunEditorCode() {
    if (getRunningStatus() === 'ready') {
	if (!getTerminalFresh()) {
	    document.getElementById("output").addError("Running file, refreshing environment");
	}
	let code = getEditor().getValue();
	await runEditorCode(code);
    } else {
	console.log("Couldn't run, code status is: " + getRunningStatus());
	// TODO: add errors for edge cases?
    }
}
    

