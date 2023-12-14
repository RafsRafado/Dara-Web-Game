const maxPieceCount = 12;
let board;
let currentPlayerColor;
let initialPlayerColor;
let computerColor;
let pieceCounts = {black: 0,white: 0};
let pieceRemoved = {black: 0,white: 0};
let previousMove = {black: { row: -1, col: -1 } , white: { row: -1, col: -1 }};
let isPlacementPhase;
let isMovementPhase;
let isRemovePiecePhase;
let selectedPiece = null;
let rows = 0;
let cols = 0;
let winner = null;
let gameMode;

window.onload = function () {
    initGame();
};

const applySettingButton = document.getElementById('apply-settings');
applySettingButton.addEventListener('click', initGame);

const reiniciarJogoButton = document.getElementById('reset-button');
reiniciarJogoButton.addEventListener('click', resetGame);


function clearBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    document.getElementById('message-container').style.display = 'none';
    isPlacementPhase = true;
    isMovementPhase = false;
    isRemovePiecePhase = false;
    selectedPiece = null;
    pieceCounts = {black: 0,white: 0};
    pieceRemoved = {black: 0,white: 0};
    previousMove = {black: { row: -1, col: -1 } , white: { row: -1, col: -1 }};
    board = [];
    for (let row = 0; row < rows; row++) {
        board[row] = [];
        for (let col = 0; col < cols; col++) {
            board[row][col] = null;
        }
    }
}

function createBoard(rows, cols) {
    const boardElement = document.getElementById('board');
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 50px)`;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            cellElement.dataset.row = row.toString();
            cellElement.dataset.col = col.toString();
            boardElement.appendChild(cellElement);
        }
    }
    boardElement.addEventListener('click', cellClick);
    updateLabels();
}

function initGame() {
    rows = parseInt(document.getElementById('linhas-tabuleiro').value);
    cols = parseInt(document.getElementById('colunas-tabuleiro').value);
    gameMode = document.getElementById('modo-jogo').textContent;
    document.getElementById('game-mode').value = gameMode;
    currentPlayerColor = document.getElementById('primeiro-jogador').value === 'jogador1' ? 'black' : 'white';
    initialPlayerColor = currentPlayerColor;
    computerColor = getOppositeColor(currentPlayerColor);
    clearBoard();
    createBoard(rows, cols);
}

function resetGame() {
    if (confirm('Deseja reiniciar o jogo? Todo o progresso será perdido!')) {
        currentPlayerColor = initialPlayerColor;
        clearBoard();
        createBoard(rows, cols);
        winner = null;
    }
}

function updateLabels() {
    const messageLabel = document.getElementById('message');
    const blackCountLabel = document.getElementById('black-count');
    const whiteCountLabel = document.getElementById('white-count');

    messageLabel.textContent = `Player ${currentPlayerColor === 'black' ? 'Black' : 'White'}'s Turn`;
    if (isRemovePiecePhase) {
        messageLabel.textContent = `Player ${currentPlayerColor === 'black' ? 'Black' : 'White'}'s Turn - Remove a piece`;
    }
    blackCountLabel.textContent = (maxPieceCount - pieceCounts.black).toString();
    whiteCountLabel.textContent = (maxPieceCount - pieceCounts.white).toString();
}
function placePiece(row, col, cell) {
    if (!isPlacementPhase) {
        return;
    }
    if (hasThreeInRowOrColumn(row, col)) {
        alert('Movimento proibido. Colocar a peça nesta posição forma uma sequência de 4 peças');
        return;
    }
    if (cell.classList.contains('black-piece') || cell.classList.contains('white-piece')) {
        return;
    }
    if ((currentPlayerColor === 'black' && pieceCounts.black < maxPieceCount) ||
        (currentPlayerColor === 'white' && pieceCounts.white < maxPieceCount)) {
        board[row][col] = currentPlayerColor;
        cell.classList.add(`${currentPlayerColor}-piece`);
        if (currentPlayerColor === 'black') {
            pieceCounts.black++;
        } else {
            pieceCounts.white++;
        }
        switchPlayer();
        updateLabels();
        if (pieceCounts.black === maxPieceCount && pieceCounts.white === maxPieceCount) {
            isPlacementPhase = false;
            isMovementPhase = true;
            setMessageContainer('Todas as peças foram colocadas! - Fase de Movimentação');
        }
    }
}

function movePiece(row, col, cell) {
    switch (true) {
        case !isMovementPhase:
            return;
        case cell.classList.contains(`${getOppositeColor(currentPlayerColor)}-piece`):
            alert('Movimento proibido. Por favor, seleciona uma das suas peças.');
            break;
        case cell.classList.contains(`${currentPlayerColor}-piece`):
            selectPiece(row, col, cell);
            break;
        case selectedPiece && canMovePiece(row, col):
            moveSelectedPiece(row, col, cell);
            break;
        default:
            alert('Movimento proibido. Por favor, seleciona uma das células com a cor verde.');
    }
}

function removePiece(row, col, color) {
    const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    if(cell.classList.contains(`removable-piece`)) {
        cell.classList.remove(`${color}-piece`);
        board[row][col] = null;
        isRemovePiecePhase = false;
        pieceRemoved[color] += 1;
        clearHighlightedRemovablePieces();
        if(isGameOver()) {
            isMovementPhase = false;
            isPlacementPhase = false;
            isRemovePiecePhase = false;
            setMessageContainer(`Fim de jogo! Vencedor: ${currentPlayerColor}`);
            return;
        }
        currentPlayerColor = getOppositeColor(currentPlayerColor);
        updateLabels();
    } else {
        alert('Movimento proibido. Por favor, selecione uma peça da cor do adversario.');
    }
}

function setMessageContainer(message) {
    document.getElementById('message-fase').textContent = message;
    document.getElementById('message-container').style.display = 'block';
}

function isGameOver() {
    if (pieceRemoved.black >= maxPieceCount - 2 || pieceRemoved.white >= maxPieceCount - 2) {
        console.log('Game Over');
        winner = currentPlayerColor;
        addClassificationToHTML(winner, gameMode);
        return true;
    }
    else if (!hasAvailableMoves(getOppositeColor(currentPlayerColor))) {
        console.log('Game Over');
        winner = currentPlayerColor;
        addClassificationToHTML(winner, gameMode);
        return true;
    }
    return false;
}

function addClassificationToHTML(winnerColor, gameMode) {
    const winnerType = winnerColor === computerColor ? 'Computador' : 'Jogador';
    const tableBody = document.getElementById('classificacoes-tbody');
    const row = tableBody.insertRow();
    const cellGameMode = row.insertCell(0);
    const cellWinner = row.insertCell(1);
    const cellPlayerType = row.insertCell(2);
    cellGameMode.textContent = gameMode;
    cellWinner.textContent = winnerColor;
    cellPlayerType.textContent = winnerType;
    row.classList.add('classification-row');
}




function hasAvailableMoves(playerColor) {
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
                if (!board[row][col] && isAdjacentToPieceOfColor(row, col, playerColor)) {
                    return true;
                }
        }
    }
}

function isAdjacentToPieceOfColor(row, col, color) {
    switch (true) {
        case row > 0 && board[row - 1][col] === color:
        case row < rows - 1 && board[row + 1][col] === color:
        case col > 0 && board[row][col - 1] === color:
        case col < cols - 1 && board[row][col + 1] === color:
            return true;
        default:
            return false;
    }
}

function selectPiece(row, col, cell) {
    let currentPiece = board[row][col];
    if (currentPiece === currentPlayerColor) {
        if (selectedPiece) {
            try {
                const selectedCell = document.querySelector('.cell.selected');
                selectedCell.classList.remove('selected');
                clearHighlightedEmptyAdjacent();
            } catch (error) {
                selectedPiece = { row, col };
                cell.classList.add('selected');
                highlightEmptyAdjacent(row, col);
            }
        }
        selectedPiece = { row, col };
        cell.classList.add('selected');
        highlightEmptyAdjacent(row, col);
    }
}

function canMovePiece(row, col) {
    const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    return cell.classList.contains('empty-adjacent');
}

function moveSelectedPiece(row, col, cell) {
    board[row][col] = currentPlayerColor;
    board[selectedPiece.row][selectedPiece.col] = null;
    const selectedCell = document.querySelector('.cell.selected');
    selectedCell.classList.remove('selected', `${currentPlayerColor.toLowerCase()}-piece`);
    cell.classList.add(`${currentPlayerColor.toLowerCase()}-piece`);
    previousMove[currentPlayerColor] = { row: selectedPiece.row, col: selectedPiece.col };
    selectedPiece = null;
    if (hasXInARowOrColumn(row, col, 3)) {
        isRemovePiecePhase = true;
        highlightRemovablePieces(getOppositeColor(currentPlayerColor));
    } else {
        switchPlayer();
    }
    clearHighlightedEmptyAdjacent();
    updateLabels();
}

function getOppositeColor(color) {
    return color === 'black' ? 'white' : 'black';
}

function switchPlayer() {
    currentPlayerColor = getOppositeColor(currentPlayerColor);
}



const RobotPlayer = {
    placeRandom:async function(board) {
        const emptyCells = findEmptyCells(board);
        if (emptyCells.length > 0) {
            let row, col;
            do {
                const randomIndex = Math.floor(Math.random() * emptyCells.length);
                row = emptyCells[randomIndex]['row'];
                col = emptyCells[randomIndex]['col'];
            } while (hasThreeInRowOrColumn(row, col));

            await new Promise(r => setTimeout(r, 300));
            const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
            placePiece(row, col, cell);
        }
    },
    makeMove: async function(board) {
        const boardElement = document.getElementById('board');
        const cells = Array.from(boardElement.querySelectorAll('.cell'));
        shuffle(cells);
        for (const cell of cells) {
            const row = cell.dataset.row;
            const col = cell.dataset.col;
            if (board[row][col] === currentPlayerColor) {
                selectPiece(row, col, cell);
                const availableMoves = boardElement.querySelectorAll('.cell.empty-adjacent');
                await new Promise(r => setTimeout(r, 300));

                if (availableMoves.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableMoves.length);
                    const randomCell = availableMoves[randomIndex];
                    const { row, col } = randomCell.dataset;
                    moveSelectedPiece(row, col, randomCell);

                    if (isRemovePiecePhase) {
                        await new Promise(r => setTimeout(r, 800));
                        await RobotPlayer.removeRandom();
                    }

                    return;
                }
            }
        }
    },
    removeRandom: async function() {
        const boardElement = document.getElementById('board');
        const cells = Array.from(boardElement.querySelectorAll('.cell.removable-piece'));
        if (cells.length > 0) {
            const randomIndex = Math.floor(Math.random() * cells.length);
            const randomCell = cells[randomIndex];
            const row = randomCell.dataset.row;
            const col = randomCell.dataset.col;

            await new Promise(r => setTimeout(r, 800));
            removePiece(row, col, getOppositeColor(currentPlayerColor));
        }
    }
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


function findEmptyCells(board) {
    const emptyCells = [];
    board.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (!cell) {
                emptyCells.push({ row: rowIndex, col: colIndex });
            }
        });
    });
    return emptyCells;
}

async function cellClick(event) {
    const cell = event.target;
    if (cell.id === 'board' || cell.classList.contains('selected') || currentPlayerColor === computerColor && gameMode === "jogador-vs-computador") {
        return;
    }
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    switch (true) {
        case isRemovePiecePhase:
            removePiece(row, col, getOppositeColor(currentPlayerColor));
            break;
        case isPlacementPhase:
            placePiece(row, col, cell);
            break;
        case isMovementPhase:
            movePiece(row, col, cell);
            break;
        default:
            break;
    }
    if (currentPlayerColor === computerColor && gameMode === "jogador-vs-computador") {
        await handleComputerMove();
    }
}

async function handleComputerMove() {
    await new Promise(r => setTimeout(r, 500));
    if (isPlacementPhase) {
        await RobotPlayer.placeRandom(board);
    } else if (isMovementPhase) {
        await RobotPlayer.makeMove(board);
    } else if (isRemovePiecePhase) {
        await RobotPlayer.removeRandom(board);
    }
}


function highlightEmptyAdjacent(row, col) {
    const newboard = cloneBoard();
    board[row][col] = null;
    const offsets = [
        { row: -1, col: 0 },
        { row: 1, col: 0 },
        { row: 0, col: -1 },
        { row: 0, col: 1 }
    ];
    for (const offset of offsets) {
        const newRow = parseInt(row) + offset.row;
        const newCol = parseInt(col) + offset.col;
        if (newRow === parseInt(previousMove[currentPlayerColor].row) && newCol === parseInt(previousMove[currentPlayerColor].col)) {
            continue;
        }
        if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= cols) {
            continue;
        }
        if (board[newRow][newCol] || hasThreeInRowOrColumn(newRow, newCol)) {
            continue;
        }
        const cell = document.querySelector(`.cell[data-row='${newRow}'][data-col='${newCol}']`);
        cell.classList.add('empty-adjacent');
    }
    board = newboard;
}


function clearHighlightedEmptyAdjacent() {
    document.querySelectorAll('.cell.empty-adjacent').forEach((cell) => cell.classList.remove('empty-adjacent'));
}

function highlightRemovablePieces(color) {
    const boardElement = document.getElementById('board');
    const cells = boardElement.querySelectorAll('.cell');
    cells.forEach((cell) => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        if (board[row][col] === color) {
            cell.classList.add('removable-piece');
        }
    });
}

function clearHighlightedRemovablePieces() {
    document.querySelectorAll('.cell.removable-piece').forEach((cell) => cell.classList.remove('removable-piece'));
}

function cloneBoard() {
    let newboard = [];
    for(let i = 0; i < rows; i++) {
        newboard[i] = [];
        for(let j = 0; j < cols; j++) {
            newboard[i][j] = board[i][j];
        }
    }
    return newboard;
}

function hasThreeInRowOrColumn(row, col) {
    const newboard = cloneBoard();
    board[row][col] = currentPlayerColor;
    const hasThree = hasXInARowOrColumn(row, col, 4);
    board = newboard;
    return hasThree;
}

function hasXInARowOrColumn(row, col, x) {
    for (let c = col - x + 1; c <= col; c++) {
        if (c >= 0 && c + x - 1 < cols) {
            const consecutiveCells = [];
            for (let i = 0; i < x; i++) {
                consecutiveCells.push(board[row][c + i]);
            }
            if (consecutiveCells.every(cellColor => cellColor === currentPlayerColor)) {
                return true;
            }
        }
    }
    for (let r = row - x + 1; r <= row; r++) {
        if (r >= 0 && r + x - 1 < rows) {
            const consecutiveCells = [];
            for (let i = 0; i < x; i++) {
                consecutiveCells.push(board[r + i][col]);
            }
            if (consecutiveCells.every(cellColor => cellColor === currentPlayerColor)) {
                return true;
            }
        }
    }
    return false;
}