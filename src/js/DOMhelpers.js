export function errorShake(el) {
    el.classList.remove("error-shake");

    el.classList.add("error-shake");
    setTimeout(() => { el.classList.remove("error-shake") }, 500);
}

function showDialog(message, onConfirm, onCancel) {
    document.getElementById("generic-confirmation-text").textContent = message;

    document.getElementById("generic-confirm").addEventListener("click", onConfirm);
    document.getElementById("generic-cancel").addEventListener("click", onCancel);

    return function clean() {
	document.getElementById("generic-confirm").removeEventListener("click", onConfirm);
	document.getElementById("generic-cancel").removeEventListener("click", onCancel);
    }
}

export async function confirmDialog(message) {
    const dia = document.getElementById("generic-confirmation-dialog");
    return new Promise(resolve => {
	const clean = showDialog(message, () => {
	    dia.hidePopover();
	    clean();
	    resolve(true);
	}, () => {
	    dia.hidePopover();
	    clean();
	    resolve(false);
	})

	dia.showPopover();
    })
}

export function genericError(message) {
    const dialog = document.getElementById('generic-error-dialog');
    const textDiv = document.getElementById('generic-error-text');

    textDiv.textContent = message;
    dialog.showPopover();
}
