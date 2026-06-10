import { getEditor } from "./codeMirrorInit.js";
import { db, auth } from "./firebase.js";
import { toggleDBGopen } from "./modalBackground.js";
import { getProjectName, setProjectName, getProjectId,
	 setProjectId, getOwns, setOwns } from "./currentProject.js";
import { isInvalidDocumentName } from "./firebaseHelpers.js";
import { errorShake } from "./DOMhelpers.js";

import { doc, collection, addDoc, setDoc, getDoc, runTransaction, serverTimestamp }
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";


// return an object with:
//   status: boolean (succeeded at creating project or not)
//     if status: true, then contains projectID: string
//     if status: false, errorMessage: string
async function createNewProject(uid, projectName, safeProjectName, code) {
    if (isInvalidDocumentName(safeProjectName)) {
	return { status: false,
		 errorMessage: "Invalid project name: " + isInvalidDocumentName(safeProjectName) };
    }
    const nameRef = doc(db, "users", uid, "projectNames", safeProjectName);
    const projRef = doc(collection(db, "users", uid, "projects"));

    try {
	await runTransaction(db, async (transaction) => {
	    const nameSnap = await transaction.get(nameRef);

	    if (nameSnap.exists()) {
		throw new Error("Project name already exists");
	    }

	    transaction.set(projRef, {
		code: code,
		displayName: projectName,
		safeName: safeProjectName,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
		ownerId: uid,
		isPublic: true
	    });

	    transaction.set(nameRef, {
		projectId: projRef.id,
		displayName: projectName,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp()
	    });
	})
	return { status: true, projectId: projRef.id };
    } catch (error) {
	// maybe we don't need to console log this since we return it?
	console.error(error);

	return { status: false, errorMessage: error.message };
    }
}

// this will let any errors populate up, so must be handled
function updateProject(uid, projId, projName, code) {
    setDoc(doc(db, "users", uid, "projects", projId), {
	code: code,
	updatedAt: serverTimestamp()
    }, { merge: true })

    setDoc(doc(db, "users", uid, "projectNames", projName), {
	updatedAt: serverTimestamp()
    }, { merge: true })
}

export function initSaveUI() {
    document.getElementById("project-naming-dialog").addEventListener("toggle", toggleDBGopen);
    
    async function save() {
	// TODO: return if project is not dirty
	const user = auth.currentUser;
	
	if (!user) {
	    alert("Please log in before saving your project");
	    // TODO: Make this less terrible
	    return
	}

	const code = getEditor().getValue();

	// get projectID of current project
	const projId = getProjectId();
	const curProjName = getProjectName();
	// getOwns() in case we are reading someone else's project -
	//   we'd then want to save a new project in the user's name
	if (projId && curProjName && getOwns()) {
	    try {
		updateProject(user.uid, projId, curProjName, code);
	    } catch (error) {
		console.log("Error when saving/overwriting existing project");
		console.error(error);
	    }
	    return; // we've saved an existing project, exit
	}

	// we have a new project for this user, ask them to submit a name

	const namingDialog = document.getElementById("project-naming-dialog");
	const namingForm = document.getElementById("project-naming-form");
	
	// open dialog
	// attach callback to submit (wait for verification that it worked, then close)
	// attach callback to close (clean up callbacks)

	async function saveSubmitHandler(event) {
	    event.preventDefault();

	    let formData = new FormData(namingForm);

	    let projectName = formData.get("project_name");
	    let safeProjectName = encodeURIComponent(projectName.replaceAll(" ", "-"));

	    try {
		const retVal = await createNewProject(user.uid, projectName, safeProjectName, code);

		// if saved successfully
		if (retVal.status) {
		    setProjectName(projectName);
		    setProjectId(retVal.projectId);
		    setOwns(true);
		    // TODO: URL stuff
		    //const newURL = "BASE/" + encodeURIComponent(usernameLookup(user.uid)) + "/" +
		    //        docRef.id + "/" + encodeURIComponent(project_name)
		    //  history.pushState(newURL);

		    // TODO: Add new project to profile list
		    
		    namingDialog.hidePopover();
		} else {
		    const valEl = document.getElementById("project-name-validation");
		    if (retVal.errorMessage.startsWith("Invalid project name")) {
			valEl.textContent = "Invalid Project Name";
			errorShake(valEl);
		    } else if (retVal.errorMessage.startsWith("Project name already exists")) {
			valEl.textContent = "You already have a project with that name!";
			errorShake(valEl);
		    } else {
			valEl.textContent = "There was an issue saving your project";
			errorShake(valEl);
		    }
		}
	    } catch (e) {
		alert("We shouldn't have gotten here!" + e);
	    }
	}

	function saveDialogToggleHandler(event) {
	    if (event.newState == 'closed') {
		namingDialog.removeEventListener('toggle', saveDialogToggleHandler);
		namingForm.removeEventListener('submit', saveSubmitHandler);
	    }
	}

	namingDialog.addEventListener('toggle', saveDialogToggleHandler);
	namingForm.addEventListener('submit', saveSubmitHandler);

	namingForm.reset();

	// if there is an existing project name, we are "remixing" a project, so we
	//   autopopulate the name but let them edit it
	if (curProjName) {
	    document.getElementById('project-name-input').value = curProjName;
	}
	
	namingDialog.showPopover();
    }
    
    document.getElementById('save').addEventListener("click", save);
}
