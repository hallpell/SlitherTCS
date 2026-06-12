import { setEditor } from "/src/js/codeMirrorInit.js";
import { db, auth } from "/src/js/firebase.js";
import { setProjectName, setProjectId, setOwns,
         getProjectName, getProjectId } from "/src/js/currentProject.js";
import { makeSafe } from "/src/js/jsUtils.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// WARNING: This will overwrite the current contents of the editor. It should
//   only be called if you have verified that you're okay with that
//   (i.e. current project is clean or (no current project && editorEmpty) or user verification
// called for side effects, no return value
// updateState is a boolean determining if we should update the state of the history
// pushState will pushState if true (default) or replaceState if false
// TODO: continue propagating errors up the chain???
export function loadFromUIDs(userId, projectId, updateState=true, pushState=true) {
    getDoc(doc(db, 'users', userId, 'projects', projectId)).then((snap) => {
	if (snap.exists() && "code" in snap.data()) {
	    setEditor(snap.data().code);
	    setProjectName(snap.data().safeName);
	    setProjectId(projectId);
	    setOwns(userId == auth.currentUser.uid);

	    if (updateState) {
		getDoc(doc(db, 'users', userId)).then((userSnap) => {
		    const newState = {safeUN: userSnap.data().safeName,
				      safeProjectName: snap.data().safeName,
				      projectId: projectId,
				      uid: userId };
		    const newURL = "/" + newState.safeUN + "/" + newState.safeProjectName;
		    if (pushState) {
			history.pushState(newState, "", newURL);
		    } else {
			history.replaceState(newState, "", newURL);
		    }
		})
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
export async function loadFromNames(username, safeProjectName) {
    let unSnap = await getDoc(doc(db, "usernames", username));
    if (unSnap.exists()) {
	let uid = unSnap.data().uid;
	let projSnap = await getDoc(doc(db, "users", uid,
					"projectNames", safeProjectName));
	if (projSnap.exists()) {
	    loadFromUIDs(uid, projSnap.data().projectId, true, false);
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
	loadFromNames(parts[0], parts[1]).then((foundProject) => {
	    // if we can't load it, give an error
	    if (!foundProject) {
		const dialog = document.getElementById('generic-error-dialog');
		const textDiv = document.getElementById('generic-error-text');
		textDiv.textContent = "Couldn\'t find project '" + parts[1] +
		    "' from user '" + parts[0] + "'";
		// if we fail to load, empty the project portion of the URL
		//   (if the user mis-typed, their previous attempt can be accessed/edited with
		//    the back button, which won't re-try to load immediately)
		history.pushState({}, "", "/");
		dialog.showPopover();
	    }
	});
    }
}

export async function initLoad() {
    await auth.authStateReady();

    loadFromURL();

    window.addEventListener("popstate", async (event) => {
	if (Object.hasOwn(event.state, "safeUN") &&
	    Object.hasOwn(event.state, "safeProjectName") &&
	    Object.hasOwn(event.state, "projectId") &&
	    Object.hasOwn(event.state, "uid")) {
	    // load proper project, don't mess with history
	    loadFromUIDs(event.state.uid, event.state.projectId, false, false);
	} else {
	    loadFromURL();
	}
    })
}

/*    const newState = {safeUN: userSnap.data().safeName,
		      safeProjectName: snap.data().safeName,
		      projectId: projectId,
		      uid: userId };*/
