import { worker } from "/src/js/workerClient.js"
import { setTerminalStatus } from "/src/js/main.js"
import { getEditor } from "/src/js/codeMirrorInit.js"

export async function runEditorCode(code){
    console.log("Starting to run editor code", code);
    
    setTerminalStatus('busy');
	
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
    
    setTerminalStatus('busy');
    
    worker.postMessage({
	type: "run",
	python: code,
	source: "terminal"
    });
}

// this is for running the code in the editor
export async function gatherAndRunEditorCode() {
    document.getElementById("output").addError("Running file, refreshing environment");
    let code = getEditor().getValue();
    await runEditorCode(code);
}
    

