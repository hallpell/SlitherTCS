// initializing our worker
import { worker } from "./workerClient.js";
import "./firebase.js";
import { initEditor, getEditor } from "./codeMirrorInit.js";
import { initThemeUpdates } from "./themeUpdates.js";
import { initCollapsingUI } from "./collapsingUI.js";
import { initTerminalDOM } from "./terminalDOM.js";
import { initMatPlotLibAttacher } from "./matPlotLibAttacher.js"; // TODO: FIX
import { initWorkerDOM } from "./workerDOM.js";
import { initTerminalUI } from "./terminalUI.js";
import { gatherAndRunEditorCode } from "./runner.js";
import { initAccountUI } from "./accountUI.js";
import { initSaveUI } from "./saving.js";

initEditor();
initThemeUpdates();
initCollapsingUI();
initTerminalDOM();
initMatPlotLibAttacher(); // TODO: FIX
initWorkerDOM();
initTerminalUI();
initAccountUI();
initSaveUI();

document.getElementById("runCode").addEventListener("click", gatherAndRunEditorCode);

const output = document.getElementById("output");
const ourInput = document.getElementById("repl-input");
export let terminalStatus = 'ready';
export function setTerminalStatus(val) {
    terminalStatus = val;
}
const interruptBuffer = new Int32Array(new SharedArrayBuffer(4));

worker.postMessage({ type: "init_buffer",
		     interruptBuffer: interruptBuffer });
// this whole computation (as opposed to just clientWidth/clientHeight) is necessary
//   because clientWidth will round up, which adds scrollbars and breaks the layout
worker.postMessage({ type: "graphics_dims",
     width: Math.floor(document.getElementById("graphics").getBoundingClientRect().width), 
     height: Math.floor(document.getElementById("graphics").getBoundingClientRect().height) });

function sendInterrupt() {
    Atomics.store(interruptBuffer, 0, 2); // 2 = SIGINT-like signal
    Atomics.notify(interruptBuffer, 0);
}

