console.log('esqueciSenha.js carregado');
document.getElementById('esqueciSenhaForm').addEventListener('submit', function(e) {
    console.log('Formulário submetido');
    e.preventDefault(); // Prevent the default form submission behavior

    const email = document.getElementById('email').value;

    // Make a POST request to the backend endpoint
    fetch('http://localhost:3000/esqueci-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert(data.message); // Success message
            window.location.href = 'index.html'; // Redirect to the login page
        } else {
            alert('Erro ao solicitar recuperação de senha.');
        }
    })
    .catch(error => {
        console.error('Erro ao solicitar recuperação de senha:', error);
        alert('Erro ao solicitar recuperação de senha.');
    });
});
