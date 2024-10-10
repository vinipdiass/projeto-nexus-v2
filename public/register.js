document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Previne o envio tradicional
    const nomeDaEmpresa = document.getElementById('nomeDaEmpresa').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;

    // Envia uma requisição POST para /register
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeDaEmpresa, email, senha })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Registro realizado com sucesso!');
            window.location.href = 'index.html'; // Redireciona para a página de login
        } else if (data.error) {
            alert('Erro: ' + data.error);
        }
    })
    .catch(error => console.error('Erro:', error));
});
