require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');

const db = require('./src/db/connection');
const authRoutes = require('./src/routes/authRoutes');
const clienteRoutes = require('./src/routes/clienteRoutes');
const produtoRoutes = require('./src/routes/produtoRoutes');
const pedidoRoutes = require('./src/routes/pedidoRoutes');
const { isAuthenticated } = require('./src/middlewares/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do template engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configuração de sessão
app.use(session({
    name: process.env.SESSION_NAME || 'ecommerce_session',
    secret: process.env.SESSION_SECRET || 'default_secret_key_change_this',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Coloque true se estiver usando HTTPS
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

// Middleware para disponibilizar dados do usuário em todas as views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.session.success_msg || null;
    res.locals.error_msg = req.session.error_msg || null;
    res.locals.error = req.session.error || null;
    
    // Limpar mensagens após uso
    req.session.success_msg = null;
    req.session.error_msg = null;
    req.session.error = null;
    
    next();
});

// Rotas públicas
app.use('/', authRoutes);
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// Rotas protegidas (requerem autenticação)
app.use('/clientes', isAuthenticated, clienteRoutes);
app.use('/produtos', isAuthenticated, produtoRoutes);
app.use('/pedidos', isAuthenticated, pedidoRoutes);
app.use('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { 
        title: 'Dashboard - E-commerce',
        user: req.session.user
    });
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
        }
        res.redirect('/login');
    });
});

// Middleware para rotas não encontradas
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Página não encontrada',
        message: 'A página que você procura não existe.',
        error: { status: 404 }
    });
});

// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).render('error', {
        title: 'Erro no servidor',
        message: err.message || 'Ocorreu um erro interno no servidor.',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Iniciar servidor
async function startServer() {
    try {
        await db.connect();
        console.log('Banco de dados conectado');
        
        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
