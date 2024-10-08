const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT;


dotenv.config();

const app = express();
const { exec } = require('child_process');
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

const userSchema = new mongoose.Schema({
    nomeDaEmpresa: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    senha: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);


function runCameraScript() {
    exec('python camera/camera.py', (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar o script: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Erro: ${stderr}`);
            return;
        }
        console.log(`Saída do script Python: ${stdout}`);
    });
}

// Executa o script Python assim que o servidor é iniciado
runCameraScript();

function authenticateToken(req, res, next) {
    const token = req.header('auth-token');
    if (!token) return res.status(401).json({ error: 'Acesso negado' });
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET || 'secretkey');
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido' });
    }
}



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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Construcao = mongoose.model('Construcao', construcaoSchema);

// Endpoint para obter todas as construções
app.get('/construcoes', authenticateToken, async (req, res) => {
    try {
        const construcoes = await Construcao.find({ userId: req.user._id });
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
app.post('/construcoes', authenticateToken, async (req, res) => {
    const novaConstrucao = req.body;
    novaConstrucao.userId = req.user._id; // Associa a construção ao usuário logado
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

app.post('/register', async (req, res) => {
    const { nomeDaEmpresa, email, senha } = req.body;
    try {
        // Verificar se o email já está em uso
        const emailExistente = await User.findOne({ email });
        if (emailExistente) {
            return res.status(400).json({ error: 'E-mail já cadastrado.' });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, 10);

        // Criar novo usuário
        const user = new User({
            nomeDaEmpresa,
            email,
            senha: hashedPassword,
        });
        await user.save();
        res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
});

app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    try {
        // Encontrar usuário pelo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'E-mail ou senha incorretos' });
        }

        // Comparar a senha
        const validPassword = await bcrypt.compare(senha, user.senha);
        if (!validPassword) {
            return res.status(400).json({ error: 'E-mail ou senha incorretos' });
        }

        // Criar e atribuir um token
        const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET || 'secretkey', { expiresIn: '1h' });
        res.header('auth-token', token).json({ message: 'Logado com sucesso', token });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});



// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
