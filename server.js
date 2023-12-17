const httpLib = require('http');
const crypto = require('crypto');

class GameSession {
    constructor(rows, columns, gameId) {
        this.gameId = gameId;
        this.board = Array.from({length: rows}, () => new Array(columns).fill('empty'));
        this.players = {};
        this.phase = 'drop';
        this.step = 'from';
        this.turn = null;
        this.rows = rows;
        this.cols = columns;
        this.clients = [];
    }

    addClient(client) {
        this.clients.push(client);
        client.on('close', () => {
            this.clients = this.clients.filter(c => c !== client);
        });
    }

    notifyClients(data) {
        this.clients.forEach(client => {
            client.write(`data: ${JSON.stringify(data)}\n\n`);
        });
    }
    isGameReady() {
        return Object.keys(this.players).length === 2;
    }

    addPlayer(username, color) {
        if (!this.players[username]) {
            this.players[username] = color;
            if (this.isGameReady()) {
                this.turn = Object.keys(this.players)[0]; // First player to join starts
            }
        }
    }

    getGameState() {
        return {
            board: this.board, phase: this.phase, step: this.step, turn: this.turn, players: this.players
        };
    }
}

let playerStats = {};

function getStatsKey(group, rows, columns) {
    return `${group}-${rows}-${columns}`;
}

function updatePlayerStats(winner, players, group, rows, columns) {
    const key = getStatsKey(group, rows, columns);

    if (!playerStats[key]) {
        playerStats[key] = {};
    }

    players.forEach(player => {
        if (!playerStats[key][player]) {
            playerStats[key][player] = { games: 0, victories: 0 };
        }
        playerStats[key][player].games += 1;
        if (player === winner) {
            playerStats[key][player].victories += 1;
        }
    });
}


let corsConfig = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Expire': 100
};

let userAccounts = {};
let gameSessions = {};

function sendSuccessResponse(response, data) {
    if (response.writableEnded) {
        console.error('Attempted to send a response, but the response has already ended.');
        return;
    }
    response.writeHead(200, corsConfig);
    response.end(JSON.stringify(data));
}

function sendErrorResponse(response, message) {
    if (response.writableEnded) {
        console.error('Attempted to send an error response, but the response has already ended.');
        return;
    }
    response.writeHead(400, corsConfig);
    response.end(JSON.stringify({ error: message }));
}


function hashValue(value) {
    return crypto.createHash('md5').update(value).digest('hex');
}

function generateGameId(gameData) {
    const timestamp = new Date().toISOString();
    const gameIdentifier = `${gameData}-${timestamp}`;
    return hashValue(gameIdentifier);
}

function handleUserRegistration(request, response) {
    let receivedData = '';
    request.on('data', chunk => {
        receivedData += chunk;
    }).on('end', () => {
        try {
            const userData = JSON.parse(receivedData);
            const username = userData.nick;
            const password = userData.password;

            if (username in userAccounts) {
                if (userAccounts[username] !== password) {
                    sendErrorResponse(response, "User exists with a different password");
                } else {
                    sendSuccessResponse(response, {});
                }
            } else {
                userAccounts[username] = password;
                sendSuccessResponse(response, {});
            }
        } catch (error) {
            console.error(error);
            sendErrorResponse(response, "Invalid data format");
        }
    });
}

function deleteGameSession(gameId) {
    if (gameSessions.hasOwnProperty(gameId)) {
        delete gameSessions[gameId];
        console.log(`Game session with ID ${gameId} has been deleted.`);
    } else {
        console.log(`No game session found with ID ${gameId}.`);
    }
}

function handleGameJoin(request, response) {
    let requestData = '';
    request.on('data', chunk => {
        requestData += chunk;
    }).on('end', () => {
        try {
            const joinData = JSON.parse(requestData);
            const username = joinData.nick;
            const password = joinData.password;
            const groupId = joinData.group;
            const rows = joinData.size.rows;
            const columns = joinData.size.columns;

            if (username in userAccounts) {
                if (userAccounts[username] !== password) {
                    sendErrorResponse(response, "User exists with a different password");
                } else {
                    let gameSession = findGameSession(rows, columns);

                    if (!gameSession) {
                        const gameId = generateGameId(groupId);
                        gameSession = new GameSession(rows, columns, gameId);
                        gameSessions[gameId] = gameSession;
                        gameSession.addPlayer(username, 'white');
                    }else gameSession.addPlayer(username, 'black');
                    sendSuccessResponse(response, {"game": gameSession.gameId});
                }
            } else {
                sendErrorResponse(response, "User not registered");
            }
        } catch (error) {
            console.error(error);
            sendErrorResponse(response, "Invalid join request format");
        }
    });
}


function handleRanking(request, response) {
    let requestData = '';
    request.on('data', chunk => {
        requestData += chunk;
    }).on('end', () => {
        try {
            const { group, size } = JSON.parse(requestData);
            if (group === undefined) {
                sendErrorResponse(response, "Undefined group");
                return;
            }
            if (typeof group !== 'number') {
                sendErrorResponse(response, `Invalid group '${group}'`);
                return;
            }
            if (!size || size.rows === undefined || size.columns === undefined) {
                sendErrorResponse(response, "Invalid size");
                return;
            }
            if (typeof size.rows !== 'number' || typeof size.columns !== 'number') {
                sendErrorResponse(response, `Invalid size '${JSON.stringify(size)}'`);
                return;
            }

            const key = getStatsKey(group, size.rows, size.columns);
            const rankings = Object.keys(playerStats[key] || {}).map(nick => {
                return { nick, ...playerStats[key][nick] };
            });

            rankings.sort((a, b) => b.victories - a.victories || b.games - a.games);
            sendSuccessResponse(response, { ranking: rankings.slice(0, 10) });
        } catch (error) {
            console.error(error);
            sendErrorResponse(response, "Invalid request format");
        }
    });
}




function findGameSession(rows, columns) {
    for (let gameId in gameSessions) {
        let session = gameSessions[gameId];
        if (session.rows === rows && session.cols === columns && !session.isGameReady()) {
            return session;
        }
    }
    return null;
}


function handleNotify(request, response) {
    let requestData = '';
    request.on('data', chunk => {
        requestData += chunk;
    }).on('end', () => {
        try {
            const { nick, password, game, move } = JSON.parse(requestData);

            if (!nick || !password || !game || !move) {
                sendErrorResponse(response, "Missing required fields");
                return;
            }

            if (!(nick in userAccounts) || userAccounts[nick] !== password) {
                sendErrorResponse(response, "Invalid user or password");
                return;
            }

            const gameSession = gameSessions[game];
            if (!gameSession) {
                sendErrorResponse(response, "Invalid game ID");
                return;
            }

            if (gameSession.turn !== nick) {
                sendErrorResponse(response, "Not your turn");
                return;
            }

            const moveResult = processMove(gameSession, move);
            if (!moveResult.valid) {
                sendErrorResponse(response, moveResult.message);
                return;
            }

            updateGameState(gameSession, move);
            gameSession.notifyClients(gameSession.getGameState());
            sendSuccessResponse(response, { message: "Move processed" });
        } catch (error) {
            console.error(error);
            sendErrorResponse(response, "Invalid request format");
        }
    });
}

function processMove(gameSession, move) {
    const { row, column } = move;
    if (gameSession.board[row][column] !== 'empty') {
        return { valid: false, message: "Cell is already occupied" };
    }
    return { valid: true, message: "Valid move" };
}

function updateGameState(gameSession, move) {
    const { row, column } = move;

    gameSession.board[row][column] = gameSession.players[gameSession.turn];

    const players = Object.keys(gameSession.players);
    gameSession.turn = players.find(player => player !== gameSession.turn);
}


function handleGameLeave(request, response) {
    let receivedData = '';
    request.on('data', chunk => {
        receivedData += chunk;
    }).on('end', () => {
        try {
            const leaveData = JSON.parse(receivedData);
            const username = leaveData.nick;
            const password = leaveData.password;
            const gameId = leaveData.game;

            if (!(username in userAccounts) || userAccounts[username] !== password) {
                sendErrorResponse(response, "Invalid user or password");
                return;
            }

            const gameSession = gameSessions[gameId];
            if (!gameSession) {
                sendErrorResponse(response, "Invalid game ID");
                return;
            }

            let winner = null;
            if (gameSession.isGameReady()) {
                winner = Object.keys(gameSession.players).find(player => player !== username);
            }

            gameSession.notifyClients({ winner: winner });

            deleteGameSession(gameId);

            sendSuccessResponse(response, { message: winner ? "Opponent won" : "Left the game without a winner" });
        } catch (error) {
            console.error(error);
            sendErrorResponse(response, "Invalid leave request format");
        }
    });
}


function handleGameUpdate(request, response) {
    const urlParts = new URL(request.url, `http://${request.headers.host}`);
    const queryParams = urlParts.searchParams;

    const game = queryParams.get('game');
    const nick = queryParams.get('nick');

    if (!game || !nick) {
        response.writeHead(400, corsConfig);
        response.end("Invalid request");
        return;
    }

    const gameSession = gameSessions[game];
    if (!gameSession) {
        response.writeHead(404, corsConfig);
        response.end("Game session not found");
        return;
    }
    gameSession.addClient(response);

    response.writeHead(200, {
        ...corsConfig,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    const sendUpdate = (data) => {
        response.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const updateInterval = setInterval(() => {
        if (gameSession.isGameReady()) {
            sendUpdate(gameSession.getGameState());
            clearInterval(updateInterval);
        }
    }, 10);

    request.on('close', () => {
        clearInterval(updateInterval);
        deleteGameSession(game);
    });
}


function getRankingTable(request, response) {
    sendSuccessResponse(response, {message: "Ranking Table :)"});
}

const server = httpLib.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
        response.writeHead(200, corsConfig);
        response.end();
    } else if (request.method === 'POST' && request.url === '/register') {
        handleUserRegistration(request, response);
    } else if (request.method === 'POST' && request.url === '/join') {
        handleGameJoin(request, response);
    } else if (request.method === 'POST' && request.url === '/leave') {
        handleGameLeave(request, response);
    } else if (request.method === 'POST' && request.url === '/ranking') {
        getRankingTable(request, response);
    }if (request.method === 'POST' && request.url === '/notify'){
      handleNotify(request,response);
    } else if (request.method === 'GET' && request.url.startsWith('/update')) {
        handleGameUpdate(request, response);
    } else if (request.method === 'POST' && request.url === '/ranking') {
        handleRanking(request, response);
    }
});

server.listen(8008);
