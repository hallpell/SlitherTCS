export function initTerminalDOM() {
    const output = document.getElementById("output");
    const ourInput = document.getElementById("repl-input");
    
    output.generalAdd = (content, newClass=undefined, newLine=false) => {
	const wasFocused = ourInput.contains(document.activeElement);
	if (newLine) {
	    const newDiv = document.createElement("div");
	    newDiv.className = 'line';
	    output.appendChild(newDiv);
	    const p = ourInput.parentElement;
	    newDiv.appendChild(ourInput);
	    // if we're leaving behind a div with just an empty span
	    if (p.children.length == 1 &&
		p.firstElementChild.tagName == "SPAN" &&
		p.firstElementChild.childNodes.length == 0) {
		p.remove();
	    }
	}
	
	let newText = document.createElement("span");
	newText.textContent = content;
	if (newClass) {
	    newText.className = newClass;
	}
	
	output.lastElementChild.insertBefore(newText, ourInput);
	document.getElementById("terminal").scrollTop = document.getElementById("terminal").scrollHeight;
	if (wasFocused) {
	    ourInput.focus();
	}
    }
    
    output.addText = (content) => {
	output.generalAdd(content, undefined, true);
    }
    
    output.appendText = (content) => {
	output.generalAdd(content)
    }
    
    output.appendInput = (content) => {
	output.generalAdd(content, 'user-input')
    }
    
    output.addError = (content) => {
	output.generalAdd(content, 'output-error', true);
    }
    
    output.printPrompt = () => {
	output.generalAdd(">>> ", 'terminal-prompt', true);
    }

    output.printIncomplete = () => {
	output.generalAdd("... ", 'terminal-prompt', true);
    }

    output.flush = () => {
	output.appendText(ourInput.value);
	ourInput.value = '';
    }

    output.printPrompt();
}
