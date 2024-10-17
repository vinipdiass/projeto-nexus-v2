// Variável para controlar se o usuário pode adicionar um marcador
var adicionarMarcador = false;

// Inicializando o mapa com uma visualização padrão
var map = L.map("map", {
  worldCopyJump: true,
  minZoom: 3,
  maxZoom: 18,
}).setView([-15.793889, -47.882778], 4); // Coordenadas aproximadas do Brasil

// Ícone do marcador
var iconePersonalizado = L.icon({
  iconUrl: "assets/map-marker2.png",
  iconSize: [50, 50],
  iconAnchor: [23, 50],
  popupAnchor: [0, -38],
});

// Adicionando o tile layer do OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

document.addEventListener('DOMContentLoaded', () => {
  const authToken = localStorage.getItem('token');
  console.log('Token encontrado:', authToken);

  if (!authToken) {
    alert('Token de autenticação não encontrado. Faça login novamente.');
    window.location.href = '/login.html';
    return;
  }

  // Requisição para obter a imagem do usuário
  fetch('/getUserImage', {
    method: 'GET',
    headers: {
      'token': authToken
    }
  })
    .then(response => {
      if (response.ok) {
        console.log('Imagem encontrada.');
        return response.blob();
      } else {
        throw new Error('Erro ao carregar a imagem do usuário.');
      }
    })
    .then(blob => {
      const imageUrl = URL.createObjectURL(blob);
      const avatarImg = document.getElementById('userAvatar');
      avatarImg.src = imageUrl;
      console.log('Imagem carregada com sucesso.');
    })
    .catch(error => {
      console.error('Erro ao carregar a imagem do usuário:', error);
    });
});

// Função para alterar o cursor para o ícone do marcador
function ativarCursorDeMarcador() {
  map.getContainer().style.cursor = `url('assets/map-cursor.png') 19 0, auto`;
}

function logout() {
  // Remove o token do localStorage
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

// Função para restaurar o cursor normal
function desativarCursorDeMarcador() {
  map.getContainer().style.cursor = "";
}

// Variáveis globais para o Autocomplete
var autocomplete;
var placeSelecionado;

function adicionarConstrucaoPorEndereco() {
  // Obter referências aos elementos do modal
  var modal = document.getElementById("modal-construcao");
  var spanFechar = document.getElementById("fechar-modal-construcao");
  var btnAdicionar = document.getElementById("adicionar-construcao");
  var btnCancelar = document.getElementById("cancelar-construcao");
  var inputEndereco = document.getElementById("endereco-input");
  var inputNome = document.getElementById("nome-input");

  // Limpar os campos de entrada
  inputEndereco.value = "";
  inputNome.value = "";
  placeSelecionado = null;

  // Exibir o modal
  modal.style.display = "block";

  // Inicializar o Autocomplete
  autocomplete = new google.maps.places.Autocomplete(inputEndereco, {
    types: ['geocode'],
    componentRestrictions: { country: 'br' } // Restringe ao Brasil
  });

  // Listener para quando um lugar é selecionado
  autocomplete.addListener('place_changed', function () {
    placeSelecionado = autocomplete.getPlace();
  });

  // Função para fechar o modal e remover o autocomplete
  function fecharModal() {
    modal.style.display = "none";
    google.maps.event.clearInstanceListeners(inputEndereco);
    autocomplete = null;
  }

  // Handler do evento de adicionar construção
  function onAdicionarClick() {
    var nomeConstrucao = inputNome.value.trim();

    if (!placeSelecionado) {
      alert("Por favor, selecione um endereço da lista de sugestões.");
      return;
    }

    if (nomeConstrucao) {
      // Fechar o modal
      fecharModal();

      var latitude = placeSelecionado.geometry.location.lat();
      var longitude = placeSelecionado.geometry.location.lng();

      var novaConstrucao = {
        id: Date.now(),
        nome: nomeConstrucao,
        latitude: latitude,
        longitude: longitude,
        estoque: [{ item: "Tijolo", quantidade: 100 }],
      };

      // Enviar a nova construção para o backend
      fetch("/construcoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "token": localStorage.getItem('token'),
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
          window.location.reload();

          // Imprimir o endereço completo no console
          console.log("Endereço da construção posicionada:", placeSelecionado.formatted_address);

        })
        .catch((error) =>
          console.error("Erro ao adicionar a construção:", error)
        );
    } else {
      alert("Por favor, preencha o nome da construção.");
    }
  }

  // Adicionar event listeners
  btnAdicionar.addEventListener("click", onAdicionarClick);
  btnCancelar.addEventListener("click", fecharModal);
  spanFechar.addEventListener("click", fecharModal);
  window.addEventListener("click", (event) => {
    if (event.target == modal) {
      fecharModal();
    }
  });
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
      adicionarConstrucaoPorEndereco();
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
// Função para carregar construções do backend e ajustar o zoom
function carregarConstrucoes() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'index.html';
  }
  fetch("/construcoes", {
    headers: {
      'token': token
    }
  })
    .then((response) => response.json())
    .then((data) => {
      var bounds = new L.LatLngBounds();
      data.forEach((construcao) => {
        var lat = construcao.latitude;
        var lon = construcao.longitude;
        var nomeConstrucao = construcao.nome;

        // Criar um tooltip interativo e permanente
        var tooltip = L.tooltip({
          direction: 'top',
          permanent: true,
          interactive: true, // Isso torna o tooltip clicável
          noWrap: true,
          offset: [0, -50], // Posição do tooltip
          opacity: 0.9,
        })
        .setContent(`<b>${nomeConstrucao}</b><br>Clique para ver o estoque`)
        .setLatLng(new L.LatLng(lat, lon))
        .addTo(map); // Adiciona o tooltip diretamente ao mapa

        // Evento de clique no tooltip
        tooltip.on('click', function() {
          abrirEstoque(construcao.id); // Abrir o estoque da construção
        });

        // Também adicionar um marcador, se necessário
        var marker = L.marker([lat, lon], {
          icon: iconePersonalizado,
        }).addTo(map);

        // Evento de clique no marcador também abre o estoque
        marker.on('click', function() {
          abrirEstoque(construcao.id); // Abrir o estoque da construção
        });

        // Adicionar as coordenadas do marcador ao bounds
        bounds.extend([lat, lon]);
      });

      if (data.length > 0) {
        map.fitBounds(bounds); // Ajusta o zoom do mapa para caber todas as construções
      }
    })
    .catch((error) => console.error("Erro ao carregar as construções:", error));
}

// Função para abrir o estoque da construção em uma nova página
function abrirEstoque(construcaoId) {
  var url = `estoque.html?id=${construcaoId}`;
  window.location.href = url;
}


// Chamar a função para carregar as construções ao iniciar
carregarConstrucoes();

// Função para abrir o estoque da construção em uma nova página
function abrirEstoque(construcao) {
  var url = `estoque.html?id=${construcao.id}`;
  window.location.href = url;
}
