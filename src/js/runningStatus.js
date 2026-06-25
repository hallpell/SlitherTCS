import { worker } from "/src/js/workerClient.js";

let runningStatus = 'ready';

export function getRunningStatus() {
    return runningStatus;
}

export function setRunningStatus(val) {
    const runButton = document.getElementById("runCode");
    const stopButton = document.getElementById("stopCode");
    if (val == 'busy') {
	runButton.classList.add('running-disabled');
	stopButton.classList.remove('running-disabled');
    } else if (val == 'ready') {
	stopButton.classList.add('running-disabled');
	runButton.classList.remove('running-disabled');
    }
    runningStatus = val;
}

const interruptBuffer = new Int32Array(new SharedArrayBuffer(4));

export function sendInterrupt() {
    // TODO: only send if we're running code (if you interrupt while nothing is running, you
    //   get a weird error the next time you try to run things)
    Atomics.store(interruptBuffer, 0, 2); // 2 = SIGINT-like signal
    Atomics.notify(interruptBuffer, 0);
}

export function initRunningStatus() {
    worker.postMessage({ type: "init_buffer",
			 interruptBuffer: interruptBuffer });

    setRunningStatus("ready");

    // this still fires when it is "inactive" - sendInterrupt should handle that intelligently
    document.getElementById("stopCode").addEventListener("click", sendInterrupt);
}
