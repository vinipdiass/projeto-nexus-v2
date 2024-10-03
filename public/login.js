document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Evita o envio tradicional
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Validação simples (substitua pela lógica real de validação)
    if(email === 'admin@exemplo.com' && password === '1234') {
        window.location.href = 'programa.html'; // Redireciona para programa.html
    } else {
        alert('E-mail ou senha incorretos!');
    }
});
