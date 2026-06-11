import { setEditor } from "/src/js/codeMirrorInit.js";
import { db, auth } from "/src/js/firebase.js";
import { setProjectName, setProjectId, setOwns } from "/src/js/currentProject.js";
import { makeSafe } from "/src/js/jsUtils.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// called for side effects, no return value
// TODO: continue propagating errors up the chain???
export function loadFromUIDs(userId, projectId) {
    getDoc(doc(db, 'users', userId, 'projects', projectId)).then((snap) => {
	if (snap.exists() && "code" in snap.data()) {
	    setEditor(snap.data().code);
	    setProjectName(snap.data().safeName);
	    setProjectId(projectId);
	    setOwns(userId == auth.currentUser.uid);

	    getDoc(doc(db, 'users', userId)).then((userSnap) => {
		const newURL = "/" + makeSafe(userSnap.data().safeName) + "/" + snap.data().safeName;
		history.pushState({}, "", newURL);
	    })
	    
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
	    loadFromUIDs(uid, projSnap.data().projectId);
	    return true;
	}
    }
    return false;
}

