// Variável para controlar se o usuário pode adicionar um marcador
var adicionarMarcador = false;

// Inicializando o mapa com uma visualização padrão
var map = L.map('map').setView([-15.793889, -47.882778], 4); // Coordenadas aproximadas do Brasil

// Ícone do marcador
var iconePersonalizado = L.icon({
    iconUrl: 'assets/map-marker.png', // Certifique-se de que o caminho para sua imagem está correto
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
});

// Adicionando o tile layer do OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Função para adicionar o botão personalizado ao mapa
L.Control.PosicionarConstrucao = L.Control.extend({
    onAdd: function(map) {
        var btn = L.DomUtil.create('button', 'btn-posicionar-construcao'); // Criar um botão
        btn.innerHTML = `<img src="assets/map-marker.png" alt="Posicionar Construção" style="width: 30px; height: 30px;" />`; // Colocar a imagem dentro do botão
        btn.title = "Posicionar Construção";
        btn.style.background = "white"; // Definir um fundo branco para o botão
        btn.style.border = "2px solid #ccc";
        btn.style.borderRadius = "5px";
        btn.style.cursor = "pointer";
        btn.style.padding = "5px"; // Adicionar padding ao redor da imagem

        // Evitar a propagação do clique para o mapa
        L.DomEvent.disableClickPropagation(btn);

        // Adiciona o evento de clique no botão
        L.DomEvent.on(btn, 'click', function(e) {
            adicionarMarcador = true;
            alert('Clique no mapa para posicionar a construção.');
        });

        return btn;
    },

    onRemove: function(map) {
        // Nothing to do here
    }
});

// Adiciona o controle ao mapa, posicionando-o como os botões de zoom
L.control.posicionarConstrucao = function(opts) {
    return new L.Control.PosicionarConstrucao(opts);
}

// Adicionar o botão ao mapa no canto superior esquerdo
L.control.posicionarConstrucao({ position: 'topleft' }).addTo(map);

// Função para carregar construções do backend e ajustar o zoom
function carregarConstrucoes() {
    fetch('http://localhost:3000/construcoes')
        .then(response => response.json())
        .then(data => {
            var bounds = new L.LatLngBounds();
            data.forEach(construcao => {
                var marker = L.marker([construcao.latitude, construcao.longitude], { icon: iconePersonalizado }).addTo(map);
                marker.bindPopup(`<b>${construcao.nome}</b><br>Clique para ver o estoque.`).on('click', function() {
                    abrirEstoque(construcao);
                });

                // Adicionar as coordenadas do marcador ao bounds
                bounds.extend([construcao.latitude, construcao.longitude]);

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

            if (data.length > 0) {
                map.fitBounds(bounds);
            }
        })
        .catch(error => console.error('Erro ao carregar as construções:', error));
}

// Chamar a função para carregar as construções ao iniciar
carregarConstrucoes();

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

            adicionarMarcador = false;
        } else {
            alert('Construção não adicionada. Nome é obrigatório.');
            adicionarMarcador = false;
        }
    }
}

map.on('click', onMapClick);
