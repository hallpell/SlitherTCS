import { loadVersion } from "/src/js/loading.js";
import { genericError } from "/src/js/DOMhelpers.js";

export function showVersion() {
    document.getElementById("version").style.display = 'block';
}

export function hideVersion() {
    document.getElementById("version").style.display = 'none';
}

export function setVersion(version) {
    document.getElementById("versionInput").value = version;
    showVersion();
}

export function setMaxVersion(maxVersion) {
    const vi = document.getElementById("versionInput")
    vi.max = maxVersion;
    vi.min = -maxVersion;
}

export function initVersionUI() {
    document.getElementById("versionLoad").addEventListener("click", () => {
	let versionNum = document.getElementById("versionInput").value;
	if (!Number.isInteger(parseFloat(versionNum))) {
	    genericError("Version number must be an integer");
	    return;
	}
	loadVersion(parseInt(versionNum, 10));
    });
	
}
