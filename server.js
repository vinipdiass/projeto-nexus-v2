const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');
const bodyParser = require('body-parser');

// Configurações
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Caminho para o arquivo data.json
const dataFilePath = './data.json';

// Endpoint para obter todas as construções
app.get('/construcoes', (req, res) => {
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Erro ao ler o arquivo de dados.');
        } else {
            res.send(JSON.parse(data));
        }
    });
});

// Endpoint para obter uma construção por ID
app.get('/construcoes/:id', (req, res) => {
    const construcaoId = req.params.id; // Manter como string
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo de dados:', err);
            res.status(500).send('Erro ao ler o arquivo de dados.');
        } else {
            const construcoes = JSON.parse(data);
            const construcao = construcoes.find(c => c.id.toString() === construcaoId);
            if (construcao) {
                res.send(construcao);
            } else {
                res.status(404).send('Construção não encontrada.');
            }
        }
    });
});



// Endpoint para adicionar uma nova construção
app.post('/construcoes', (req, res) => {
    const novaConstrucao = req.body;
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Erro ao ler o arquivo de dados.');
        } else {
            const construcoes = JSON.parse(data);
            construcoes.push(novaConstrucao);
            fs.writeFile(dataFilePath, JSON.stringify(construcoes, null, 2), err => {
                if (err) {
                    res.status(500).send('Erro ao salvar os dados.');
                } else {
                    res.send(novaConstrucao);
                }
            });
        }
    });
});

// Endpoint para atualizar o estoque de uma construção
app.put('/construcoes/:id/estoque', (req, res) => {
    const construcaoId = req.params.id; // Manter como string
    const novoEstoque = req.body;
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo de dados:', err);
            res.status(500).send('Erro ao ler o arquivo de dados.');
        } else {
            let construcoes = JSON.parse(data);
            let construcao = construcoes.find(c => c.id.toString() === construcaoId);
            if (construcao) {
                construcao.estoque = novoEstoque;
                fs.writeFile(dataFilePath, JSON.stringify(construcoes, null, 2), err => {
                    if (err) {
                        console.error('Erro ao salvar os dados:', err);
                        res.status(500).send('Erro ao salvar os dados.');
                    } else {
                        res.send(construcao);
                    }
                });
            } else {
                res.status(404).send('Construção não encontrada.');
            }
        }
    });
});



// Endpoint para remover uma construção pelo ID
app.delete('/construcoes/:id', (req, res) => {
    const construcaoId = req.params.id; // Manter como string
    fs.readFile(dataFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao ler o arquivo de dados:', err);
            res.status(500).send('Erro ao ler o arquivo de dados.');
        } else {
            let construcoes = JSON.parse(data);
            const index = construcoes.findIndex(c => c.id.toString() === construcaoId);
            if (index !== -1) {
                construcoes.splice(index, 1);
                fs.writeFile(dataFilePath, JSON.stringify(construcoes, null, 2), err => {
                    if (err) {
                        console.error('Erro ao salvar os dados:', err);
                        res.status(500).send('Erro ao salvar os dados.');
                    } else {
                        res.send({ message: 'Construção removida com sucesso.' });
                    }
                });
            } else {
                res.status(404).send('Construção não encontrada.');
            }
        }
    });
});


// Iniciando o servidor
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
