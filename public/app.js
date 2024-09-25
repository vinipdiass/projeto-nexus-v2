// Variável para controlar se o usuário pode adicionar um marcador
var adicionarMarcador = false;

// Inicializando o mapa
var map = L.map('map').setView([-15.793889, -47.882778], 4); // Coordenadas aproximadas do Brasil

// Adicionando o tile layer do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Função para carregar construções do backend
function carregarConstrucoes() {
    fetch('http://localhost:3000/construcoes')
        .then(response => response.json())
        .then(data => {
            data.forEach(construcao => {
                var marker = L.marker([construcao.latitude, construcao.longitude]).addTo(map);
                marker.bindPopup(`<b>${construcao.nome}</b><br>Clique para ver o estoque.`).on('click', function() {
                    abrirEstoque(construcao);
                });
            });
        })
        .catch(error => console.error('Erro ao carregar as construções:', error));
}

// Chamar a função para carregar as construções ao iniciar
carregarConstrucoes();

// Evento de clique no botão "Posicionar Construcao"
document.getElementById('posicionarConstrucao').addEventListener('click', function() {
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

            // Enviar a nova construção para o backend
            fetch('http://localhost:3000/construcoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novaConstrucao)
            })
            .then(response => response.json())
            .then(data => {
                // Adicionar a nova construção ao mapa
                var marker = L.marker([data.latitude, data.longitude]).addTo(map);
                marker.bindPopup(`<b>${data.nome}</b><br>Clique para ver o estoque.`).on('click', function() {
                    abrirEstoque(data);
                });

                alert('Nova construção adicionada!');
            })
            .catch(error => console.error('Erro ao adicionar a construção:', error));

            // Resetar a variável e habilitar o botão
            adicionarMarcador = false;
            document.getElementById('posicionarConstrucao').disabled = false;
        } else {
            alert('Construção não adicionada. Nome é obrigatório.');
            adicionarMarcador = false;
            document.getElementById('posicionarConstrucao').disabled = false;
        }
    }
}

map.on('click', onMapClick);

// Função para carregar construções do backend
function carregarConstrucoes() {
    fetch('http://localhost:3000/construcoes')
        .then(response => response.json())
        .then(data => {
            data.forEach(construcao => {
                var marker = L.marker([construcao.latitude, construcao.longitude]).addTo(map);
                marker.bindPopup(`<b>${construcao.nome}</b><br>Clique para ver o estoque.`).on('click', function() {
                    abrirEstoque(construcao);
                });

                // Evento para remover o marcador ao clicar com o botão direito
                marker.on('contextmenu', function() {
                    if (confirm('Deseja remover esta construção?')) {
                        // Remover do mapa
                        map.removeLayer(marker);

                        // Remover do backend
                        fetch('http://localhost:3000/construcoes/' + construcao.id, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            alert('Construção removida com sucesso.');
                        })
                        .catch(error => console.error('Erro ao remover a construção:', error));
                    }
                });
            });
        })
        .catch(error => console.error('Erro ao carregar as construções:', error));
}


// Função para abrir a janela de estoque

function abrirEstoque(construcao) {
    var estoqueWindow = window.open('', '', 'width=400,height=500');
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
                .btn-remover { background-color: red; color: white; cursor: pointer; margin-left: 10px; }
            </style>
        </head>
        <body>
            <h2>${construcao.nome}</h2>
            <table id="estoqueTable">
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Ação</th>
                </tr>
            </table>
            <button onclick="adicionarItem()">Adicionar Item</button>

            <script>
                // Dados do estoque da construção
                var estoque = ${JSON.stringify(construcao.estoque)};
                var construcaoId = ${construcao.id};

                function carregarEstoque() {
                    var table = document.getElementById('estoqueTable');
                    estoque.forEach((item, index) => {
                        var row = table.insertRow();
                        var cellItem = row.insertCell(0);
                        var cellQuantidade = row.insertCell(1);
                        var cellAcao = row.insertCell(2);
                        cellItem.innerHTML = item.item;
                        cellQuantidade.innerHTML = item.quantidade;
                        cellAcao.innerHTML = '<button class="btn-remover" onclick="removerItem(' + index + ')">Remover Item</button>';
                    });
                }

                function adicionarItem() {
                    var item = prompt('Digite o nome do item:');
                    var quantidade = prompt('Digite a quantidade:');
                    if(item && quantidade) {
                        estoque.push({ item: item, quantidade: quantidade });
                        atualizarEstoque();
                    }
                }

                function removerItem(index) {
                    if (confirm('Deseja remover este item?')) {
                        estoque.splice(index, 1);
                        atualizarEstoque();
                    }
                }

                function atualizarEstoque() {
                    var table = document.getElementById('estoqueTable');
                    table.innerHTML = '<tr><th>Item</th><th>Quantidade</th><th>Ação</th></tr>';
                    estoque.forEach((item, index) => {
                        var row = table.insertRow();
                        var cellItem = row.insertCell(0);
                        var cellQuantidade = row.insertCell(1);
                        var cellAcao = row.insertCell(2);
                        cellItem.innerHTML = item.item;
                        cellQuantidade.innerHTML = item.quantidade;
                        cellAcao.innerHTML = '<button class="btn-remover" onclick="removerItem(' + index + ')">Remover Item</button>';
                    });

                    // Atualizar o estoque no backend
                    fetch('http://localhost:3000/construcoes/' + construcaoId + '/estoque', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(estoque)
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Estoque atualizado:', data);
                    })
                    .catch(error => console.error('Erro ao atualizar o estoque:', error));
                }

                // Carregar o estoque ao abrir a janela
                carregarEstoque();
            </script>
        </body>
        </html>
    `);
}

