function startGameFromAPI(response) {
    initGameFromAPI(response.board);
}

function initGameFromAPI(boardData) {
    const rows = boardData.length;
    const cols = boardData[0].length;
    document.getElementById('back-button').style.display='none';
    document.getElementById('reset-button').style.display='none';
    document.getElementById('forfeit-button').style.display='block';
    clearBoard();

    createBoard(rows, cols);

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

function clearBoard() {
    const boardElement = document.getElementById('board');
    while (boardElement.firstChild) {
        boardElement.removeChild(boardElement.firstChild);
    }

    pieceCounts = { black: 0, white: 0 };
    pieceRemoved = { black: 0, white: 0 };
    previousMove = { black: { row: -1, col: -1 }, white: { row: -1, col: -1 } };
    selectedPiece = null;
    winner = null;

    document.getElementById('message-container').style.display = 'none';

    boardElement.style.gridTemplateColumns = '';
    boardElement.style.gridTemplateRows = '';

    updateLabels();
}

function updateLabels() {
    const blackCountLabel = document.getElementById('black-count');
    const whiteCountLabel = document.getElementById('white-count');
    blackCountLabel.textContent = '0';
    whiteCountLabel.textContent = '0';
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
    boardElement.addEventListener('click', playTurnFromAPI);
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
    if (data.board) {
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

    if (data.phase) {
        updateGamePhase(data.phase);
    }

    if (data.turn) {
        updatePlayerTurn(data.turn);
    }
    if (data.winner) {
        handleGameOver(data.winner);
    }
}

function updateGamePhase(phase) {
    isPlacementPhase = (phase === 'placement');
    isMovementPhase = (phase === 'movement');
    isRemovePiecePhase = (phase === 'remove');
}

function updatePlayerTurn(turn) {
    currentPlayerColor = turn;
    const messageLabel = document.getElementById('message');
    messageLabel.textContent = `Turno do jogador ${turn}`;
}

function handleGameOver(winner) {
    alert(`Game Over! Winner: ${winner}`);
}


async function playTurnFromAPI(event) {
    const cell = event.target;
    if (cell.id === 'board' || cell.classList.contains('selected') || currentPlayerColor === computerColor && gameMode === "jogador-vs-computador") {
        return;
    }
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    try {
        const response = await notify(row, col);

        if (response.error) {
            console.error('Erro ao realizar jogada: ', response.error);
        } else {
            console.log('Jogada realizada com sucesso.');
        }
    } catch (error) {
        console.error('Erro ao tentar enviar a jogada para a API: ', error);
    }
}

