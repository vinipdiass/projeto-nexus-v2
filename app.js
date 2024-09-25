// Variável para controlar se o usuário pode adicionar um marcador
var adicionarMarcador = false;

// Inicializando o mapa
var map = L.map('map').setView([-15.793889, -47.882778], 4); // Coordenadas aproximadas do Brasil

// Adicionando o tile layer do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Função para carregar construções do arquivo JSON
function carregarConstrucoes() {
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(construcao => {
                var marker = L.marker([construcao.latitude, construcao.longitude]).addTo(map);
                marker.bindPopup(`<b>${construcao.nome}</b><br>Clique para ver o estoque.`).on('click', function() {
                    abrirEstoque(construcao);
                });
            });
        })
        .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));
}

// Chamar a função para carregar as construções ao iniciar
carregarConstrucoes();

// Evento de clique no botão "Posicionar Marcador"
document.getElementById('posicionarMarcador').addEventListener('click', function() {
    adicionarMarcador = true;
    this.disabled = true; // Desabilitar o botão enquanto o marcador não é colocado
});

// Função para adicionar um marcador no mapa ao clicar (apenas se adicionarMarcador for true)
function onMapClick(e) {
    if (adicionarMarcador) {
        var nomeConstrucao = prompt('Digite o nome da construção:');
        if (nomeConstrucao) {
            var novaConstrucao = {
                id: Date.now(),
                nome: nomeConstrucao,
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                estoque: [
                    { item: 'Item Exemplo', quantidade: 100 }
                ]
            };

            // Adicionar a nova construção ao mapa
            var marker = L.marker(e.latlng).addTo(map);
            marker.bindPopup(`<b>${novaConstrucao.nome}</b><br>Clique para ver o estoque.`).on('click', function() {
                abrirEstoque(novaConstrucao);
            });

            // Opcional: Salvar a nova construção no arquivo JSON (necessário backend)
            alert('Nova construção adicionada! (Observação: Para salvar permanentemente, é necessário um backend)');

            // Resetar a variável e habilitar o botão
            adicionarMarcador = false;
            document.getElementById('posicionarMarcador').disabled = false;
        } else {
            alert('Construção não adicionada. Nome é obrigatório.');
            adicionarMarcador = false;
            document.getElementById('posicionarMarcador').disabled = false;
        }
    }
}

map.on('click', onMapClick);

// Função para abrir a janela de estoque
function abrirEstoque(construcao) {
    var estoqueWindow = window.open('', '', 'width=400,height=400');
    estoqueWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>Estoque da Construção</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                button { margin-top: 20px; padding: 10px 20px; }
            </style>
        </head>
        <body>
            <h2>${construcao.nome}</h2>
            <table id="estoqueTable">
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                </tr>
            </table>
            <button onclick="adicionarItem()">Adicionar Item</button>

            <script>
                // Dados do estoque da construção
                var estoque = ${JSON.stringify(construcao.estoque)};

                function carregarEstoque() {
                    var table = document.getElementById('estoqueTable');
                    for(var i = 0; i < estoque.length; i++) {
                        var row = table.insertRow();
                        var cellItem = row.insertCell(0);
                        var cellQuantidade = row.insertCell(1);
                        cellItem.innerHTML = estoque[i].item;
                        cellQuantidade.innerHTML = estoque[i].quantidade;
                    }
                }

                function adicionarItem() {
                    var item = prompt('Digite o nome do item:');
                    var quantidade = prompt('Digite a quantidade:');
                    if(item && quantidade) {
                        estoque.push({ item: item, quantidade: quantidade });
                        var table = document.getElementById('estoqueTable');
                        var row = table.insertRow();
                        var cellItem = row.insertCell(0);
                        var cellQuantidade = row.insertCell(1);
                        cellItem.innerHTML = item;
                        cellQuantidade.innerHTML = quantidade;
                    }
                }

                // Carregar o estoque ao abrir a janela
                carregarEstoque();
            </script>
        </body>
        </html>
    `);
}
