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

