const httpLib = require('http');
const crypto = require('crypto');

let corsConfig = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Expire': 100
};

let userAccounts = {};

function sendErrorResponse(response, message) {
    response.writeHead(400,corsConfig);
    response.end(JSON.stringify({ error: message }));
}

function sendSuccessResponse(response, data) {
    response.writeHead(200,corsConfig);
    response.end(JSON.stringify(data));
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
            const username = userData.username;
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

            const gameId = generateGameId(groupId);

            sendSuccessResponse(response, { game: gameId });
        } catch (error) {
            console.error(error);
            sendErrorResponse(response, "Invalid join request format");
        }
    });
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


            sendSuccessResponse(response, { message: "Left game successfully" });
        } catch (error) {
            console.error(error);
            sendErrorResponse(response, "Invalid leave request format");
        }
    });
}

const server = httpLib.createServer((request, response) => {
    if(request.method==='OPTIONS') {
        response.writeHead(200, corsConfig);
        response.end();
    } else if (request.method === 'POST' && request.url === '/register') handleUserRegistration(request, response);
      else if (request.method === 'POST' && request.url === '/join') handleGameJoin(request,response);
      else if (request.method === 'POST' && request.url === '/leave') handleGameLeave(request,response);
});

server.listen(8008);
