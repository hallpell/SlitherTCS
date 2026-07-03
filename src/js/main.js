// this initializes firebase and got grumpy when I tried to make it 
//   export an init function, so is just stuck like this at the top
import "/src/js/firebase.js";

import { worker } from "/src/js/workerClient.js";
import { initEditor, getEditor } from "/src/js/codeMirror.js";
import { initThemeUpdates } from "/src/js/themeUpdates.js";
import { initCollapsingUI } from "/src/js/collapsingUI.js";
import { initTerminalDOM } from "/src/js/terminalDOM.js";
import { initWorkerDOM } from "/src/js/workerDOM.js";
import { initTerminalUI } from "/src/js/terminalUI.js";
import { initAccountUI } from "/src/js/accountUI.js";
import { initSaveUI } from "/src/js/saving.js";
import { initLoad } from "/src/js/loading.js";
import { initRunningStatus } from "/src/js/runningStatus.js";
    
initEditor();
initThemeUpdates();
initCollapsingUI();
initTerminalDOM();
initWorkerDOM();
initTerminalUI();
initAccountUI();
initSaveUI();
initLoad();
initRunningStatus();


