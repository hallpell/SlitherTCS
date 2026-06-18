let autosave = true;

export function getAutosave() {
    return autosave;
}

export function setAutosave(bool) {
    // !! to enforce boolean
    autosave = !!bool;

    const el = document.getElementById("autosave");
    if (autosave) {
	el.textContent = "Autosave On";
	el.classList.add('autosave-enabled');
	el.classList.remove('autosave-disabled');
    } else {
	el.textContent = "Autosave Off";
	el.classList.add('autosave-disabled');
	el.classList.remove('autosave-enabled');
    }
}

export function toggleAutosave() {
    if (autosave) {
	setAutosave(false);
    } else {
	setAutosave(true);
    }
}
