import { auth } from "/src/js/firebase.js";
import { loadFromUIDs } from "/src/js/loading.js";

// returns an array of objects.
//   Length of array will equal number of projects in colSnap
//   Each object will have 'time', 'name', and 'id'
//   The array will be sorted by the 'time' attributes of the elements
export function buildTemporallySortedProjects(colSnap) {
    let tsps = [];
    colSnap.forEach((d) => {
	const data = d.data();
	let val = {
	    time: data.updatedAt,
	    name: data.displayName,
	    id: data.projectId
	}
	
	// insertion sort
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
export function insertProjects(projs) {
    const frag = document.createDocumentFragment();
    
    projs.forEach((p) => {
	const li = document.createElement('li');
	const span = document.createElement('span');
	span.textContent = p.name;

	li.classList.add('userProject');

	// prepend to reverse order
	frag.prepend(li);
	li.appendChild(span);
	li.addEventListener("click", () => {
	    loadFromUIDs(auth.currentUser.uid, p.id);
	})
    })

    const profileList = document.getElementById("profileList");
    profileList.insertBefore(frag, document.getElementById("signOut"));
}

// this is only for when a user saves a new project, so it must always be the currentUser
export function insertProject(displayName, projId) {
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
