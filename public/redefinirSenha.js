document.getElementById('redefinirSenhaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const novaSenha = document.getElementById('password').value;
    const confirmarSenha = document.getElementById('confirmPassword').value;

    if (novaSenha !== confirmarSenha) {
        alert('As senhas não coincidem!');
        return;
    }

    fetch('http://localhost:3000/redefinir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, novaSenha })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        window.location.href = 'index.html';
    })
    .catch(error => {
        console.error('Erro ao redefinir senha:', error);
        alert('Erro ao redefinir senha');
    });
});
