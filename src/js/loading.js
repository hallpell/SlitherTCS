import { setEditor } from "./codeMirrorInit.js";
import { db, auth } from "./firebase.js";
import { setProjectName, setProjectId, setOwns } from "./currentProject.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// called for side effects, no return value
// TODO: continue propagating errors up the chain???
export function loadFromUIDs(userId, projectId) {
    getDoc(doc(db, 'users', userId, 'projects', projectId)).then((snap) => {
	if (snap.exists() && "code" in snap.data()) {
	    setEditor(snap.data().code);
	    setProjectName(snap.data().name);
	    setProjectId(projectId);
	    setOwns(userId == auth.currentUser.uid);

	    // TODO: set URL
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
export function loadFromNames(username, projectName) {
    // simultaneously async lookup userID + projectID
    // call loadFromUIDs
}

// function for decoding URL and call loadFromNames (does this make sense here?)
