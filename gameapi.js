let turn;
function startGameFromAPI(response) {
    initGameFromAPI(response.board);
}

function initGameFromAPI(boardData) {
    const rows = boardData.length;
    const cols = boardData[0].length;
    document.getElementById('back-button').style.display = 'none';
    document.getElementById('reset-button').style.display = 'none';
    document.getElementById('forfeit-button').style.display = 'block';
    clearBoard();

    createBoard(rows, cols,playTurnFromAPI);

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

    pieceCounts = {black: 0, white: 0};
    pieceRemoved = {black: 0, white: 0};
    previousMove = {black: {row: -1, col: -1}, white: {row: -1, col: -1}};
    selectedPiece = null;
    winner = null;

    document.getElementById('message-container').style.display = 'none';

    boardElement.style.gridTemplateColumns = '';
    boardElement.style.gridTemplateRows = '';

    updateLabels();
    board = [];
    for (let row = 0; row < rows; row++) {
        board[row] = [];
        for (let col = 0; col < cols; col++) {
            board[row][col] = null;
        }
    }
}

function updateLabels() {
    const blackCountLabel = document.getElementById('black-count');
    const whiteCountLabel = document.getElementById('white-count');
    blackCountLabel.textContent = '0';
    whiteCountLabel.textContent = '0';
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
    currentPlayerColor=data.players[nick]
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
    if (data.winner) {
        handleGameOver(data.winner);
    }
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
    if(turn===nick){
        try {
            let response;
            if(isPlacementPhase){
                if(placePiece(row,col,cell)) response = await notify(row, col);
                else return;
            } else if(isRemovePiecePhase){
                removePiece(row,col,board[row][col]);
                response = await notify(row, col);
            }
            else if(isMovementPhase){
                movePiece(row,col,cell);
                response = await notify(row, col);
            } else return;

            if (response.error) {
                console.error('Erro ao realizar jogada: ', response.error);
            } else {
                console.log('Jogada realizada com sucesso.');
            }
        } catch (error) {
            console.error('Erro ao tentar enviar a jogada para a API: ', error);
        }
    } else{
        alert("Not your turn to play.")
    }
}

