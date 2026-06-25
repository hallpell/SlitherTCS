export function initTerminalDOM() {
    const output = document.getElementById("output");
    const ourInput = document.getElementById("repl-input");
    
    output.generalAdd = (content, newClass=undefined, newLine=false) => {
	let wasFocused = ourInput.contains(document.activeElement);
	if (newLine) {
	    let newDiv = document.createElement("div");
	    newDiv.className = 'line';
	    output.appendChild(newDiv);
	    newDiv.appendChild(ourInput);
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
	output.generalAdd(content, 'userInput')
    }
    
    output.addError = (content) => {
	output.generalAdd(content, 'outputError', true);
    }
    
    output.printPrompt = () => {
	output.addText(">>> ");
    }

    output.flush = () => {
	output.appendText(ourInput.value);
	ourInput.value = '';
    }

    output.printPrompt();
}
