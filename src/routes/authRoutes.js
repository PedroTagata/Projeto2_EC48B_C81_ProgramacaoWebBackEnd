const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');
const { redirectIfAuthenticated } = require('../middlewares/auth');

// Página de login
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('auth/login', { 
        title: 'Login - E-commerce',
        error_msg: req.session.error_msg,
        success_msg: req.session.success_msg
    });
});

// Processar login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            req.session.error_msg = 'Email e senha são obrigatórios';
            return res.redirect('/login');
        }
        
        const clienteModel = new Cliente();
        const cliente = await clienteModel.buscarPorEmail(email);
        
        if (!cliente) {
            req.session.error_msg = 'Email ou senha inválidos';
            return res.redirect('/login');
        }
        
        // Verificar senha
        if (cliente.senha !== password) {
            req.session.error_msg = 'Email ou senha inválidos';
            return res.redirect('/login');
        }
        
        // Armazenar dados do usuário na sessão
        req.session.user = {
            id: cliente._id,
            nome: cliente.nome,
            email: cliente.email,
            endereco: cliente.endereco,
            isAdmin: cliente.isAdmin || false
        };
        
        req.session.success_msg = `Bem-vindo(a), ${cliente.nome}!`;
        logger.logInfo('Usuário logado', { email: cliente.email });
        
        res.redirect('/dashboard');
        
    } catch (error) {
        logger.logException(error, 'authRoutes.login');
        req.session.error_msg = 'Erro ao fazer login. Tente novamente.';
        res.redirect('/login');
    }
});

// Página de registro
router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('auth/register', { 
        title: 'Registro - E-commerce',
        error_msg: req.session.error_msg
    });
});

// Processar registro
router.post('/register', async (req, res) => {
    const { nome, email, password, confirm_password, endereco } = req.body;
    
    try {
        // Validações
        if (!nome || !email || !password) {
            req.session.error_msg = 'Nome, email e senha são obrigatórios';
            return res.redirect('/register');
        }
        
        if (password !== confirm_password) {
            req.session.error_msg = 'As senhas não coincidem';
            return res.redirect('/register');
        }
        
        if (password.length < 6) {
            req.session.error_msg = 'A senha deve ter no mínimo 6 caracteres';
            return res.redirect('/register');
        }
        
        const clienteModel = new Cliente();
        
        // Verificar se email já existe
        const existingUser = await clienteModel.buscarPorEmail(email);
        if (existingUser) {
            req.session.error_msg = 'Email já cadastrado';
            return res.redirect('/register');
        }
        
        // Criar novo cliente
        const result = await clienteModel.inserir({
            nome,
            email,
            senha: password,
            endereco: endereco || null
        });
        
        req.session.success_msg = 'Cadastro realizado com sucesso! Faça login.';
        logger.logInfo('Novo usuário registrado', { email });
        
        res.redirect('/login');
        
    } catch (error) {
        logger.logException(error, 'authRoutes.register');
        req.session.error_msg = error.message || 'Erro ao cadastrar. Tente novamente.';
        res.redirect('/register');
    }
});

module.exports = router;
