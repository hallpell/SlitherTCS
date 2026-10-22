import { getWorker } from "/src/js/workerClient.js";
import { setEditor } from "/src/js/codeMirror.js";
import { db, auth } from "/src/js/firebase.js";
import { logErrors } from "/src/js/firebaseHelpers.js";
import { setProjectName, setProjectId, setOwns, setOwnerId,
         getProjectName, getProjectId, getOwnerId, makeClean } from "/src/js/currentProject.js";
import { makeSafe } from "/src/js/jsUtils.js";
import { genericError } from "/src/js/DOMhelpers.js";
import { getTerminalFresh } from "/src/js/runningStatus.js";
import { setVersion, setMaxVersion } from "/src/js/versionUI.js";

import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// WARNING: This will overwrite the current contents of the editor. It should
//   only be called if you have verified that you're okay with that
//   (i.e. current project is clean or (no current project && editorEmpty) or user verification)
// called for side effects, no return value
// updateState is a boolean determining if we should update the state of the history
// pushState will pushState if true (default) or replaceState if false
// versionNum will specify a version number to load. If omitted, the most recent version will be loaded
// TODO: continue propagating errors up the chain???
export function loadFromUIDs(userId, projectId, versionNum, updateState=true, pushState=true, safeUN) {
    getDoc(doc(db, 'users', userId, 'projects', projectId)).then(async (snap) => {
	if (snap.exists() && "code" in snap.data()) {
	    let code;
	    let usingVersion = false;
	    // if we don't have version info, just load the code in the main project
	    if (versionNum === undefined || !Object.hasOwn(snap.data(), "currentVersion")) {
		code = snap.data().code;
		// if version number doesn't refer to a valid past version, just give up and load normal code
	    } else if (versionNum < -snap.data().currentVersion ||
		       versionNum >= snap.data().currentVersion ||
		       versionNum == 0) {
		code = snap.data().code;
	    } else {
		// if we have a negative version number
		if (versionNum < 0) {
		    versionNum = snap.data().currentVersion + versionNum
		}
		// using await here because using .then makes it hard to avoid duplicating code
		let versionSnap = await getDoc(doc(db, 'users', userId,
						   'projects', projectId,
						   'versions', String(versionNum)));
		if (versionSnap.exists() && "code" in versionSnap.data()) {
		    code = versionSnap.data().code;
		    usingVersion = true;
		} else { // can't find the version for some reason, just give up and load normal code
		    code = snap.data().code;
		}
	    }
	    setEditor(code);
	    setProjectName(snap.data().safeName);
	    setProjectId(projectId);
	    const isOwner = auth.currentUser && userId == auth.currentUser.uid;
	    setOwns(isOwner);
	    setOwnerId(userId);
	    if (usingVersion) {
		setVersion(versionNum);
		setMaxVersion(snap.data().currentVersion);
	    } else if (!Object.hasOwn(snap.data(), 'currentVersion')) {
		setVersion(1);
		setMaxVersion(1);
		versionNum = 1;
	    } else {
		setVersion(snap.data().currentVersion);
		setMaxVersion(snap.data().currentVersion);
		versionNum = snap.data().currentVersion;
	    }
	    makeClean();

	    if (!getTerminalFresh()) {
		document.getElementById("output").addError("Loading project, resetting environment");
		getWorker().postMessage({ type: "refresh", python: undefined });
		document.getElementById("output").printPrompt();
	    }
	    
	    if (updateState) {
		const newState = {
		    safeProjectName: snap.data().safeName,
		    projectId: projectId,
		    uid: userId,
		    version: versionNum
		};
		let newURL = "/";
		if (safeUN !== undefined) {
		    newState.safeUN = safeUN;
		    newURL = "/" + safeUN + "/" + newState.safeProjectName;

		    if (usingVersion) {
			newURL += "/" + versionNum;
		    }

		    if (pushState) {
			history.pushState(newState, "", newURL);
		    } else {
			history.replaceState(newState, "", newURL);
		    }
		} else if (isOwner) {
		    getDoc(doc(db, 'users', userId)).then((userSnap) => {
			newState.safeUN = userSnap.data().safeName;
			newURL = "/" + newState.safeUN + "/" + newState.safeProjectName;

			if (usingVersion) {
			    newURL += "/" + versionNum;
			}
			
			if (pushState) {
			    history.pushState(newState, "", newURL);
			} else {
			    history.replaceState(newState, "", newURL);
			}
		    }).catch(error => {
			console.error(error);
		    });
		} else {
		    // Fallback to less complete state (don't know the UN so can't build the URL
		    //   this shouldn't happen, but is somewhat recoverable)
		    logErrors("Unresolvable username in loading",
			      JSON.stringify({userId, projectId, updateState, pushState, safeUN}));
		    if (pushState) {
			history.pushState(newState, "", newURL);
		    } else {
			history.replaceState(newState, "", newURL);
		    }
		}
	    }

	    // TODO: consider moving this hidePopover to another file
	    document.getElementById("profileDropdown").hidePopover();
	} else {
	    console.error("Couldn't find project " + projectId);
	}
    }).catch((error) => {
	console.log("Error loading project with id: ", projectId);
	console.error(error);
    })
}

// allow loading projects if you just know username + projectname
// returns true if it successfully found UID and projectID and dispatched,
//   false if the project could not be found
// versionNum is passed on to loadFromUIDs and handled there - no special handling here needed
export async function loadFromNames(username, safeProjectName, versionNum) {
    let unSnap = await getDoc(doc(db, "usernames", username));
    if (unSnap.exists()) {
	let uid = unSnap.data().uid;
	let projSnap = await getDoc(doc(db, "users", uid,
					"projectNames", safeProjectName));
	if (projSnap.exists()) {
	    loadFromUIDs(uid, projSnap.data().projectId, versionNum, true, false, username);
	    return true;
	}
    }
    return false;
}

export async function loadFromURL() {
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);

    // if this looks like a username + projectName
    if (parts.length == 2) {
	// try to load it
	const foundProject = await loadFromNames(parts[0], parts[1]);
	// if we can't load it, give an error
	if (!foundProject) {
	    genericError("Couldn\'t find project '" + parts[1] +
			 "' from user '" + parts[0] + "'");
	    // if we fail to load, empty the project portion of the URL
	    //   (if the user mis-typed, their previous attempt can be accessed/edited with
	    //    the back button, which won't re-try to load immediately)
	    history.pushState({}, "", "/");
	    return false;
	}
	return true;
    } else if (parts.length == 3 && Number.isInteger(parseFloat(parts[2]))) {
	// same thing, but with the version number
	const foundProject = await loadFromNames(parts[0], parts[1], parts[2]);
	if (!foundProject) {
	    genericError("Couldn\'t find project '" + parts[1] +
			 "' from user '" + parts[0] + "'");
	    history.pushState({}, "", "/");
	    return false;
	}
    }
    return false;
}

export async function loadVersion(versionNum) {
    loadFromUIDs(getOwnerId(), getProjectId(), versionNum, false, false, undefined);
}

export async function initLoad() {
    await auth.authStateReady();

    loadFromURL();
    makeClean();

    window.addEventListener("popstate", async (event) => {
	// this doesn't need to check for safeUN in case we're in a weird state
	if (Object.hasOwn(event.state, "safeProjectName") &&
	    Object.hasOwn(event.state, "projectId") &&
	    Object.hasOwn(event.state, "uid")) {
	    // load project, don't mess with history
	    loadFromUIDs(event.state.uid, event.state.projectId, false, false);
	} else {
	    loadFromURL();
	}
    })
}
