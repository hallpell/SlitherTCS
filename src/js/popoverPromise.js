export function openPopoverAsync(popEl) {
    return new Promise((resolve, reject) => {
	
	const form = popEl.querySelector("form");
	if (!form) {
	    reject(new Error("No form!"));
	    return;
	}
	
	let isSubmitted = false;
	let formDataResult = null;
	
	const handleSubmit = (event) => {
	    event.preventDefault();
	    
	    isSubmitted = true;
	    formDataResult = new FormData(form);
	    
	    popEl.hidePopover();
	}
	
	const handleToggle = (event) => {
	    if (event.newState === 'closed') {
		popEl.removeEventListener('toggle', handleToggle);
		form.removeEventListener('submit', handleSubmit);
		
		if (isSubmitted) {
		    resolve(formDataResult);
		} else {
		    reject(new Error("Form not submitted"));
		}
	    }
	}
	
	popEl.addEventListener("toggle", handleToggle);
	form.addEventListener("submit", handleSubmit);
	
	form.reset();
	popEl.showPopover();
    })
}
