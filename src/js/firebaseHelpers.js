import { db } from "/src/js/firebase.js";
import { addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// implementing document ID constraints from https://firebase.google.com/docs/firestore/quotas
// returns a string with a reason if invalid, false if no problems detected
export function isInvalidDocumentName(docName) {
    if (!docName || typeof docName !== 'string') return "Must be string";
  
    const byteLength = new TextEncoder().encode(docName).length;
    if (byteLength > 1500) return "Too long";
    
    if (docName.includes('/')) return "Cannot include '/'";
    if (docName === '.' || docName === '..') return "Cannot be '.' or '..'";
    if (docName.startsWith('__') && docName.endsWith('__')) return "Cannot start and end with '__'";
    
    return false;
}

export async function logErrors(context, message) {
    addDoc(collection(db, "clientErrors"), {
	time: serverTimestamp(),
	context: context.substring(0,500),
	errorMessage: message.substring(0,5000)
    }).catch(error => {
	console.log(error);
    })
}
