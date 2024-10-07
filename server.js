const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Configurações
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Conectando ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conectado ao MongoDB');
}).catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
});

// Definindo o modelo de construção
const construcaoSchema = new mongoose.Schema({
    id: Number,
    nome: String,
    latitude: Number,
    longitude: Number,
    estoque: [
        {
            item: String,
            quantidade: Number,
        },
    ],
});

const Construcao = mongoose.model('Construcao', construcaoSchema);

// Endpoint para obter todas as construções
app.get('/construcoes', async (req, res) => {
    try {
        const construcoes = await Construcao.find();
        res.send(construcoes);
    } catch (error) {
        res.status(500).send('Erro ao obter as construções.');
    }
});

// Endpoint para obter uma construção por ID
app.get('/construcoes/:id', async (req, res) => {
    const construcaoId = req.params.id;
    try {
        const construcao = await Construcao.findOne({ id: construcaoId });
        if (construcao) {
            res.send(construcao);
        } else {
            res.status(404).send('Construção não encontrada.');
        }
    } catch (error) {
        res.status(500).send('Erro ao obter a construção.');
    }
});

// Endpoint para adicionar uma nova construção
app.post('/construcoes', async (req, res) => {
    const novaConstrucao = req.body;
    try {
        const construcao = new Construcao(novaConstrucao);
        await construcao.save();
        res.send(construcao);
    } catch (error) {
        res.status(500).send('Erro ao salvar a construção.');
    }
});

// Endpoint para atualizar o estoque de uma construção
app.put('/construcoes/:id/estoque', async (req, res) => {
    const construcaoId = req.params.id;
    const novoEstoque = req.body;
    try {
        const construcao = await Construcao.findOneAndUpdate(
            { id: construcaoId },
            { $set: { estoque: novoEstoque } },
            { new: true }
        );
        if (construcao) {
            res.send(construcao);
        } else {
            res.status(404).send('Construção não encontrada.');
        }
    } catch (error) {
        res.status(500).send('Erro ao atualizar o estoque.');
    }
});

// Endpoint para remover uma construção pelo ID
app.delete('/construcoes/:id', async (req, res) => {
    const construcaoId = req.params.id;
    try {
        const construcao = await Construcao.findOneAndDelete({ id: construcaoId });
        if (construcao) {
            res.send({ message: 'Construção removida com sucesso.' });
        } else {
            res.status(404).send('Construção não encontrada.');
        }
    } catch (error) {
        res.status(500).send('Erro ao remover a construção.');
    }
});

// Iniciando o servidor
app.listen(3000, () => {
    console.log('Servidor rodando em http://localhost:3000');
});
