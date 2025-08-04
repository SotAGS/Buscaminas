'use strict';

var boardSize = 8;
var numMines = 10;
var board = [];
var gameStarted = false;
var gameOver = false;
var timerInterval;
var seconds = 0;
var playerName = '';
var revealedCellsCount = 0;
var currentDifficulty = 'easy';
var winAudio = new Audio('audio/8-bit-heaven-26287.mp3');
var cellClickAudio = new Audio('audio/one_beep-99630.mp3');
var explosionAudio = new Audio('audio/explosion-9-340460.mp3')
var loseAudio = new Audio('audio/8bit-sound-effect-268717.mp3');
var placeFlagAudio= new Audio('audio/gameboy-pluck-41265.mp3');
placeFlagAudio.volume = 0.5;
var startAudio = new Audio('audio/game-start-6104.mp3');

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
var gameDifficultyRadios = document.getElementsByName('difficulty');

var scoresTableBody = document.getElementById('scores-table') ? document.getElementById('scores-table').getElementsByTagName('tbody')[0] : null;
var scoreboardDifficultyRadios = document.getElementsByName('scoreboardDifficulty');

function showNameModal() {
    if (!nameModal) {
        console.error("Error: El elemento con ID 'name-modal' no se encontró en el DOM. Revisa index.html.");
        return;
    }
    nameModal.style.display = 'flex';
    if (nameErrorMessage) nameErrorMessage.textContent = '';
    var easyDifficultyRadio = document.querySelector('input[name="difficulty"][value="easy"]');
    if (easyDifficultyRadio) easyDifficultyRadio.checked = true;
}

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
    currentDifficulty = selectedDifficulty;

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

function initializeGame() {
    var inputName = playerNameInput ? playerNameInput.value : '';
    if (!validatePlayerName(inputName)) {
        return;
    }

    startAudio.pause();
    startAudio.currentTime = 0;
    startAudio.play();
    winAudio.pause();
    winAudio.currentTime = 0;
    loseAudio.pause();
    loseAudio.currentTime = 0;


    playerName = inputName;
    if (nameModal) nameModal.style.display = 'none';

    setGameDifficulty();

    gameStarted = false;
    gameOver = false;
    seconds = 0;
    revealedCellsCount = 0;
    clearInterval(timerInterval);
    if (timerDisplay) timerDisplay.textContent = '00:00';
    if (minesDisplay) minesDisplay.textContent = String(numMines);

   if (boardContainer) {
        boardContainer.innerHTML = '';      
        boardContainer.style.setProperty('--board-cols', String(boardSize));
        boardContainer.style.setProperty('--board-rows', String(boardSize));
    }
    board = [];

    createBoard(boardSize, boardSize);
    placeMines(numMines);
    calculateNeighborMines();

    if (minesDisplay) minesDisplay.textContent = String(numMines);

    var i;
    if (scoreboardDifficultyRadios) {
        for (i = 0; i < scoreboardDifficultyRadios.length; i++) {
            if (scoreboardDifficultyRadios[i].value === currentDifficulty) {
                scoreboardDifficultyRadios[i].checked = true;
                break;
            }
        }
    }
    showScores(currentDifficulty);
}

function createBoard(rows, cols) {
    var i, j;

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

function handleCellClick(event) {
    var targetCell = event.target;
    var row = parseInt(targetCell.dataset.row, 10);
    var col = parseInt(targetCell.dataset.col, 10);

    cellClickAudio.pause();
    cellClickAudio.currentTime = 0;
    cellClickAudio.play();

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

function handleCellRightClick(event) {
    event.preventDefault();
    var targetCell = event.target;
    var row = parseInt(targetCell.dataset.row, 10);
    var col = parseInt(targetCell.dataset.col, 10);

    placeFlagAudio.pause();
    placeFlagAudio.currentTime = 0;
    placeFlagAudio.play();
    
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

function updateMineCounter(change) {
    if (minesDisplay) {
        var currentMines = parseInt(minesDisplay.textContent, 10);
        currentMines += change;
        minesDisplay.textContent = String(currentMines);
    }
}

function startTimer() {
    timerInterval = setInterval(function updateTimer() {
        seconds++;
        var minutes = Math.floor(seconds / 60);
        var remainingSeconds = seconds % 60;
        var timeString = (minutes < 10 ? '0' : '') + String(minutes) + ':' + (remainingSeconds < 10 ? '0' : '') + String(remainingSeconds);
        if (timerDisplay) timerDisplay.textContent = timeString;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function checkGameStatus() {
    var totalNonMines = (boardSize * boardSize) - numMines;

    if (revealedCellsCount === totalNonMines) {
        endGame(true);
    }
}

function endGame(didWin) {
    gameOver = true;
    stopTimer();
    revealAllMines();
    if (modalMessage) {
        if (didWin) {
            winAudio.play();
            modalMessage.textContent = '¡Felicidades, ' + playerName + '! ¡Has ganado la partida!';
            saveScore(playerName, seconds, currentDifficulty);
        } else {
                cellClickAudio.pause();
                cellClickAudio.currentTime = 0;
                explosionAudio.play();
                loseAudio.play();
            modalMessage.textContent = '¡Oh no, ' + playerName + '! Has perdido. ¡Mejor suerte la próxima!';
        }

    }
    if (gameModal) gameModal.style.display = 'flex';
}

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

function saveScore(playerName, seconds, difficulty) {
    var currentPlayer = {
        name: playerName,
        time: seconds
    };

    var localStorageKey = 'buscaminasScores_' + difficulty;
    var scores = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    scores.push(currentPlayer);

    scores.sort(function(a, b) {
        return a.time - b.time;
    });

    localStorage.setItem(localStorageKey, JSON.stringify(scores));

    showScores(difficulty);
}

function showScores(difficulty) {
    if (!scoresTableBody) {
        console.error("Error: El elemento 'scores-table-body' no se encontró en el DOM.");
        return;
    }

    var localStorageKey = 'buscaminasScores_' + difficulty;
    var scores = JSON.parse(localStorage.getItem(localStorageKey)) || [];

    scoresTableBody.innerHTML = '';

    if (scores.length === 0) {
        var row = scoresTableBody.insertRow();
        var cell = row.insertCell();
        cell.colSpan = 2;
        cell.textContent = 'No hay puntajes aún para esta dificultad. ¡Sé el primero!';
        return;
    }

    for (var i = 0; i < scores.length; i++) {
        var score = scores[i];
        var row = scoresTableBody.insertRow();
        var timeCell = row.insertCell();
        var nameCell = row.insertCell();

        var minutes = Math.floor(score.time / 60);
        var seconds = score.time % 60;
        var formattedMinutes = (minutes < 10 ? '0' : '') + minutes;
        var formattedSeconds = (seconds < 10 ? '0' : '') + seconds;

        timeCell.textContent = formattedMinutes + ':' + formattedSeconds;
        nameCell.textContent = score.name;
    }
}


function handleNewGameButtonClick() {
    if (playerName) { // Si ya hay un nombre, inicia un nuevo juego directamente
        initializeGame();
    } else { // Si no, muestra el modal para pedirlo
        showNameModal();
    }
}

function handleStartGameButtonClick() {
    initializeGame();
}

function handleModalCloseButtonClick() {
    if (gameModal) gameModal.style.display = 'none';
}

function handleScoreboardDifficultyChange(event) {
    var selectedScoreboardDifficulty = event.target.value;
    showScores(selectedScoreboardDifficulty);
}


if (newGameButton) newGameButton.addEventListener('click', handleNewGameButtonClick);
if (startGameButton) startGameButton.addEventListener('click', handleStartGameButtonClick);
if (modalCloseButton) modalCloseButton.addEventListener('click', handleModalCloseButtonClick);

var i;
if (scoreboardDifficultyRadios) {
    for (i = 0; i < scoreboardDifficultyRadios.length; i++) {
        scoreboardDifficultyRadios[i].addEventListener('change', handleScoreboardDifficultyChange);
    }
}


document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && nameModal && nameModal.style.display === 'none' && gameModal && gameModal.style.display === 'none') {
        event.preventDefault();
        if (playerName) { // Si ya hay un nombre, inicia un nuevo juego directamente
            initializeGame();
        } else { // Si no, muestra el modal para pedirlo
            showNameModal();
        }
    }
});

showNameModal();
mostrarPuntajes('easy');