import { getEditor } from "/src/js/codeMirror.js";
import { db, auth } from "/src/js/firebase.js";
import { toggleDBGopen } from "/src/js/modalBackground.js";
import { getProjectName, setProjectName, getProjectId,
	 setProjectId, getOwns, setOwns,
	 makeClean, makeDirty, isDirty } from "/src/js/currentProject.js";
import { isInvalidDocumentName } from "/src/js/firebaseHelpers.js";
import { errorShake } from "/src/js/DOMhelpers.js";
import { makeSafe, debounce } from "/src/js/jsUtils.js";
import { getAutosave, toggleAutosave } from "/src/js/autosaveState.js";

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

async function nameAndSave() {
    const namingDialog = document.getElementById("project-naming-dialog");
    const namingForm = document.getElementById("project-naming-form");
    
    // open dialog
    // attach callback to submit (wait for verification that it worked, then close)
    // attach callback to close (clean up callbacks)
    
    async function saveSubmitHandler(event) {
	event.preventDefault();
	
	let formData = new FormData(namingForm);

	let projectName = formData.get("project_name");
	let safeProjectName = makeSafe(projectName);
	
	try {
	    const retVal = await createNewProject(user.uid, projectName, safeProjectName, code);
	    
	    // if saved successfully
	    if (retVal.status) {
		setProjectName(safeProjectName);
		setProjectId(retVal.projectId);
		setOwns(true);
		makeClean();
		
		const userSnap = await getDoc(doc(db, "users", user.uid));
		if (!userSnap.exists()) {
		    logErrors("User doesn't have a profile: '" + user.uid + "'",
			      "From saving new project");
		}
		const newURL = "/" + userSnap.data().safeName + "/" + safeProjectName;
		history.pushState({safeUN: userSnap.data().safeName,
				   safeProjectName: safeProjectName,
				   projectId: retVal.projectId,
				   uid: user.uid }, "", newURL);
		
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
		    logErrors("Couldn't save new project: '" + projectName +
			      "' with user: '" + user.uid + "'",
			      retVal.errorMessage);
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

    const curProjName = getProjectName();
    // if there is an existing project name, we are "remixing" a project, so we
    //   autopopulate the name but let them edit it
    if (curProjName) {
	document.getElementById('project-name-input').value = curProjName;
    }
    
    namingDialog.showPopover();
} // nameAndSave

async function save() {
    // if no changes since last save, don't do anything
    if (!isDirty) { return };
    
    const user = auth.currentUser;
    
    if (!user) {
	const dialog = document.getElementById('generic-error-dialog');
	const textDiv = document.getElementById('generic-error-text');
	textDiv.textContent = "Please log in before saving your project";
	dialog.showPopover();
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
	    makeClean();
	} catch (error) {
	    console.log("Error when saving/overwriting existing project");
	    console.error(error);
	}
	return; // we've saved an existing project, exit
    }
    
    // we have a new project for this user, ask them to submit a name
    return nameAndSave();
} // save

// this takes the editor just because it is convenient, it could easily be adjusted to getEditor itself
async function autosaveInit(editor) {
    let unsavedChanges = 0;

    // after changing the editor and letting it rest for 3 seconds, count up
    // once we've gotten 10 unsaved changes, request a save
    editor.on("change", debounce(() => {
	unsavedChanges++;
	console.log(unsavedChanges);
	if (unsavedChanges >= 3) {
	    if (getAutosave()) {
		save();
	    }
	    unsavedChanges = 0;
	}
    }, 3000))
    
    // TODO: end of class autosaving?
}

export function initSaveUI() {
    document.getElementById("project-naming-dialog").addEventListener("toggle", toggleDBGopen);

    const editor = getEditor();

    editor.on("change", makeDirty);
    editor.addKeyMap({
	"Ctrl-S": save,
	"Cmd-S": save
    })
    
    document.getElementById('save').addEventListener("click", save);

    const autosaveEl = document.getElementById('autosave');
    autosaveEl.addEventListener("click", () => {
	toggleAutosave();
	if (auth.currentUser) {
	    setDoc(doc(db, "users", auth.currentUser.uid), {
		autosave: getAutosave()
	    }, { merge: true }).catch(error => {
		console.error("Error writing to autosave: ", error);
	    })
	}
    });

    autosaveInit(editor);
}
