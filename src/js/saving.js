import { doc, collection, addDoc, setDoc, getDoc, runTransaction, serverTimestamp }
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getEditor } from "./codeMirrorInit.js";
import { db, auth } from "./firebase.js";
import { toggleDBGopen } from "./modalBackground.js";
import { openPopoverAsync } from "./popoverPromise.js";
import { getProjectName, setProjectName, getProjectId,
	 setProjectId, getOwns, setOwns } from "./currentProject.js";
import { isInvalidDocumentName } from "./firebaseHelpers.js";

// return an object with:
//   status: boolean (succeeded at creating project or not)
//     if status: true, then contains projectID: string
//     if status: false, errorMessage: string
async function createNewProject(uid, projectName, code) {
    if (isInvalidDocumentName(projectName)) {
	return { status: false,
		 errorMessage: "Invalid project name: " + isInvalidDocumentName(projectName) };
    }
    const nameRef = doc(db, "users", uid, "projectNames", projectName);
    const projRef = doc(collection(db, "users", uid, "projects"));

    try {
	await runTransaction(db, async (transaction) => {
	    const nameSnap = await transaction.get(nameRef);

	    if (nameSnap.exists()) {
		throw new Error("Project name already exists");
	    }

	    transaction.set(projRef, {
		code: code,
		name: projectName,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
		ownerId: uid,
		isPublic: true
	    });

	    transaction.set(nameRef, {
		projectId: projRef.id,
		createdAt: serverTimestamp()
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
function updateProject(uid, projId, code) {
    setDoc(doc(db, "users", uid, "projects", projId), {
	code: code,
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

	// TODO handle re-saving an existing project
	// get projectID of current project
	const projId = getProjectId();
	// getOwns() in case we are reading someone else's project -
	//   we'd then want to save a new project in the user's name
	if (projId && getOwns()) {
	    try {
		updateProject(user.uid, projId, code);
	    } catch (error) {
		console.log("Error when saving/overwriting existing project");
		console.error(error);
	    }
	    return; // we've saved an existing project, exit
	}

	// we have a new project for this user, ask them to submit a name

	// if there is an existing project name, we are "remixing" a project, so we
	//   autopopulate the name but let them edit it
	const oldProjName = getProjectName();
	if (oldProjName) {
	    document.getElementById('project-name-input').value = oldProjName;
	}
	const namingDialog = document.getElementById("project-naming-dialog");

	let project_name;
	try {
	    const formResult = await openPopoverAsync(namingDialog);
	    project_name = formResult.get("project_name");

	    const retVal = await createNewProject(user.uid, project_name, code);

	    console.log(retVal);
	    
	    if (retVal.status) {
		setProjectName(project_name);
		setProjectId(retVal.projectId);
		setOwns(true);
		// TODO: URL stuff
		/*const newURL = "BASE/" + encodeURIcomponent(usernameLookup(user.uid)) + "/" +
		        docRef.id + "/" + encodeURIcomponent(project_name)
		  history.pushState(newURL);*/

	    } else {
		// TODO: fix alert
		console.log("Function gave false status");
		alert(retVal.errorMessage);
		return; // this prevents us from closing the saving dialog - probably correct?
	    }
	} catch (error) {
	    if (error.errorMessage === "Form not submitted") {
		// pass, this is fine
	    } else {
		console.log("Error while making new project??")
		alert(error);
	    }
	}
    }
    
    document.getElementById('save').addEventListener("click", save);
}
