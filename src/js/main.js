// this initializes firebase and got grumpy when I tried to make it 
//   export an init function, so is just stuck like this at the top
import "/src/js/firebase.js";

import { worker } from "/src/js/workerClient.js";
import { initEditor, getEditor } from "/src/js/codeMirror.js";
import { initThemeUpdates } from "/src/js/themeUpdates.js";
import { initCollapsingUI } from "/src/js/collapsingUI.js";
import { initTerminalDOM } from "/src/js/terminalDOM.js";
import { initMatPlotLibAttacher } from "/src/js/matPlotLibAttacher.js"; // TODO: FIX (broken from webWorker)
import { initWorkerDOM } from "/src/js/workerDOM.js";
import { initTerminalUI } from "/src/js/terminalUI.js";
import { initAccountUI } from "/src/js/accountUI.js";
import { initSaveUI } from "/src/js/saving.js";
import { initLoad } from "/src/js/loading.js";

import { gatherAndRunEditorCode } from "/src/js/runner.js";

    
initEditor();
initThemeUpdates();
initCollapsingUI();
initTerminalDOM();
initMatPlotLibAttacher(); // TODO: FIX (broken from webWorker)
initWorkerDOM();
initTerminalUI();
initAccountUI();
initSaveUI();
initLoad();

document.getElementById("runCode").addEventListener("click", gatherAndRunEditorCode);

// this whole computation (as opposed to just clientWidth/clientHeight) is necessary
//   because clientWidth will round up, which adds scrollbars and breaks the layout
worker.postMessage({ type: "graphics_dims",
     width: Math.floor(document.getElementById("graphics").getBoundingClientRect().width), 
     height: Math.floor(document.getElementById("graphics").getBoundingClientRect().height) });


