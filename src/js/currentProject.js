// the project name we store here is the "Safe name" (as opposed to the display name)
//   the safe name is what will appear in the URL and should be in the database under:
//   doc(db, "users", uid, "projectNames", safeName)
// making a name safe is defined in /src/js/jsUtils.js
let curProjectName = null;
let curProjectId = null;
let projOwner = false;
let ownerId = null;
let dirty = false;

export function isDirty() {
    return dirty;
}

const saveEl = document.getElementById("save");

export function makeDirty() {
    dirty = true;
    saveEl.textContent = 'Save';
    saveEl.classList.add('save-dirty');
    saveEl.classList.remove('save-clean');
    saveEl.classList.remove('save-saving');
}

export function makeClean() {
    dirty = false;
    saveEl.textContent = 'Saved';
    saveEl.classList.add('save-clean');
    saveEl.classList.remove('save-dirty');
    saveEl.classList.remove('save-saving');
}

export function makeSaving() {
    // don't disturb dirty, but this generally should only be called when dirty==true
    saveEl.textContent = 'Saving...';
    saveEl.classList.add('save-saving');
    saveEl.classList.remove('save-dirty');
    saveEl.classList.remove('save-clean');
}

export function isSaving() {
    return saveEl.classList.contains('save-saving');
}

export function getProjectName() {
    if (curProjectName) {
	return curProjectName;
    } else {
	return false;
    }
}

export function getProjectId() {
    if (curProjectId) {
	return curProjectId;
    } else {
	return false;
    }
}

export function getOwnerId() {
    return ownerId;
}

export function getOwns() {
    return projOwner;
}

export function setProjectName(val) {
    curProjectName = val;
}

export function setProjectId(val) {
    curProjectId = val;
}

export function setOwnerId(val) {
    ownerId = val;
}

export function setOwns(val) {
    projOwner = !!val; // force to be a boolean with !!
}

