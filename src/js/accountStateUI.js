export function logoutUI() {
    document.getElementById("login").style.display = 'inline-block';
    document.getElementById("createAccount").style.display = 'inline-block';
    document.getElementById("accountProfile").style.display = 'none';

    document.getElementById("accountProfile").textContent = 'Profile';
}

export function setAccountUI(displayName) {
    document.getElementById("login").style.display = 'none';
    document.getElementById("createAccount").style.display = 'none';
    document.getElementById("accountProfile").style.display = 'inline-block';

    document.getElementById("accountProfile").textContent = displayName;
}
