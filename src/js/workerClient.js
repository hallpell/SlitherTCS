import { attachMainWorker } from "/src/js/workerDOM.js";

let mainWorker = null;
let backupWorker = null;
let timeoutID = null;

export function getWorker() {
    return mainWorker;
}

export function terminateWorker() {
    mainWorker.terminate();
    // if backup worker is ready
    if (backupWorker !== null) {
	// promote backup to main;
	mainWorker = backupWorker;
	attachMainWorker();

	// clear out backupWorker, and regenerate it
	backupWorker = null;

	timeoutID = setTimeout(() => {
	    backupWorker = new Worker(new URL("./worker.js", import.meta.url),
				      {type: 'module'});
	    timeoutID = null;
	}, 1000);
    } else {
	// cancel any regeneration of the backup worker currently planned
	if (timeoutID !== null) {
	    clearTimeout(timeoutID);
	    timeoutID = null;
	}
	initWorker();
    }
}

export function initWorker() {
    mainWorker = new Worker(new URL("./worker.js", import.meta.url),
			    {type: 'module'});

    timeoutID = setTimeout(() => {
	backupWorker = new Worker(new URL("./worker.js", import.meta.url),
				  {type: 'module'});
	timeoutID = null;
    }, 10000);
}

/*export const worker = new Worker(new URL("./worker.js", import.meta.url),
			  { type: 'module' });*/


