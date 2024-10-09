document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('token'); // Corrigi o nome para 'token'
    if (authToken) {
        // Se houver um token, redireciona para a página principal
        window.location.href = 'programa.html';
    }
});

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita o envio tradicional do formulário

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Envia uma requisição POST para o endpoint de login
    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password }) // Corrigi para 'senha' como era antes
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Armazena o token no localStorage para ser usado em outras requisições
            localStorage.setItem('token', data.token);
            window.location.href = 'programa.html'; // Redireciona para a página principal do programa
        } else if (data.error) {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => console.error('Erro:', error));
});
