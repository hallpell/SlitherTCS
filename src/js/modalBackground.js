export function toggleDBGopen() {
    const dialogBackgrounds = document.getElementById('dialogBackgrounds')

    const modals = document.querySelectorAll('.modal');

    let modalOpen = false;
    modals.forEach((el) => {
	if (el.checkVisibility()) {
	    modalOpen = true;
	}
    })
    
    if (modalOpen) {
	dialogBackgrounds.classList.add("open");
    } else {
	dialogBackgrounds.classList.remove("open");
    }
}
