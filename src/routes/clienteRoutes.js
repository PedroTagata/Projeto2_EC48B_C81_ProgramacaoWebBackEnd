const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const logger = require('../utils/logger');

// Listar todos os clientes
router.get('/', async (req, res) => {
    try {
        const clienteModel = new Cliente();
        const clientes = await clienteModel.buscarTodos();
        
        res.render('clientes/index', {
            title: 'Clientes - E-commerce',
            clientes,
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'clienteRoutes.list');
        req.session.error_msg = 'Erro ao carregar lista de clientes';
        res.redirect('/dashboard');
    }
});

// Formulário de novo cliente
router.get('/novo', (req, res) => {
    res.render('clientes/form', {
        title: 'Novo Cliente',
        cliente: null,
        action: '/clientes',
        method: 'POST',
        user: req.session.user
    });
});

// Criar cliente via web
router.post('/', async (req, res) => {
    const { nome, email, endereco } = req.body;
    
    try {
        const clienteModel = new Cliente();
        const result = await clienteModel.inserir({ nome, email, endereco });
        
        req.session.success_msg = 'Cliente cadastrado com sucesso!';
        res.redirect('/clientes');
    } catch (error) {
        logger.logException(error, 'clienteRoutes.create');
        req.session.error_msg = error.message || 'Erro ao cadastrar cliente';
        res.redirect('/clientes/novo');
    }
});

// Visualizar cliente
router.get('/:id', async (req, res) => {
    try {
        const clienteModel = new Cliente();
        const cliente = await clienteModel.buscarPorId(req.params.id);
        
        if (!cliente) {
            req.session.error_msg = 'Cliente não encontrado';
            return res.redirect('/clientes');
        }
        
        res.render('clientes/show', {
            title: `Cliente: ${cliente.nome}`,
            cliente,
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'clienteRoutes.show');
        req.session.error_msg = 'Erro ao carregar cliente';
        res.redirect('/clientes');
    }
});

// Formulário de edição
router.get('/:id/editar', async (req, res) => {
    try {
        const clienteModel = new Cliente();
        const cliente = await clienteModel.buscarPorId(req.params.id);
        
        if (!cliente) {
            req.session.error_msg = 'Cliente não encontrado';
            return res.redirect('/clientes');
        }
        
        res.render('clientes/form', {
            title: `Editar Cliente: ${cliente.nome}`,
            cliente,
            action: `/clientes/${req.params.id}?_method=PUT`,
            method: 'POST',
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'clienteRoutes.edit');
        req.session.error_msg = 'Erro ao carregar formulário de edição';
        res.redirect('/clientes');
    }
});

// Atualizar cliente
router.put('/:id', async (req, res) => {
    const { nome, endereco } = req.body;
    
    try {
        const clienteModel = new Cliente();
        await clienteModel.atualizarDados(req.params.id, { nome, endereco });
        
        req.session.success_msg = 'Cliente atualizado com sucesso!';
        res.redirect(`/clientes/${req.params.id}`);
    } catch (error) {
        logger.logException(error, 'clienteRoutes.update');
        req.session.error_msg = error.message || 'Erro ao atualizar cliente';
        res.redirect(`/clientes/${req.params.id}/editar`);
    }
});

// Deletar cliente
router.delete('/:id', async (req, res) => {
    try {
        const clienteModel = new Cliente();
        await clienteModel.deletar(req.params.id);
        
        req.session.success_msg = 'Cliente removido com sucesso!';
        res.redirect('/clientes');
    } catch (error) {
        logger.logException(error, 'clienteRoutes.delete');
        req.session.error_msg = error.message || 'Erro ao remover cliente';
        res.redirect('/clientes');
    }
});

module.exports = router;
