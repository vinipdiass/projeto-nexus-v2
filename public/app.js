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

// Função para adicionar uma construção com base em um endereço
function adicionarConstrucaoPorEndereco() {
  // Obter referências aos elementos do modal
  var modal = document.getElementById("modal-construcao");
  var spanFechar = document.getElementById("fechar-modal-construcao");
  var btnAdicionar = document.getElementById("adicionar-construcao");
  var btnCancelar = document.getElementById("cancelar-construcao");
  var inputCidade = document.getElementById("cidade-input");
  var inputBairro = document.getElementById("bairro-input");
  var inputRua = document.getElementById("rua-input");
  var inputNumero = document.getElementById("numero-input");
  var inputNome = document.getElementById("nome-input");

  // Limpar os campos de entrada
  inputCidade.value = "";
  inputBairro.value = "";
  inputRua.value = "";
  inputNumero.value = "";
  inputNome.value = "";

  // Exibir o modal
  modal.style.display = "block";

  // Função para fechar o modal
  function fecharModal() {
    modal.style.display = "none";
    // Remover event listeners para evitar duplicação
    btnAdicionar.removeEventListener("click", onAdicionarClick);
    btnCancelar.removeEventListener("click", onCancelarClick);
    spanFechar.removeEventListener("click", onFecharClick);
    window.removeEventListener("click", onWindowClick);
  }

  // Handlers dos eventos
  function onAdicionarClick() {
    var cidade = inputCidade.value.trim();
    var bairro = inputBairro.value.trim();
    var rua = inputRua.value.trim();
    var numero = inputNumero.value.trim();
    var nomeConstrucao = inputNome.value.trim();

    document.addEventListener('DOMContentLoaded', () => {
      fetch('/run-camera')
          .then(response => {
              if (response.ok) {
                  return response.text();
              } else {
                  throw new Error('Erro ao chamar o script Python');
              }
          })
          .then(data => {
              console.log(data);
          })
          .catch(error => {
              console.error('Erro:', error);
          });
  });

    // Verificar se todos os campos foram preenchidos
    if (cidade && bairro && rua && numero && nomeConstrucao) {
      // Fechar o modal
      fecharModal();

      // Concatenar os campos em uma única string de endereço
      var endereco = `${rua}, ${numero}, ${bairro}, ${cidade}`;

      // Fazer a requisição à API Nominatim para obter as coordenadas
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco)}&format=json`)
        .then((response) => response.json())
        .then((data) => {
          if (data.length > 0) {
            // Pegando as coordenadas do primeiro resultado
            var latitude = parseFloat(data[0].lat);
            var longitude = parseFloat(data[0].lon);

            var novaConstrucao = {
              id: Date.now(),
              nome: nomeConstrucao,
              latitude: latitude,
              longitude: longitude,
              estoque: [{ item: "Tijolo", quantidade: 100 }],
            };

            // Enviar a nova construção para o backend
            fetch("http://localhost:3000/construcoes", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "auth-token": localStorage.getItem('token'),
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
          } else {
            alert("Endereço não encontrado. Tente novamente.");
          }
        })
        .catch((error) => console.error("Erro ao buscar coordenadas:", error));
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  }

  function onCancelarClick() {
    fecharModal();
  }

  function onFecharClick() {
    fecharModal();
  }

  function onWindowClick(event) {
    if (event.target == modal) {
      fecharModal();
    }
  }

  // Adicionar event listeners
  btnAdicionar.addEventListener("click", onAdicionarClick);
  btnCancelar.addEventListener("click", onCancelarClick);
  spanFechar.addEventListener("click", onFecharClick);
  window.addEventListener("click", onWindowClick);
}



// Adicionar evento ao botão para ativar a função adicionar construção por endereço
L.Control.PosicionarConstrucao = L.Control.extend({
  onAdd: function (map) {
    var btn = L.DomUtil.create("button", "btn-posicionar-construcao");
    btn.innerHTML = `<img src="assets/map-marker2.png" alt="Posicionar Construção" style="width: 30px; height: 30px;" />`;
    btn.title = "Posicionar Construção";
    btn.style.background = "white";
    btn.style.border = "2px solid #ccc";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.padding = "5px";

    L.DomEvent.disableClickPropagation(btn);

    L.DomEvent.on(btn, "click", function (e) {
      adicionarConstrucaoPorEndereco(); // Chama a função que solicita o endereço e adiciona a construção
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
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'index.html';
  }
  fetch("http://localhost:3000/construcoes", {
    headers: {
        'auth-token': token
    }
  })
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
  window.open(url, "_blank");
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
