// Função para mostrar/ocultar o dropdown do perfil
function toggleDropdown() {
    document.getElementById("profileDropdown").classList.toggle("show");
}

// Fechar o dropdown se o usuário clicar fora dele
window.onclick = function(event) {
    if (!event.target.matches('.avatar')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// Adicionar o evento de clique ao avatar para mostrar o dropdown
document.querySelector('.avatar').addEventListener('click', toggleDropdown);
