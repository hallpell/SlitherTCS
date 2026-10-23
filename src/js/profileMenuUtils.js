import { auth } from "/src/js/firebase.js";
import { loadFromUIDs } from "/src/js/loading.js";
import { confirmDialog } from "/src/js/DOMhelpers.js";
import { isDirty } from "/src/js/currentProject.js";

// returns an array of objects.
//   Length of array will equal number of projects in colSnap
//   Each object will have 'time', 'name', and 'id'
//   The array will be sorted by the 'time' attributes of the elements
export function buildTemporallySortedProjects(colSnap, numToReturn) {
    let tsps = [];
    colSnap.forEach((d) => {
	const data = d.data();
	let val = {
	    time: data.updatedAt,
	    name: data.displayName,
	    id: data.projectId
	}

	// all new projects should have this field
	if (data.currentVersion) {
	    val.version = data.currentVersion
	} else {
	    // have a custom value for older projects without this field
	    // (some projects have version but don't have that information in projectNames,
	    //    so we need a special value as opposed to defaulting to 1)
	    val.version = -1
	}
	
	// insertion sort each element as generated
	let i = 0;
	while (i < tsps.length && tsps[i].time < val.time) {
	    i++;
	}
	tsps.splice(i, 0, val);
    })
    return tsps;
}

// takes the output of buildTemporallySortedProjects and
//   inserts them into the DOM in profileList
export function insertProjectsProfile(projs) {
    const frag = document.createDocumentFragment();

    const hr = document.createElement("hr");
    hr.classList.add('userProject');
    
    frag.append(hr);
    
    projs.forEach((p) => {
	const li = document.createElement('li');
	const span = document.createElement('span');
	span.textContent = p.name;

	li.classList.add('userProject');

	// prepend to reverse order
	frag.prepend(li);
	li.appendChild(span);
	li.addEventListener("click", async () => {
	    if (isDirty()) {
		const conf = await confirmDialog("Your current project has unsaved changes, do you really want to load another project?");
		if (!conf) {
		    return;
		}
	    }
	    loadFromUIDs(auth.currentUser.uid, p.id);
	})
    })

    const profileList = document.getElementById("profileList");
    profileList.insertBefore(frag, document.getElementById("signOut"));
}

// this is only for when a user saves a new project, so it must always be the currentUser
export function insertProjectProfile(displayName, projId) {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = displayName;

    li.classList.add('userProject');
    li.appendChild(span);
    li.addEventListener("click", () => {
	loadFromUIDs(auth.currentUser.uid, projId);
    })

    document.getElementById("newProject").after(li);
}

export function insertProjectsModal(projs) {
    const frag = document.createDocumentFragment();

    projs.forEach((p) => {
	const li = document.createElement('li');
	li.dataset.time = p.time.toMillis();
	li.dataset.name = p.name;
	const div = document.createElement('div');
	const span = document.createElement('span');
	span.textContent = p.name;
	const button = document.createElement('button');
	button.textContent = 'Open ';
	div.appendChild(span);
	div.appendChild(button);
	const input = document.createElement('input');
	if (p.version > 0) {
	    button.appendChild(input);
	    input.type = 'number';
	    input.min = 1;
	    input.max = p.version;
	    input.value = p.version;
	}

	li.classList.add('userProject');

	// prepend to reverse order
	frag.prepend(li);
	li.appendChild(div);
	li.addEventListener("click", async (e) => {
	    if (e.target === input) { return };
	    if (isDirty()) {
		const conf = await confirmDialog("Your current project has unsaved changes, do you really want to load another project?");
		if (!conf) {
		    return;
		}
	    }
	    document.getElementById("all-project-dialog").hidePopover();
	    if (p.version > 0) {
		loadFromUIDs(auth.currentUser.uid, p.id, input.value);
	    } else {
		loadFromUIDs(auth.currentUser.uid, p.id);
	    }
	})
    })

    const profileList = document.getElementById("all-project-ul");
    profileList.appendChild(frag);
}
