// this initializes firebase and got grumpy when I tried to make it 
//   export an init function, so is just stuck like this at the top
import "/src/js/firebase.js";

import { worker } from "/src/js/workerClient.js";
import { initEditor, getEditor } from "/src/js/codeMirrorInit.js";
import { initThemeUpdates } from "/src/js/themeUpdates.js";
import { initCollapsingUI } from "/src/js/collapsingUI.js";
import { initTerminalDOM } from "/src/js/terminalDOM.js";
import { initMatPlotLibAttacher } from "/src/js/matPlotLibAttacher.js"; // TODO: FIX (broken from webWorker)
import { initWorkerDOM } from "/src/js/workerDOM.js";
import { initTerminalUI } from "/src/js/terminalUI.js";
import { gatherAndRunEditorCode } from "/src/js/runner.js";
import { initAccountUI } from "/src/js/accountUI.js";
import { initSaveUI } from "/src/js/saving.js";

initEditor();
initThemeUpdates();
initCollapsingUI();
initTerminalDOM();
initMatPlotLibAttacher(); // TODO: FIX (broken from webWorker)
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

export function sendInterrupt() {
    // TODO: only send if we're running code (if you interrupt while nothing is running, you
    //   get a weird error the next time you try to run things)
    Atomics.store(interruptBuffer, 0, 2); // 2 = SIGINT-like signal
    Atomics.notify(interruptBuffer, 0);
}

