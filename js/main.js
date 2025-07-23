'use strict'; // Modo estricto de ES5

// Variables globales declaradas al principio del archivo
var boardSize = 8;
var numMines = 10;
var board = [];
var gameStarted = false;
var gameOver = false;
var timerInterval;
var seconds = 0;
var playerName = '';
var revealedCellsCount = 0; // Contador de celdas no minadas reveladas
var currentDifficulty = 'easy'; // Dificultad actual del juego

// Referencias a elementos del DOM
var boardContainer = document.getElementById('board-container');
var newGameButton = document.getElementById('new-game-button');
var minesDisplay = document.getElementById('mines-display');
var timerDisplay = document.getElementById('timer-display');
var gameModal = document.getElementById('game-modal');
var modalMessage = document.getElementById('modal-message');
var modalCloseButton = document.getElementById('modal-close-button');
var nameModal = document.getElementById('name-modal');
var playerNameInput = document.getElementById('player-name-input');
var startGameButton = document.getElementById('start-game-button');
var nameErrorMessage = document.getElementById('name-error-message');
// Referencias para la selección de dificultad del juego
var gameDifficultyRadios = document.getElementsByName('difficulty');

// Referencia al tbody de la tabla de puntajes
var scoresTableBody = document.getElementById('scores-table') ? document.getElementById('scores-table').getElementsByTagName('tbody')[0] : null;
// Referencias para la selección de dificultad del scoreboard
var scoreboardDifficultyRadios = document.getElementsByName('scoreboardDifficulty');

// Funciones de inicialización y control del juego

/**
 * Muestra el modal de ingreso de nombre al inicio del juego.
 */
function showNameModal() {
    if (!nameModal) {
        console.error("Error: El elemento con ID 'name-modal' no se encontró en el DOM. Revisa index.html.");
        return;
    }
    nameModal.style.display = 'flex';
    if (playerNameInput) playerNameInput.value = '';
    if (nameErrorMessage) nameErrorMessage.textContent = '';
    var easyDifficultyRadio = document.querySelector('input[name="difficulty"][value="easy"]');
    if (easyDifficultyRadio) easyDifficultyRadio.checked = true;
}

/**
 * Valida el nombre del jugador.
 * @param {string} name - El nombre ingresado por el jugador.
 * @returns {boolean} - Verdadero si el nombre es válido, falso en caso contrario.
 */
function validatePlayerName(name) {
    var minLength = 3;
    var alphanumericRegex = /^[a-zA-Z0-9]+$/;

    if (name.length < minLength) {
        if (nameErrorMessage) nameErrorMessage.textContent = 'El nombre debe tener al menos ' + String(minLength) + ' letras.';
        return false;
    }
    if (!alphanumericRegex.test(name)) {
        if (nameErrorMessage) nameErrorMessage.textContent = 'El nombre solo puede contener caracteres alfanuméricos.';
        return false;
    }
    if (nameErrorMessage) nameErrorMessage.textContent = '';
    return true;
}

/**
 * Establece el tamaño del tablero y el número de minas según la dificultad seleccionada para el JUEGO.
 */
function setGameDifficulty() {
    var selectedDifficulty = 'easy';
    var i;
    if (gameDifficultyRadios) {
        for (i = 0; i < gameDifficultyRadios.length; i++) {
            if (gameDifficultyRadios[i].checked) {
                selectedDifficulty = gameDifficultyRadios[i].value;
                break;
            }
        }
    }
    currentDifficulty = selectedDifficulty; // Actualizar la dificultad global del juego

    switch (currentDifficulty) {
        case 'easy':
            boardSize = 8;
            numMines = 10;
            break;
        case 'medium':
            boardSize = 12;
            numMines = 25;
            break;
        case 'hard':
            boardSize = 16;
            numMines = 40;
            break;
        default:
            boardSize = 8;
            numMines = 10;
            break;
    }
}

/**
 * Inicializa una nueva partida de Buscaminas.
 */
function initializeGame() {
    var inputName = playerNameInput ? playerNameInput.value : '';
    if (!validatePlayerName(inputName)) {
        return;
    }
    playerName = inputName;
    if (nameModal) nameModal.style.display = 'none';

    setGameDifficulty(); // Establecer la dificultad del juego

    gameStarted = false;
    gameOver = false;
    seconds = 0;
    revealedCellsCount = 0;
    clearInterval(timerInterval);
    if (timerDisplay) timerDisplay.textContent = '00:00';
    if (minesDisplay) minesDisplay.textContent = String(numMines);

    if (boardContainer) boardContainer.innerHTML = '';
    board = [];

    createBoard(boardSize, boardSize);
    placeMines(numMines);
    calculateNeighborMines();

    if (minesDisplay) minesDisplay.textContent = String(numMines);

    // Al iniciar un nuevo juego, asegurarse de que el scoreboard muestre la dificultad del juego
    var i;
    if (scoreboardDifficultyRadios) {
        for (i = 0; i < scoreboardDifficultyRadios.length; i++) {
            if (scoreboardDifficultyRadios[i].value === currentDifficulty) {
                scoreboardDifficultyRadios[i].checked = true;
                break;
            }
        }
    }
    mostrarPuntajes(currentDifficulty); // Mostrar el scoreboard de la dificultad actual
}

/**
 * Crea la estructura del tablero HTML y la matriz de datos.
 * @param {number} rows - Número de filas.
 * @param {number} cols - Número de columnas.
 */
function createBoard(rows, cols) {
    var i, j;
    if (boardContainer) {
        boardContainer.style.width = (cols * 42) + 'px';
        boardContainer.style.height = (rows * 42) + 'px';
    }

    for (i = 0; i < rows; i++) {
        board[i] = [];
        for (j = 0; j < cols; j++) {
            var cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = String(i);
            cell.dataset.col = String(j);
            cell.dataset.isMine = 'false';
            cell.dataset.isRevealed = 'false';
            cell.dataset.isFlagged = 'false';
            cell.dataset.neighborMines = '0';

            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleCellRightClick);
            if (boardContainer) boardContainer.appendChild(cell);

            board[i][j] = {
                element: cell,
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            };
        }
    }
}

/**
 * Coloca las minas aleatoriamente en el tablero.
 * @param {number} count - Número de minas a colocar.
 */
function placeMines(count) {
    var minesPlaced = 0;
    while (minesPlaced < count) {
        var row = Math.floor(Math.random() * boardSize);
        var col = Math.floor(Math.random() * boardSize);

        if (board[row] && board[row][col] && !board[row][col].isMine) {
            board[row][col].isMine = true;
            board[row][col].element.dataset.isMine = 'true';
            minesPlaced++;
        }
    }
}

/**
 * Calcula el número de minas vecinas para cada celda no minada.
 */
function calculateNeighborMines() {
    var i, j, r, c;
    for (i = 0; i < boardSize; i++) {
        for (j = 0; j < boardSize; j++) {
            if (!board[i][j].isMine) {
                var mineCount = 0;
                for (r = -1; r <= 1; r++) {
                    for (c = -1; c <= 1; c++) {
                        if ((r !== 0 || c !== 0) &&
                            (i + r >= 0 && i + r < boardSize) &&
                            (j + c >= 0 && j + c < boardSize)) {
                            if (board[i + r] && board[i + r][j + c] && board[i + r][j + c].isMine) {
                                mineCount++;
                            }
                        }
                    }
                }
                board[i][j].neighborMines = mineCount;
                board[i][j].element.dataset.neighborMines = String(mineCount);
            }
        }
    }
}

/**
 * Maneja el evento de click izquierdo en una celda.
 * @param {Event} event - El objeto de evento.
 */
function handleCellClick(event) {
    var targetCell = event.target;
    var row = parseInt(targetCell.dataset.row, 10);
    var col = parseInt(targetCell.dataset.col, 10);

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    if (gameOver || board[row][col].isRevealed || board[row][col].isFlagged) {
        return;
    }

    revealCell(row, col);

    checkGameStatus();
}

/**
 * Maneja el evento de click derecho en una celda para colocar/quitar bandera.
 * @param {Event} event - El objeto de evento.
 */
function handleCellRightClick(event) {
    event.preventDefault();
    var targetCell = event.target;
    var row = parseInt(targetCell.dataset.row, 10);
    var col = parseInt(targetCell.dataset.col, 10);

    if (gameOver || board[row][col].isRevealed) {
        return;
    }

    if (board[row][col].isFlagged) {
        board[row][col].isFlagged = false;
        targetCell.classList.remove('flagged');
        targetCell.dataset.isFlagged = 'false';
        updateMineCounter(1);
    } else {
        board[row][col].isFlagged = true;
        targetCell.classList.add('flagged');
        targetCell.dataset.isFlagged = 'true';
        updateMineCounter(-1);
    }
}

/**
 * Revela una celda y ejecuta la expansión si es necesario.
 * @param {number} row - Fila de la celda.
 * @param {number} col - Columna de la celda.
 */
function revealCell(row, col) {
    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize || board[row][col].isRevealed || board[row][col].isFlagged) {
        return;
    }

    board[row][col].isRevealed = true;
    board[row][col].element.classList.add('revealed');
    board[row][col].element.dataset.isRevealed = 'true';

    if (board[row][col].isMine) {
        board[row][col].element.classList.add('mine');
        endGame(false);
        return;
    }

    revealedCellsCount++;

    var neighborMines = board[row][col].neighborMines;
    if (neighborMines > 0) {
        board[row][col].element.textContent = String(neighborMines);
        board[row][col].element.classList.add('number-' + String(neighborMines));
    } else {
        expandEmptyCells(row, col);
    }
}

/**
 * Función recursiva para la expansión de celdas vacías.
 * @param {number} row - Fila de la celda.
 * @param {number} col - Columna de la celda.
 */
function expandEmptyCells(row, col) {
    var r, c;
    for (r = -1; r <= 1; r++) {
        for (c = -1; c <= 1; c++) {
            var newRow = row + r;
            var newCol = col + c;

            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize &&
                !board[newRow][newCol].isRevealed && !board[newRow][newCol].isMine && !board[newRow][newCol].isFlagged) {

                board[newRow][newCol].isRevealed = true;
                board[newRow][newCol].element.classList.add('revealed');
                board[newRow][newCol].element.dataset.isRevealed = 'true';
                revealedCellsCount++;

                var neighborMines = board[newRow][newCol].neighborMines;
                if (neighborMines > 0) {
                    board[newRow][newCol].element.textContent = String(neighborMines);
                    board[newRow][newCol].element.classList.add('number-' + String(neighborMines));
                } else {
                    expandEmptyCells(newRow, newCol);
                }
            }
        }
    }
}

/**
 * Actualiza el contador de minas restantes.
 * @param {number} change - El cambio a aplicar al contador (1 para sumar, -1 para restar).
 */
function updateMineCounter(change) {
    if (minesDisplay) {
        var currentMines = parseInt(minesDisplay.textContent, 10);
        currentMines += change;
        minesDisplay.textContent = String(currentMines);
    }
}

/**
 * Inicia el temporizador del juego.
 */
function startTimer() {
    timerInterval = setInterval(function updateTimer() {
        seconds++;
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        var timeString = (minutes < 10 ? '0' : '') + String(minutes) + ':' + (remainingSeconds < 10 ? '0' : '') + String(remainingSeconds);
        if (timerDisplay) timerDisplay.textContent = timeString;
    }, 1000);
}

/**
 * Detiene el temporizador del juego.
 */
function stopTimer() {
    clearInterval(timerInterval);
}

/**
 * Verifica si el juego ha terminado (ganado o perdido).
 */
function checkGameStatus() {
    var totalNonMines = (boardSize * boardSize) - numMines;

    if (revealedCellsCount === totalNonMines) {
        endGame(true);
    }
}

/**
 * Finaliza el juego y muestra un mensaje.
 * @param {boolean} didWin - Verdadero si el jugador ganó, falso si perdió.
 */
function endGame(didWin) {
    gameOver = true;
    stopTimer();
    revealAllMines();
    if (modalMessage) {
        if (didWin) {
            modalMessage.textContent = '¡Felicidades, ' + playerName + '! ¡Has ganado la partida!';
            guardarPuntaje(playerName, seconds, currentDifficulty); // Guardar puntaje si ganó
        } else {
            modalMessage.textContent = '¡Oh no, ' + playerName + '! Has perdido. ¡Mejor suerte la próxima!';
        }

    }
    if (gameModal) gameModal.style.display = 'flex';
}

/**
 * Revela todas las minas al final del juego (útil para depuración o si se pierde).
 */
function revealAllMines() {
    var i, j;
    for (i = 0; i < boardSize; i++) {
        for (j = 0; j < boardSize; j++) {
            if (board[i] && board[i][j] && board[i][j].isMine) {
                board[i][j].element.classList.add('mine');
            }
        }
    }
}

// SCOREBOARD

/**
 * Guarda un puntaje en el localStorage para la dificultad específica.
 * @param {string} playerName - Nombre del jugador.
 * @param {number} seconds - Tiempo en segundos.
 * @param {string} difficulty - Dificultad del juego ('easy', 'medium', 'hard').
 */
function guardarPuntaje(playerName, seconds, difficulty) {
    var jugadorActual = {
        nombre: playerName,
        tiempo: seconds
    };

    var localStorageKey = 'buscaminasScores_' + difficulty; // Clave única por dificultad
    var scores = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    scores.push(jugadorActual);

    // Ordenar por tiempo de menor a mayor
    scores.sort(function(a, b) {
        return a.tiempo - b.tiempo;
    });

    // Mantener solo los 10 mejores puntajes (opcional, pero buena práctica)
    // scores = scores.slice(0, 10);

    localStorage.setItem(localStorageKey, JSON.stringify(scores));

    mostrarPuntajes(difficulty); // Actualizar el scoreboard después de guardar
}

/**
 * Muestra los puntajes en la tabla del scoreboard para la dificultad específica.
 * @param {string} difficulty - Dificultad del scoreboard a mostrar ('easy', 'medium', 'hard').
 */
function mostrarPuntajes(difficulty) {
    if (!scoresTableBody) {
        console.error("Error: El elemento 'scores-table-body' no se encontró en el DOM.");
        return;
    }

    var localStorageKey = 'buscaminasScores_' + difficulty;
    var scores = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    // Limpia cualquier fila existente para evitar duplicados
    scoresTableBody.innerHTML = '';

    if (scores.length === 0) {
        var row = scoresTableBody.insertRow();
        var cell = row.insertCell();
        cell.colSpan = 2;
        cell.textContent = 'No hay puntajes aún para esta dificultad. ¡Sé el primero!';
        return;
    }

    // Itera sobre los puntajes para crear las filas de la tabla
    for (var i = 0; i < scores.length; i++) {
        var score = scores[i];
        var row = scoresTableBody.insertRow();
        var timeCell = row.insertCell();
        var nameCell = row.insertCell();

        // Formatea el tiempo (de segundos a MM:SS)
        var minutes = Math.floor(score.tiempo / 60);
        var seconds = score.tiempo % 60;
        var formattedMinutes = (minutes < 10 ? '0' : '') + minutes;
        var formattedSeconds = (seconds < 10 ? '0' : '') + seconds;

        timeCell.textContent = formattedMinutes + ':' + formattedSeconds;
        nameCell.textContent = score.nombre;
    }
}


// Manejadores de eventos

/**
 * Callback para el botón de nueva partida.
 */
function handleNewGameButtonClick() {
    showNameModal();
}

/**
 * Callback para el botón de empezar partida en el modal de nombre.
 */
function handleStartGameButtonClick() {
    initializeGame();
}

/**
 * Callback para el botón de cerrar en el modal de fin de juego.
 */
function handleModalCloseButtonClick() {
    if (gameModal) gameModal.style.display = 'none';
}

/**
 * Callback para el cambio de radio button de dificultad del scoreboard.
 */
function handleScoreboardDifficultyChange(event) {
    var selectedScoreboardDifficulty = event.target.value;
    mostrarPuntajes(selectedScoreboardDifficulty);
}


// Inicialización de eventos al cargar el DOM
if (newGameButton) newGameButton.addEventListener('click', handleNewGameButtonClick);
if (startGameButton) startGameButton.addEventListener('click', handleStartGameButtonClick);
if (modalCloseButton) modalCloseButton.addEventListener('click', handleModalCloseButtonClick);

// Añadir event listeners a los radio buttons de dificultad del scoreboard
var i;
if (scoreboardDifficultyRadios) {
    for (i = 0; i < scoreboardDifficultyRadios.length; i++) {
        scoreboardDifficultyRadios[i].addEventListener('change', handleScoreboardDifficultyChange);
    }
}


// Escuchar la barra espaciadora para iniciar un nuevo juego
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && nameModal && nameModal.style.display === 'none' && gameModal && gameModal.style.display === 'none') {
        event.preventDefault();
        showNameModal();
    }
});

// Llamada inicial para mostrar el modal de nombre al cargar la página
// y para mostrar los puntajes de la dificultad 'easy' por defecto.
showNameModal();
mostrarPuntajes('easy'); // Mostrar el scoreboard fácil al cargar por primera vez
