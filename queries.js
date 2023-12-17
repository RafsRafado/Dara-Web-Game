const SERVER = "http://twserver.alunos.dcc.fc.up.pt:8008/";
//const SERVER = "http://localhost:8008/";
const group = 25;
let game;
let nick;
let password;
let sizes =[[6,5],[5,6],[6,6],[7,6]];

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

    if (!response["error"]) {
        console.log("Registration successful");
        return true;
    } else {
        console.error("Register failed: ", response);
        return false;
    }
}

async function lookForGame() {
    let size = sizes[document.getElementById("tamanho-tabuleiro").selectedIndex];
    let rowsInput = size[0];
    let colsInput = size[1];
    let response_json = await callServer("join", {group, nick, password, "size":{"rows":rowsInput,"columns":colsInput}});
    if ("game" in response_json) {
        game = response_json.game;
        console.log("Joined game with ID:" + game);
        changeScreen('.menu-container','.waiting-page');
        await update();
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
});

function insertRowInClassification(player){
    const tableBody = document.getElementById('classificacoes-tbody');
    const row = tableBody.insertRow();
    const playerName = row.insertCell(0);
    const gameNumber = row.insertCell(1);
    const victoryNumber = row.insertCell(2);
    const winRate = row.insertCell(3);

    playerName.textContent = player["nick"];
    gameNumber.textContent = player["games"];
    victoryNumber.textContent = player["victories"];
    winRate.textContent = ((player["victories"]/player["games"])*100).toFixed(2).toString() + "%";
}

function clearClassifications() {
    const tableBody = document.getElementById('classificacoes-tbody');
    tableBody.innerHTML = '';
}

async function ranking(){
    let rowsC,colsC;
    let size = sizes[document.getElementById("tamanho-tabuleiro-classif").selectedIndex];
    rowsC = size[0];
    colsC = size[1];
    if(document.getElementById("modo-jogo-classif").selectedIndex === 0) {
        let response_json = await callServer("ranking", {group, "size": {"rows":rowsC,"columns":colsC}});
        if (!("error" in response_json)){
            console.log("Successfuly received the ranking table");
            clearClassifications();
            response_json["ranking"].forEach(row => insertRowInClassification(row));
        }
        else{
            console.log("Ranking error. Response:");
            console.log(response_json);
        }
    } else {
        let gameResults = JSON.parse(localStorage.getItem('gameResults')) || [];
        let filteredResults = gameResults.filter(result => result.rows === rowsC && result.cols === colsC);
        filteredResults.sort((a, b) => b.victories - a.victories || b.games - a.games);
        clearClassifications();
        filteredResults.forEach(row => insertRowInClassification(row));
    }
}



async function update() {
    const url = `${SERVER}update?nick=${encodeURIComponent(nick)}&game=${encodeURIComponent(game)}`;
    let data;
    try {
        const eventSource = new EventSource(url);

        eventSource.onmessage = function(message) {
            console.log("Received update from the server: " + message["data"]);
            data = JSON.parse(message["data"]);

            if (data["winner"]) {
                console.log(`The game ended and the player ${data["winner"]} won`);
                handleGameOver(data["winner"]);
                document.getElementById('forfeit-button').style.display='none';
                document.getElementById('back-button').style.display='block';
                eventSource.close();
            } else if(data["board"]) {
                updateGameStatus(data);
            }
        };

        eventSource.onerror = function(err) {
            console.log(err);
            eventSource.close();
        };
    } catch (error) {
        console.error("An error occurred in the update:", error);
    }
}

function updateGameStatus(data) {
    if(document.querySelector('.game').style.display==='none'){
        changeScreen('.waiting-page','.game');
        startGameFromAPI(data);
        board = data["board"];
        currentPlayerColor=data["players"][nick];
        initialPlayerColor=currentPlayerColor;
    } else{
        updateGameFromAPI(data);
    }
}

async function notifyServer(row, column){
    return await callServer("notify", {nick, password, game, "move": {"row": row, "column": column}});
}
