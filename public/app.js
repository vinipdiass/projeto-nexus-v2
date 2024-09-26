// Variável para controlar se o usuário pode adicionar um marcador
var adicionarMarcador = false;

// Inicializando o mapa com uma visualização padrão
var map = L.map("map", {
  //worldCoypyJump: true permite que o mapa seja copiado e repetido várias vezes
  worldCopyJump: true,
  minZoom: 3,
  maxZoom: 18,
}).setView([-15.793889, -47.882778], 4); // Coordenadas aproximadas do Brasil

// Ícone do marcador
var iconePersonalizado = L.icon({
  iconUrl: "assets/map-marker2.png", // Certifique-se de que o caminho para sua imagem está correto
  iconSize: [50, 50],
  iconAnchor: [23, 50],
  popupAnchor: [0, -38],
});

// Adicionando o tile layer do OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Função para alterar o cursor para o ícone do marcador
function ativarCursorDeMarcador() {
  // Altera o estilo do cursor do mapa
  map.getContainer().style.cursor = `url('assets/map-cursor.png') 19 0, auto`;
}

// Função para restaurar o cursor normal
function desativarCursorDeMarcador() {
  // Volta o cursor ao estilo padrão
  map.getContainer().style.cursor = "";
}

// Função para adicionar o botão personalizado ao mapa
L.Control.PosicionarConstrucao = L.Control.extend({
  onAdd: function (map) {
    var btn = L.DomUtil.create("button", "btn-posicionar-construcao"); // Criar um botão
    btn.innerHTML = `<img src="assets/map-marker2.png" alt="Posicionar Construção" style="width: 30px; height: 30px;" />`; // Colocar a imagem dentro do botão
    btn.title = "Posicionar Construção";
    btn.style.background = "white"; // Definir um fundo branco para o botão
    btn.style.border = "2px solid #ccc";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.padding = "5px"; // Adicionar padding ao redor da imagem

    // Evitar a propagação do clique para o mapa
    L.DomEvent.disableClickPropagation(btn);

    // Adiciona o evento de clique no botão
    L.DomEvent.on(btn, "click", function (e) {
      adicionarMarcador = true;
      ativarCursorDeMarcador(); // Ativar o cursor de marcador
    });

    return btn;
  },

  onRemove: function (map) {
    // Nada a fazer ao remover o botão
  },
});

// Adiciona o controle ao mapa, posicionando-o como os botões de zoom
L.control.posicionarConstrucao = function (opts) {
  return new L.Control.PosicionarConstrucao(opts);
};

// Adicionar o botão ao mapa no canto superior esquerdo
L.control.posicionarConstrucao({ position: "topleft" }).addTo(map);

// Função para carregar construções do backend e ajustar o zoom
function carregarConstrucoes() {
  fetch("http://localhost:3000/construcoes")
    .then((response) => response.json())
    .then((data) => {
      var bounds = new L.LatLngBounds();
      data.forEach((construcao) => {
        var marker = L.marker([construcao.latitude, construcao.longitude], {
          icon: iconePersonalizado,
        }).addTo(map);

        // Usando bindTooltip para mostrar o nome da construção permanentemente
        marker.bindTooltip(
          `<b>${construcao.nome}</b><br>Clique para ver o estoque.`,
          {
            permanent: true, // A tooltip ficará visível permanentemente
            direction: "top", // A tooltip aparecerá acima do marcador
            className: "custom-tooltip", // Adicionando uma classe customizada, se necessário
            offset: [0, -60],
          }
        );

        marker.on("click", function () {
          abrirEstoque(construcao); // Abrir o estoque ao clicar no marcador
        });

        // Adicionar as coordenadas do marcador ao bounds
        bounds.extend([construcao.latitude, construcao.longitude]);

        // Evento para remover o marcador ao clicar com o botão direito
        marker.on("contextmenu", function () {
          if (confirm("Deseja remover esta construção?")) {
            // Remover do mapa
            map.removeLayer(marker);

            // Remover do backend
            fetch(`http://localhost:3000/construcoes/${construcao.id}`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            })
              .then((response) => response.json())
              .then((data) => {
                alert("Construção removida com sucesso.");
              })
              .catch((error) =>
                console.error("Erro ao remover a construção:", error)
              );
          }
        });
      });

      if (data.length > 0) {
        map.fitBounds(bounds);
      }
    })
    .catch((error) => console.error("Erro ao carregar as construções:", error));
}

// Chamar a função para carregar as construções ao iniciar
carregarConstrucoes();

// Função para abrir o estoque da construção em uma nova página
function abrirEstoque(construcao) {
  // Abrir a página 'estoque.html' passando o ID da construção via query string
  var url = `estoque.html?id=${construcao.id}`;
  window.open(url, "_blank", "width=400,height=500");
}

// Função para adicionar um marcador no mapa ao clicar (apenas se adicionarMarcador for true)
function onMapClick(e) {
  if (adicionarMarcador) {
    var nomeConstrucao = prompt("Digite o nome da construção:");
    if (nomeConstrucao) {
      var novaConstrucao = {
        id: Date.now(),
        nome: nomeConstrucao,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        estoque: [{ item: "Item Exemplo", quantidade: 100 }],
      };

      // Enviar a nova construção para o backend
      fetch("http://localhost:3000/construcoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novaConstrucao),
      })
        .then((response) => response.json())
        .then((data) => {
          // Adicionar a nova construção ao mapa
          var marker = L.marker([data.latitude, data.longitude], {
            icon: iconePersonalizado,
          }).addTo(map);

          // Mostrar o nome da construção permanentemente com a tooltip
          marker.bindTooltip(
            `<b>${data.nome}</b><br>Clique para ver o estoque.`,
            {
              permanent: true,
              direction: "top",
              className: "custom-tooltip",
            }
          );

          marker.on("click", function () {
            abrirEstoque(data); // Abrir o estoque ao clicar no marcador
          });

          alert("Nova construção adicionada!");
        })
        .catch((error) =>
          console.error("Erro ao adicionar a construção:", error)
        );

      adicionarMarcador = false;
      desativarCursorDeMarcador(); // Voltar para o cursor padrão
    } else {
      alert("Construção não adicionada. Nome é obrigatório.");
      adicionarMarcador = false;
      desativarCursorDeMarcador(); // Voltar para o cursor padrão
    }
  }
}

map.on("click", onMapClick);
