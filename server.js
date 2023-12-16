const httpLib = require('http');

let corsConfig = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Expire': 10  // Time in seconds
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

function handleUserRegistration(request, response) {
    let receivedData = '';
    request.on('data', chunk => {
        receivedData += chunk;
    }).on('end', () => {
        try {
            // Parse the received data as JSON
            const userData = JSON.parse(receivedData);
            const username = userData.username;
            const password = userData.password;

            // Perform registration logic
            if (username in userAccounts) {
                // User already exists, handle accordingly
                if (userAccounts[username] !== password) {
                    // Existing user but password mismatch
                    sendErrorResponse(response, "User exists with a different password");
                } else {
                    // User re-registering with the same password
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


// Create HTTP server
const server = httpLib.createServer((request, response) => {
    if(request.method==='OPTIONS') {
        response.writeHead(200, corsConfig);
        response.end();
    } else if (request.method === 'POST' && request.url === '/register') {
        handleUserRegistration(request, response);
    }
});

server.listen(8008);
