export function toggleDBGopen() {
    const dialogBackgrounds = document.getElementById('dialogBackgrounds')

    if (dialogBackgrounds.classList.contains("open")) {
	dialogBackgrounds.classList.remove("open");
    } else {
	dialogBackgrounds.classList.add("open");
    }
}
