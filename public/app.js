// Variável para controlar se o usuário pode adicionar um marcador
var adicionarMarcador = false;

// Inicializando o mapa
var map = L.map('map').setView([-15.793889, -47.882778], 4); // Coordenadas aproximadas do Brasil

// Ícone do marcador
var iconePersonalizado = L.icon({
    iconUrl: 'assets/map-marker2.png', // Certifique-se de que o caminho para sua imagem está correto
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

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
                var marker = L.marker([construcao.latitude, construcao.longitude], { icon: iconePersonalizado }).addTo(map);
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

// Chamar a função para carregar as construções ao iniciar
carregarConstrucoes();

// Evento de clique no botão "Posicionar Construção"
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
                var marker = L.marker([data.latitude, data.longitude], { icon: iconePersonalizado }).addTo(map);
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

// Função para abrir a janela de estoque
function abrirEstoque(construcao) {
    var estoqueWindow = window.open('estoque.html?id=' + construcao.id, '', 'width=400,height=500');
}
