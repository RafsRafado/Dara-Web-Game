const SERVER = "http://twserver.alunos.dcc.fc.up.pt:8008/";
const group = 25;
let game = 0;
let nick;
let password;

function getInputValue(id) {
    return document.getElementById(id).value;
}

async function callServer(endpoint, data) {
    console.log(endpoint, data);
    try {
        const response = await fetch(`${SERVER}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (error) {
        console.error("Error calling server: ", error);
    }
}

async function registerUser() {
    nick = getInputValue("username");
    password = getInputValue("password");
    const response = await callServer("register", { nick, password });

    if (!response.error) {
        console.log("Registration successful");
        return true;
    } else {
        console.error("Register failed: ", response);
        return false;
    }
}

async function lookForGame() {
    let rowsInput = parseInt(document.getElementById('linhas-tabuleiro').value);
    let colsInput = parseInt(document.getElementById('colunas-tabuleiro').value);
    let response_json = await callServer("join", {group, nick, password, "size":{"rows":rowsInput,"columns":colsInput}});
    if ("game" in response_json) {
        console.log("Sucessfuly joined a game with ID: "+ response_json.game);
        game = response_json.game;
        changeScreen('.menu-container','.waiting-page');
        await update();
    }
    else{
        console.log("Join failed. Response:");
        console.log(response_json);
    }
}

async function leaveGame() {
    let response_json = await callServer("leave", {group, nick, password, game});
    console.log(response_json);
}

const cancelWaiting = document.getElementById('cancel-waiting');
cancelWaiting.addEventListener('click',async function () {
    await leaveGame();
    changeScreen('.waiting-page','.menu-container');
})

async function update() {
    const url = `${SERVER}update?nick=${encodeURIComponent(nick)}&game=${encodeURIComponent(game)}`;
    let data;
    try {
        const eventSource = new EventSource(url);

        eventSource.onmessage = function(message) {
            console.log("Successfully received an update from the server with data: " + message.data);
            data = JSON.parse(message.data);

            if (data.winner) {
                console.log(`The game has ended and player ${data.winner} won`);
                handleGameOver(data.winner);
                document.getElementById('forfeit-button').style.display='none';
                document.getElementById('back-button').style.display='block';
                eventSource.close();
            } else if(data.board) {
                updateGameStatus(data);
            }
        };

        eventSource.onerror = function(err) {
            console.error("EventSource failed:", err);
            eventSource.close();
        };
    } catch (error) {
        console.error("An error occurred in the update function:", error);
    }
}

function updateGameStatus(data) {
    if(document.querySelector('.game').style.display==='none'){
        changeScreen('.waiting-page','.game');
        startGameFromAPI(data);
        board = data.board;
        currentPlayerColor=data.players[nick];
    } else{
        updateGameFromAPI(data);
    }
}


async function notify(row, column){
    return await callServer("notify", {nick, password, game, "move": {"row": row, "column": column}});
}
