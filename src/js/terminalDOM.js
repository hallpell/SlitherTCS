export function initTerminalDOM() {
    const output = document.getElementById("output");
    const ourInput = document.getElementById("repl-input");
    
    output.generalAdd = (content, newClass=undefined, newLine=false) => {
	const wasFocused = ourInput.contains(document.activeElement);
	if (newLine) {
	    output.newLine();
	}
	
	let newText = document.createElement("span");
	newText.textContent = content;
	if (newClass) {
	    newText.className = newClass;
	}

	const oldHeight = output.lastElementChild.offsetHeight;

	output.lastElementChild.insertBefore(newText, ourInput);
	
	// if adding this changes the height, it's wrapping and should have its own line
	//   this should only happen if newLine == false
	if (output.lastElementChild.offsetHeight !== oldHeight) {
	    output.newLine();
	    output.lastElementChild.insertBefore(newText, ourInput);
	}
	
	// if we don't have sufficient space for the input, make a new line for it
	if (ourInput.offsetWidth < 40) {
	    output.newLine();
	}
	document.getElementById("output").scrollTop = document.getElementById("output").scrollHeight;
	if (wasFocused) {
	    ourInput.focus();
	}
    }

    output.newLine = () => {
	const newDiv = document.createElement("div");
	newDiv.className = 'line';
	output.append(newDiv);
	const p = ourInput.parentElement;
	newDiv.appendChild(ourInput);
	// if we're leaving behind a div with just an empty span
	if (p.children.length == 1 &&
	    p.firstElementChild.tagName == "SPAN" &&
	    p.firstElementChild.childNodes.length == 0) {
	    p.remove();
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

    output.clearTerminal = () => {
	while (output.firstChild !== output.lastChild) {
	    output.removeChild(output.firstChild);
	}
    }
}
