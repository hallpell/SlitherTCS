// this worked before Pyodide was in a worker, but needs to be
//    subtantially updated now that Pyodide is in a worker

export function initMatPlotLibAttacher() {
    // if python creates a graphics interface, move it to the graphics tab - this is for matplotlib
    const container = document.getElementById("graphics")
    const observer = new MutationObserver(mutations => {
	for (const m of mutations) {
	    for (const node of m.addedNodes) {
		if (
		    node.nodeType === Node.ELEMENT_NODE &&
			(node.querySelector?.("canvas, svg") ||
			 node.tagName === "CANVAS" ||
			 node.tagName === "SVG")
		) {
		    container.appendChild(node)
		}
	    }
	}
    })
    
    observer.observe(document.body, { childList: true })
}
