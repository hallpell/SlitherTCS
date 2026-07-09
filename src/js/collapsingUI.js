import { worker } from "/src/js/workerClient.js";
// code for initializing and adjusting the layout of the screen
function collapseEl(toCollapse, toExpand, newDisplayVal) {
    toCollapse.style.display = "none";
    toExpand.style.display = newDisplayVal;
}

export function initCollapsingUI() {

    function sendGraphicsData() {
	// this whole computation (as opposed to just clientWidth/clientHeight) is necessary
	//   because clientWidth will round up, which adds scrollbars and breaks the layout
	worker.postMessage({ type: "graphics_dims",
			     width: Math.floor(document.getElementById("graphics").getBoundingClientRect().width), 
			     height: Math.floor(document.getElementById("graphics").getBoundingClientRect().height) });
    }

    sendGraphicsData(); // once for initialization
    
    let collapsedCode = document.getElementById("collapsedCode");
    collapsedCode.style.display = 'none';
    let code = document.getElementById("code");
    collapsedCode.addEventListener("click", () => {
	collapseEl(collapsedCode, code, 'block');
	sendGraphicsData();
    })
    document.getElementById("codeMinimize").addEventListener("click", () => {
	collapseEl(code, collapsedCode, 'flex');
	sendGraphicsData();
    })
    
    let collapsedTerminal = document.getElementById("collapsedTerminal");
    collapsedTerminal.style.display = 'none';
    let terminal = document.getElementById("terminal");
    collapsedTerminal.addEventListener("click", () => {
	collapseEl(collapsedTerminal, terminal, 'block');
	sendGraphicsData();
    })
    document.getElementById("terminalMinimize").addEventListener("click", () => {
	collapseEl(terminal, collapsedTerminal, 'flex');
	sendGraphicsData();
    })
    
    let collapsedGrapics = document.getElementById("collapsedGraphics");
    let graphics = document.getElementById("graphicsContainer");
    graphics.style.display = 'none';
    collapsedGraphics.addEventListener("click", () => {
	collapseEl(collapsedGraphics, graphics, 'block');
	sendGraphicsData();
    })
    
    document.getElementById("graphicsMinimize").addEventListener("click", () => {
	collapseEl(graphics, collapsedGraphics, 'flex');
	// no sendGraphicsData() because graphics is minimized so don't need to send width: 0
    })

    window.addEventListener("resize", sendGraphicsData);
    
}
