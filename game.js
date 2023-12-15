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
let turn;

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
            board[row][col] = "empty";
        }
    }
}

function createBoard(rows, cols,func) {
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
    boardElement.addEventListener('click', func);
    updateLabels();
}

function initGame() {
    rows = parseInt(document.getElementById('linhas-tabuleiro').value);
    cols = parseInt(document.getElementById('colunas-tabuleiro').value);
    gameMode = document.getElementById('modo-jogo').value;
    document.getElementById('game-mode').value = gameMode;
    currentPlayerColor = document.getElementById('primeiro-jogador').value === 'jogador1' ? 'black' : 'white';
    initialPlayerColor = currentPlayerColor;
    computerColor = getOppositeColor(currentPlayerColor);
    clearBoard();
    createBoard(rows, cols,cellClick);
}

function startGameFromAPI(response) {
    initialPlayerColor = response.players[nick];
    updatePlayerTurn(response.turn);
    updateGamePhase(response.phase);
    initGameFromAPI(response.board);
}

function initGameFromAPI(boardData) {
    const rows = boardData.length;
    const cols = boardData[0].length;
    document.getElementById('back-button').style.display = 'none';
    document.getElementById('reset-button').style.display = 'none';
    document.getElementById('forfeit-button').style.display = 'block';
    clearBoard();

    createBoard(rows, cols,cellClick);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
            const piece = boardData[row][col];
            cell.classList.remove('black-piece', 'white-piece');

            if (piece === 'black') {
                cell.classList.add('black-piece');
            } else if (piece === 'white') {
                cell.classList.add('white-piece');
            }
        }
    }
    updatePieceCount(boardData);
}

function updatePieceCount(boardData) {
    let blackCount = 0;
    let whiteCount = 0;

    for (let row of boardData) {
        for (let cell of row) {
            if (cell === 'black') {
                blackCount++;
            } else if (cell === 'white') {
                whiteCount++;
            }
        }
    }

    const blackCountLabel = document.getElementById('black-count');
    const whiteCountLabel = document.getElementById('white-count');
    blackCountLabel.textContent = blackCount.toString();
    whiteCountLabel.textContent = whiteCount.toString();
}

function updateGameFromAPI(data) {
    updateGamePhase(data.phase);
    currentPlayerColor=data.players[nick];
    if (data.board) {
        board = data.board;
        for (let row = 0; row < data.board.length; row++) {
            for (let col = 0; col < data.board[row].length; col++) {
                const cellValue = data.board[row][col];
                const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                cellElement.classList.remove('black-piece', 'white-piece');

                if (cellValue === 'black') {
                    cellElement.classList.add('black-piece');
                } else if (cellValue === 'white') {
                    cellElement.classList.add('white-piece');
                }
            }
        }
    }

    updatePieceCount(data.board);

    if (data.turn) {
        updatePlayerTurn(data.turn);
    }
}

function handleGameOver(winner) {
    alert(`Game Over! Winner: ${winner}`);
}

function updateGamePhase(phase) {
    isPlacementPhase = (phase === 'drop');
    isMovementPhase = (phase === 'move');
}

function updatePlayerTurn(pTurn) {
    turn = pTurn;
    const messageLabel = document.getElementById('message');
    if(nick===turn){
        messageLabel.textContent = `É a sua vez de jogar`;
    }else messageLabel.textContent = `Turno do jogador ${turn}`;
}

function resetGame() {
    if (confirm('Deseja reiniciar o jogo? Todo o progresso será perdido!')) {
        currentPlayerColor = initialPlayerColor;
        clearBoard();
        createBoard(rows, cols,cellClick);
        winner = null;
    }
}

function updateLabels() {
    if(gameMode==="modo-jogador-vs-computador"){
        console.log("aaa");
        const messageLabel = document.getElementById('message');
        const blackCountLabel = document.getElementById('black-count');
        const whiteCountLabel = document.getElementById('white-count');
        blackCountLabel.textContent = (maxPieceCount - pieceCounts.black).toString();
        whiteCountLabel.textContent = (maxPieceCount - pieceCounts.white).toString();
        messageLabel.textContent = `Player ${currentPlayerColor === 'black' ? 'Black' : 'White'}'s Turn`;
        if (isRemovePiecePhase) {
            messageLabel.textContent = `Player ${currentPlayerColor === 'black' ? 'Black' : 'White'}'s Turn - Remove a piece`;
        }
    }

}
async function placePiece(row, col, cell) {
    if (!isPlacementPhase) {
        return false;
    }
    if (hasThreeInRowOrColumn(row, col)) {
        alert('Movimento proibido. Colocar a peça nesta posição forma uma sequência de 4 peças');
        return false;
    }
    if (board[row][col]!=="empty") {
        return false;
    }
    if ((currentPlayerColor === 'black' && pieceCounts.black < maxPieceCount) ||
        (currentPlayerColor === 'white' && pieceCounts.white < maxPieceCount)
        || nick===turn && gameMode!=="modo-jogador-vs-computador") {
        if(gameMode!=="modo-jogador-vs-computador"){
            await notify(parseInt(row),parseInt(col));
        }
        board[row][col] = currentPlayerColor;
        cell.classList.add(`${currentPlayerColor}-piece`);
        if (currentPlayerColor === 'black') {
            pieceCounts.black++;
        } else {
            pieceCounts.white++;
        }
        if(gameMode==="modo-jogador-vs-computador") switchPlayer();
        updateLabels();
        if (pieceCounts.black === maxPieceCount && pieceCounts.white === maxPieceCount) {
            isPlacementPhase = false;
            isMovementPhase = true;
            setMessageContainer('Todas as peças foram colocadas! - Fase de Movimentação');
        }
    } else {
        console.log("currentPlayerColor " + currentPlayerColor);
        console.log ("pieceCounts.black " + pieceCounts.black);
        console.log("maxPieceCount " + maxPieceCount);
    }
}

async function movePiece(row, col, cell) {
    switch (true) {
        case !isMovementPhase:
            return;
        case cell.classList.contains(`${getOppositeColor(currentPlayerColor)}-piece`):
            alert('Movimento proibido. Por favor, seleciona uma das suas peças.');
            break;
        case cell.classList.contains(`${currentPlayerColor}-piece`):
            await selectPiece(row, col, cell);
            break;
        case selectedPiece && canMovePiece(row, col):
            await moveSelectedPiece(row, col, cell);
            break;
        default:
            alert('Movimento proibido. Por favor, seleciona uma das células com a cor verde.');
    }
}

async function removePiece(row, col, color) {
    const cell = document.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
    if(cell.classList.contains(`removable-piece`)) {
        if(gameMode!=="modo-jogador-vs-computador"){
            await notify(parseInt(row),parseInt(col));
        }
        cell.classList.remove(`${color}-piece`);
        board[row][col] = "empty";
        isRemovePiecePhase = false;
        pieceRemoved[color] += 1;
        clearHighlightedRemovablePieces();
        if(gameMode==="modo-jogador-vs-computador" && isGameOver()) {
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
                if (board[row][col]==="empty" && isAdjacentToPieceOfColor(row, col, playerColor)) {
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

async function selectPiece(row, col, cell) {
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

async function moveSelectedPiece(row, col, cell) {
    board[row][col] = currentPlayerColor;
    board[selectedPiece.row][selectedPiece.col] = "empty";
    const selectedCell = document.querySelector('.cell.selected');
    selectedCell.classList.remove('selected', `${currentPlayerColor.toLowerCase()}-piece`);
    cell.classList.add(`${currentPlayerColor.toLowerCase()}-piece`);
    previousMove[currentPlayerColor] = { row: selectedPiece.row, col: selectedPiece.col };
    if(gameMode!=="modo-jogador-vs-computador") {
        await notify(parseInt(selectedPiece.row),parseInt(selectedPiece.col));
        await notify(parseInt(row),parseInt(col));
    }
    selectedPiece = null;
    if (hasXInARowOrColumn(row, col, 3)) {
        isRemovePiecePhase = true;
        highlightRemovablePieces(getOppositeColor(currentPlayerColor));
    } else {
        if(gameMode==="modo-jogador-vs-computador") switchPlayer();
    }
    clearHighlightedEmptyAdjacent();
    updateLabels();
}

function getOppositeColor(color) {
    return color === 'black' ? 'white' : 'black';
}

function switchPlayer() {
    if(gameMode==="modo-jogador-vs-computador"){
        currentPlayerColor = getOppositeColor(currentPlayerColor);
    }
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
            await placePiece(row, col, cell);
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
                await selectPiece(row, col, cell);
                const availableMoves = boardElement.querySelectorAll('.cell.empty-adjacent');
                await new Promise(r => setTimeout(r, 300));

                if (availableMoves.length > 0) {
                    const randomIndex = Math.floor(Math.random() * availableMoves.length);
                    const randomCell = availableMoves[randomIndex];
                    const { row, col } = randomCell.dataset;
                    await moveSelectedPiece(row, col, randomCell);

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
            await removePiece(row, col, getOppositeColor(currentPlayerColor));
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
            if (cell==="empty") {
                emptyCells.push({ row: rowIndex, col: colIndex });
            }
        });
    });
    return emptyCells;
}

async function cellClick(event) {
    const cell = event.target;
    if (cell.id === 'board' || cell.classList.contains('selected') || currentPlayerColor === computerColor && gameMode === "modo-jogador-vs-computador") {
        return;
    } else if(turn!==nick && gameMode!=="modo-jogador-vs-computador"){
        console.log(gameMode);
        alert("Not your turn to play.");
        return;
    }
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    switch (true) {
        case isRemovePiecePhase:
            await removePiece(row, col, getOppositeColor(initialPlayerColor));
            break;
        case isPlacementPhase:
            await placePiece(row, col, cell);
            break;
        case isMovementPhase:
            await movePiece(row, col, cell);
            break;
        default:
            break;
    }
    if (currentPlayerColor === computerColor && gameMode === "modo-jogador-vs-computador") {
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
    board[row][col] = "empty";
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
        if (board[newRow][newCol]!=="empty" || hasThreeInRowOrColumn(newRow, newCol)) {
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