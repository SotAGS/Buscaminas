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

// Funciones de inicialización y control del juego

/**
 * Muestra el modal de ingreso de nombre al inicio del juego.
 */
function showNameModal() {
    nameModal.style.display = 'flex'; // Usar 'flex' para centrar con CSS Flexbox
    playerNameInput.value = ''; // Limpiar el input
    nameErrorMessage.textContent = ''; // Limpiar mensaje de error
}

/**
 * Valida el nombre del jugador.
 * @param {string} name - El nombre ingresado por el jugador.
 * @returns {boolean} - Verdadero si el nombre es válido, falso en caso contrario.
 */
function validatePlayerName(name) {
    // Validar mínimo 3 letras y alfanumérico
    var minLength = 3;
    var alphanumericRegex = /^[a-zA-Z0-9]+$/; // Expresión regular para alfanumérico

    if (name.length < minLength) {
        nameErrorMessage.textContent = 'El nombre debe tener al menos ' + String(minLength) + ' letras.';
        return false;
    }
    if (!alphanumericRegex.test(name)) {
        nameErrorMessage.textContent = 'El nombre solo puede contener caracteres alfanuméricos.';
        return false;
    }
    nameErrorMessage.textContent = ''; // Limpiar mensaje de error si es válido
    return true;
}

/**
 * Inicializa una nueva partida de Buscaminas.
 */
function initializeGame() {
    var inputName = playerNameInput.value;
    if (!validatePlayerName(inputName)) {
        return; // No iniciar el juego si el nombre no es válido
    }
    playerName = inputName;
    nameModal.style.display = 'none';

    // Restablecer el estado del juego
    gameStarted = false;
    gameOver = false;
    seconds = 0;
    revealedCellsCount = 0;
    clearInterval(timerInterval);
    timerDisplay.textContent = '00:00';
    minesDisplay.textContent = String(numMines);

    // Limpiar tablero existente
    boardContainer.innerHTML = '';
    board = [];

    // Generar tablero dinámicamente
    createBoard(boardSize, boardSize);
    placeMines(numMines);
    calculateNeighborMines();

    // Actualizar el contador de minas visibles
    minesDisplay.textContent = String(numMines);
}

/**
 * Crea la estructura del tablero HTML y la matriz de datos.
 * @param {number} rows - Número de filas.
 * @param {number} cols - Número de columnas.
 */
function createBoard(rows, cols) {
    var i, j;
    boardContainer.style.width = (cols * 42) + 'px'; // Ajustar ancho del contenedor (40px celda + 2px borde)

    for (i = 0; i < rows; i++) {
        board[i] = [];
        for (j = 0; j < cols; j++) {
            var cell = document.createElement('div');
            cell.className = 'cell'; // Añadir clase 'cell'
            cell.dataset.row = String(i); // Usar dataset para almacenar la posición
            cell.dataset.col = String(j);
            // dataset para guardar estado y propiedades, simplifica DOM
            cell.dataset.isMine = 'false';
            cell.dataset.isRevealed = 'false';
            cell.dataset.isFlagged = 'false';
            cell.dataset.neighborMines = '0';

            // Agregar manejadores de eventos usando funciones nombradas
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleCellRightClick); // Click derecho
            boardContainer.appendChild(cell);

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

        if (!board[row][col].isMine) {
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
                // Revisar los 8 vecinos
                for (r = -1; r <= 1; r++) {
                    for (c = -1; c <= 1; c++) {
                        // Evitar la celda actual y asegurarse de que los vecinos estén dentro del tablero
                        if ((r !== 0 || c !== 0) &&
                            (i + r >= 0 && i + r < boardSize) &&
                            (j + c >= 0 && j + c < boardSize)) {
                            if (board[i + r][j + c].isMine) {
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

    // Si el juego no ha comenzado, iniciar el temporizador en el primer click
    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    // Si el juego ha terminado o la celda ya está revelada o marcada, no hacer nada
    if (gameOver || board[row][col].isRevealed || board[row][col].isFlagged) {
        return;
    }

    // Revelar la celda
    revealCell(row, col);

    // Comprobar si se ganó o perdió después de revelar
    checkGameStatus();
}

/**
 * Maneja el evento de click derecho en una celda para colocar/quitar bandera.
 * @param {Event} event - El objeto de evento.
 */
function handleCellRightClick(event) {
    event.preventDefault(); // Prevenir el menú contextual del navegador
    var targetCell = event.target;
    var row = parseInt(targetCell.dataset.row, 10);
    var col = parseInt(targetCell.dataset.col, 10);

    // Si el juego ha terminado o la celda ya está revelada, no hacer nada
    if (gameOver || board[row][col].isRevealed) {
        return;
    }

    // Toggle de la bandera
    if (board[row][col].isFlagged) {
        board[row][col].isFlagged = false;
        targetCell.classList.remove('flagged');
        targetCell.dataset.isFlagged = 'false';
        updateMineCounter(1); // Sumar una mina al contador
    } else {
        board[row][col].isFlagged = true;
        targetCell.classList.add('flagged');
        targetCell.dataset.isFlagged = 'true';
        updateMineCounter(-1); // Restar una mina al contador
    }
}

/**
 * Revela una celda y ejecuta la expansión si es necesario.
 * @param {number} row - Fila de la celda.
 * @param {number} col - Columna de la celda.
 */
function revealCell(row, col) {
    // Validaciones para no salir del tablero o revelar celdas ya reveladas/banderas
    if (row < 0 || row >= boardSize || col < 0 || col >= boardSize || board[row][col].isRevealed || board[row][col].isFlagged) {
        return;
    }

    board[row][col].isRevealed = true;
    board[row][col].element.classList.add('revealed');
    board[row][col].element.dataset.isRevealed = 'true';

    if (board[row][col].isMine) {
        board[row][col].element.classList.add('mine');
        endGame(false); // Pierde la partida
        return;
    }

    revealedCellsCount++; // Incrementar contador de celdas reveladas no minadas

    var neighborMines = board[row][col].neighborMines;
    if (neighborMines > 0) {
        board[row][col].element.textContent = String(neighborMines);
        board[row][col].element.classList.add('number-' + String(neighborMines));
    } else {
        // Celda vacía sin minas vecinas, iniciar expansión
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

            // Asegurarse de que el vecino esté dentro del tablero y no sea la celda original
            if (newRow >= 0 && newRow < boardSize && newCol >= 0 && newCol < boardSize &&
                !board[newRow][newCol].isRevealed && !board[newRow][newCol].isMine && !board[newRow][newCol].isFlagged) {

                board[newRow][newCol].isRevealed = true;
                board[newRow][newCol].element.classList.add('revealed');
                board[newRow][newCol].element.dataset.isRevealed = 'true';
                revealedCellsCount++; // Incrementar contador

                var neighborMines = board[newRow][newCol].neighborMines;
                if (neighborMines > 0) {
                    board[newRow][newCol].element.textContent = String(neighborMines);
                    board[newRow][newCol].element.classList.add('number-' + String(neighborMines));
                } else {
                    expandEmptyCells(newRow, newCol); // Continuar la expansión recursivamente
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
    var currentMines = parseInt(minesDisplay.textContent, 10);
    currentMines += change;
    minesDisplay.textContent = String(currentMines);
}

/**
 * Inicia el temporizador del juego.
 */
function startTimer() {
    timerInterval = setInterval(function updateTimer() { // Función nombrada para el callback
        seconds++;
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        var timeString = (minutes < 10 ? '0' : '') + String(minutes) + ':' + (remainingSeconds < 10 ? '0' : '') + String(remainingSeconds);
        timerDisplay.textContent = timeString;
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

    // Si todas las celdas no minadas han sido reveladas, el jugador gana
    if (revealedCellsCount === totalNonMines) {
        endGame(true); // Ganó
    }
}

/**
 * Finaliza el juego y muestra un mensaje.
 * @param {boolean} didWin - Verdadero si el jugador ganó, falso si perdió.
 */
function endGame(didWin) {
    gameOver = true;
    stopTimer();
    revealAllMines(); // Revelar todas las minas al final del juego

    if (didWin) {
        modalMessage.textContent = '¡Felicidades, ' + playerName + '! ¡Has ganado la partida!';
        //me faltaba esto x eso no se guardaba xd
        guardarPuntaje(playerName, seconds);
    } else {
        modalMessage.textContent = '¡Oh no, ' + playerName + '! Has perdido. ¡Mejor suerte la próxima!';
    }
    gameModal.style.display = 'flex'; // Mostrar el modal
}

/**
 * Revela todas las minas al final del juego (útil para depuración o si se pierde).
 */
function revealAllMines() {
    var i, j;
    for (i = 0; i < boardSize; i++) {
        for (j = 0; j < boardSize; j++) {
            if (board[i][j].isMine) {
                board[i][j].element.classList.add('mine');
                // Si la mina no fue marcada con bandera y se perdió, podrías mostrar un ícono de bomba
                // o cambiar su texto para indicar la mina.
            }
        }
    }
}

// Manejadores de eventos

/**
 * Callback para el botón de nueva partida.
 */
function handleNewGameButtonClick() {
    showNameModal(); // Mostrar modal de nombre al reiniciar
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
    gameModal.style.display = 'none'; // Ocultar el modal de juego
}

// Inicialización de eventos al cargar el DOM
newGameButton.addEventListener('click', handleNewGameButtonClick);
startGameButton.addEventListener('click', handleStartGameButtonClick);
modalCloseButton.addEventListener('click', handleModalCloseButtonClick);

// Escuchar la barra espaciadora para iniciar un nuevo juego
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !nameModal.style.display === 'flex' && !gameModal.style.display === 'flex') { // No debería abrirse si ya hay un modal abierto
        event.preventDefault(); // Evitar scroll
        showNameModal();
    }
});


// Llamada inicial para mostrar el modal de nombre al cargar la página
showNameModal();



//SCOREBOARD
function guardarPuntaje(playerName, seconds) {
    var jugadorActual = {
        nombre: playerName,
        tiempo: seconds
    };

    //recibe los puntajes existentes del localstorage
    var scores = JSON.parse(localStorage.getItem('buscaminasScores')) || [];

    scores.push(jugadorActual);

    //ordenar tiempos
    scores.sort(function(a, b) {
        return a.tiempo - b.tiempo;
    });


    //guardado de puntos en el localstorage
    localStorage.setItem('buscaminasScores', JSON.stringify(scores));

    mostrarPuntajes();
}


function mostrarPuntajes() {
    var scores = JSON.parse(localStorage.getItem('buscaminasScores')) || [];
    var scoresTableBody = document.getElementById('scores-table').getElementsByTagName('tbody')[0];

    //limpia cualquier fila existente para evitar duplicados
    scoresTableBody.innerHTML = '';

    if (scores.length === 0) {
        scoresTableBody.innerHTML = '<tr><td colspan="2">No hay puntajes aún. ¡Sé el primero!</td></tr>';
        return;
    }


    //desconche barbaro que me paso el gemini pero lo dejo xq esta muy bueno
    // Itera sobre los puntajes para crear las filas de la tabla
    for (var i = 0; i < scores.length; i++) {
        var score = scores[i];
        var row = scoresTableBody.insertRow();
        var timeCell = row.insertCell();
        var nameCell = row.insertCell();

        // Formatea el tiempo (de segundos a MM:SS)
        var minutes = Math.floor(score.tiempo / 60);
        var seconds = score.tiempo % 60;
        // Agrega ceros iniciales si el número es menor a 10
        var formattedMinutes = (minutes < 10 ? '0' : '') + minutes;
        var formattedSeconds = (seconds < 10 ? '0' : '') + seconds;

        timeCell.textContent = formattedMinutes + ':' + formattedSeconds;
        nameCell.textContent = score.nombre;
    }
}


//carga mostrarpuntajes al cargar pagina
window.onload = mostrarPuntajes;
