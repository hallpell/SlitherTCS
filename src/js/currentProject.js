// this will likely be updated to involve the URL
// the project name we store here is the "Safe name" (as opposed to the display name)
//   the safe name is what will appear in the URL and should be in the database under:
//   doc(db, "users", uid, "projectNames", safeName)
// safeName = encodeURIComponent(displayName.replaceAll(" ", "-"))
let curProjectName = null;
let curProjectId = null;
let projOwner = false;

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

export function setProjectName(val) {
    curProjectName = val;
}

export function setProjectId(val) {
    curProjectId = val;
}

export function getOwns() {
    return projOwner;
}

export function setOwns(val) {
    projOwner = !!val; // force to be a boolean with !!
}
