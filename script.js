const verClassificacoesButton = document.getElementById('open-classificacoes');
verClassificacoesButton.addEventListener('click', async function () {
    await ranking();
    document.querySelector(".overlay-classificacoes").style.display = "block";
    document.body.style.overflow = 'hidden';
});

const fecharClassificacoesButton = document.getElementById('fechar-classificacoes');
fecharClassificacoesButton.addEventListener('click', function () {
    document.querySelector(".overlay-classificacoes").style.display = "none";
    document.body.style.overflow = "auto";
});

const verInstrucoesButton = document.getElementById('open-instrucoes');
verInstrucoesButton.addEventListener('click', function () {
    document.querySelector(".overlay-instrucoes").style.display = "block";
    document.body.style.overflow = 'hidden'; 
});


const fecharInstrucoesButton = document.getElementById('close-instrucoes');
fecharInstrucoesButton.addEventListener('click', function () {
    document.querySelector(".overlay-instrucoes").style.display = "none";
    document.body.style.overflow = "auto";
});

const verConfiguracoesButton = document.getElementById('open-configuracoes');
verConfiguracoesButton.addEventListener('click', function () {
    document.querySelector(".overlay-configuracoes").style.display = "block";
    document.body.style.overflow = 'hidden'; 
});

const applySettingButton = document.getElementById('apply-settings');
applySettingButton.addEventListener('click', function () {
    initGame();
    document.querySelector(".overlay-configuracoes").style.display = "none";
    document.body.style.overflow = "auto";
});


const fecharConfiguracoesButton = document.getElementById('close-configuracoes');
fecharConfiguracoesButton.addEventListener('click', function () {
    document.querySelector(".overlay-configuracoes").style.display = "none";
    document.body.style.overflow = "auto";
});


const fecharMensagemButton = document.getElementById('fechar-mensagem');
fecharMensagemButton.addEventListener('click', function () {
    const mensagemVitoria = document.getElementById('mensagem-vitoria');
    mensagemVitoria.style.display = 'none';
});

document.getElementById('login-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const isAuthenticated = await checkCredentials(username, password);

    if (isAuthenticated) {
        document.getElementById('welcome-text').textContent = 'Welcome ' + username + '!';
        changeScreen('.login-container','.menu-container');
        clearLoginDetails();
    } else {
        alert('Invalid username or password. Please try again.');
    }
});

const startGameButton = document.getElementById('start-game');
startGameButton.addEventListener('click', async function () {
    if(modoJogoSelect.value==="modo-jogador-vs-computador") {
        initGame();
        changeScreen('.menu-container','.game');
    } else await lookForGame();
});

const forfeitButton = document.getElementById('forfeit-button');
forfeitButton.addEventListener('click', async function () {
    const confirmQuit = confirm("Confirmar desistência");
    if (confirmQuit) {
        await leaveGame();
        changeScreen('.game','.menu-container');
    }
});

const backButton = document.getElementById('back-button');
backButton.addEventListener('click',function () {
    changeScreen('.game','.menu-container');
});


const modoJogoSelect = document.getElementById('modo-jogo');
modoJogoSelect.addEventListener('change', toggleGameMode);

const logOutButton = document.getElementById('logout');
logOutButton.addEventListener('click',function(){changeScreen('.menu-container','.login-container')});


function checkCredentials() {
    return registerUser();
}

function changeScreen(from,to){
    document.querySelector(from).style.display = 'none';
    document.querySelector(to).style.display = 'block';
}

function toggleGameMode(){
    if (modoJogoSelect.value === "modo-jogador-vs-computador") {
        document.getElementById("hidePvP").style.display = 'block';
    } else {
        document.getElementById("hidePvP").style.display = 'none';
    }
}

function clearLoginDetails(){
    document.getElementById("username").value="";
    document.getElementById("password").value="";
}