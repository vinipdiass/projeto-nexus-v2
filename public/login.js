document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('token'); // Usando 'token' como padrão
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
    fetch('/login', { // Use a URL relativa se o backend estiver no mesmo servidor
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: password }) // Certifique-se de que o backend está esperando o campo 'senha'
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            console.log('Token recebido:', data.token);
            // Armazena o token no localStorage para ser usado em outras requisições
            
            localStorage.setItem('token', data.token); // Usando 'token' como padrão
            window.location.href = 'programa.html'; // Redireciona para a página principal do programa
        } else if (data.error) {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => console.error('Erro:', error));
});
