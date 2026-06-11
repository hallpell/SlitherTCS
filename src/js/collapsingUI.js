import { worker } from "/src/js/workerClient.js";
// code for initializing and adjusting the layout of the screen
function collapseEl(toCollapse, toExpand, newDisplayVal) {
    toCollapse.style.display = "none";
    toExpand.style.display = newDisplayVal;
}

export function initCollapsingUI() {

    let collapsedCode = document.getElementById("collapsedCode");
    collapsedCode.style.display = 'none';
    let code = document.getElementById("code");
    collapsedCode.addEventListener("click", () => {
	collapseEl(collapsedCode, code, 'block');
    })
    document.getElementById("codeMinimize").addEventListener("click", () => {
	collapseEl(code, collapsedCode, 'flex');
    })
    
    let collapsedTerminal = document.getElementById("collapsedTerminal");
    collapsedTerminal.style.display = 'none';
    let terminal = document.getElementById("terminal");
    collapsedTerminal.addEventListener("click", () => {
	collapseEl(collapsedTerminal, terminal, 'block');
    })
    document.getElementById("terminalMinimize").addEventListener("click", () => {
	collapseEl(terminal, collapsedTerminal, 'flex');
    })
    
    let collapsedGrapics = document.getElementById("collapsedGraphics");
    let graphics = document.getElementById("graphicsContainer");
    graphics.style.display = 'none';
    collapsedGraphics.addEventListener("click", () => {
	collapseEl(collapsedGraphics, graphics, 'block');
	// this whole computation (as opposed to just clientWidth/clientHeight) is necessary
	//   because clientWidth will round up, which adds scrollbars and breaks the layout
	worker.postMessage({ type: "graphics_dims",
	  width: Math.floor(document.getElementById("graphics").getBoundingClientRect().width), 
	  height: Math.floor(document.getElementById("graphics").getBoundingClientRect().height) });
    })
    
    document.getElementById("graphicsMinimize").addEventListener("click", () => {
	collapseEl(graphics, collapsedGraphics, 'flex');
    })
    
}
