import { doc, collection, addDoc, setDoc }
from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import { getEditor } from "./codeMirrorInit.js";
import { db, auth } from "./firebase.js";
import { toggleDBGopen } from "./modalBackground.js";
import { openPopoverAsync } from "./popoverPromise.js";

export function initSaveUI() {
    document.getElementById("project-naming-dialog").addEventListener("toggle", toggleDBGopen);
    
    async function save() {
	const user = auth.currentUser;
	
	if (!user) {
	    alert("Please log in before saving your project");
	    // TODO: Make this less terrible
	    return
	}

	const code = getEditor().getValue();

	// TODO handle re-saving an existing project
	
	const namingDialog = document.getElementById("project-naming-dialog");

	let project_name;
	try {
	    const formResult = await openPopoverAsync(namingDialog);
	    project_name = formResult.get("project_name");

	    const projRef = collection(db, "users", user.uid, "projects");
	    const doc2write = {
		code: code,
		name: project_name,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		ownerId: user.uid,
		isPublic: true
	    };
	    const docRef = await addDoc(projRef, doc2write);

	    console.log(docRef.id);
	    console.log(docRef);
	    // TODO: Update URL, functions need to be implemented
	    /*const newURL = "BASE/" + encodeURIcomponent(usernameLookup(user.uid)) + "/" +
		  docRef.id + "/" + encodeURIcomponent(project_name)
	    history.pushState(newURL);*/
	} catch (error) {
	    alert(error);
	}
    }
    
    document.getElementById('save').addEventListener("click", save);
}
