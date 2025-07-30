function toggleDarkMode() {
    var bodyElement = document.body;
    bodyElement.classList.toggle('dark-mode');

    if (bodyElement.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
        updateDarkModeButtonText('Modo Claro');
    } else {
        localStorage.setItem('darkMode', 'disabled');
        updateDarkModeButtonText('Modo Oscuro');
    }
}

function updateDarkModeButtonText(text) {
    var buttons = document.querySelectorAll('#dark-mode-toggle');
    var i;
    for (i = 0; i < buttons.length; i++) {
        buttons[i].textContent = text;
    }
}

function loadDarkModePreference() {
    var savedMode = localStorage.getItem('darkMode');
    var bodyElement = document.body;

    if (savedMode === 'enabled') {
        bodyElement.classList.add('dark-mode');
        updateDarkModeButtonText('Modo Claro');
    } else {
        bodyElement.classList.remove('dark-mode');
        updateDarkModeButtonText('Modo Oscuro');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadDarkModePreference();

    var darkModeToggleButtons = document.querySelectorAll('#dark-mode-toggle');
    var i;
    for (i = 0; i < darkModeToggleButtons.length; i++) {
        darkModeToggleButtons[i].addEventListener('click', toggleDarkMode);
    }
});