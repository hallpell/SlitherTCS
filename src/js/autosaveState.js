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
	el.style.backgroundColor = "green";
    } else {
	el.textContent = "Autosave Off";
	el.style.backgroundColor = "orange";
    }
}

export function toggleAutosave() {
    if (autosave) {
	setAutosave(false);
    } else {
	setAutosave(true);
    }
}
