export function errorShake(el) {
    el.classList.remove("error-shake");

    el.classList.add("error-shake");
    setTimeout(() => { el.classList.remove("error-shake") }, 500);
}

