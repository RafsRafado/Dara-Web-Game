const rulesContent = {
    allSections: [
        {
            title: "Tabuleiro e peças",
            content: [
                "O Dara joga-se num tabuleiro 6 linhas x 5 colunas",
                "Outras dimensões são possíveis, como 6 x 6",
                "Cada um dos 2 jogadores tem 12 peças",
                "Um jogador joga com peças pretas, outro com peças brancas",
                "Todas as peças (22) estão sempre visíveis, no tabuleiro ou fora",
                "Peças fora do tabuleiro são agrupadas por cor, de cada lado",
            ],
        },
        {
            title: "Regras básicas",
            content: [
                "Jogadores escolhem uma cor e decidem quem joga primeiro",
                "Inicialmente o tabuleiro está vazio",
                "O jogo tem 2 fases:",
                "Fase 1 - Pôr as peças (drop)",
                "Fase 2 - Mover as peças (move)",
            ],
        },
        {
            title: "Em linha",
            content: [
                "São consideradas em linha:",
                "sequências de 3 ou mais peças contíguas:",
                "na horizontal ou vertical (não na diagonal)",
                "todas da mesma cor",
            ],
        },
        {
            title: "Pôr as peças",
            content: [
                "Jogadores põem alternadamente uma peça sua numa casa livre",
                "Não podem podem ser postas mais de 3 peças em linha",
                "Podem existir 3 peças em linha (mas não é vantajoso)",
            ],
        },
        {
            title: "Mover as peças",
            content: [
                "Cada jogador move alternadamente uma peça da sua cor",
                "Uma peça só pode ser movida para uma casa contígua",
                "Peças movidas apenas na horizontal ou vertical (não na diagonal)",
                "Uma linha de tamanho 3 permite capturar peça do adversário",
                "Neste caso, remove uma peça do adversário à sua escolha",
                "Só uma peça é removida por jogada (mesmo sendo formadas várias linhas)",
                "Não podem ser formadas linhas com mais de 3 peças",
                "Uma peça não pode retornar à posição da jogada anterior",
                "Só poderá retornar a essa casa nas jogadas seguintes",
            ],
        },
        {
            title: "Fim do jogo",
            content: [
                "O jogo termina quando um jogador não puder ganhar",
                "Por exemplo, se tiver apenas 2 peças no tabuleiro",
                "O jogador que não pode ganhar perde o jogo",
            ],
        },
    ],
};

document.getElementById('instrucoes-header').textContent = 'Instruções';

const instrucoesList = document.getElementById('instrucoes-content');
for (const section of rulesContent.allSections) {
    const sectionTitle = document.createElement('h3');
    sectionTitle.textContent = section.title;
    instrucoesList.appendChild(sectionTitle);

    const sectionContentList = document.createElement('ul');
    for (const item of section.content) {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        sectionContentList.appendChild(listItem);
    }

    instrucoesList.appendChild(sectionContentList);
}
