const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');
const Produto = require('../models/Produto');
const logger = require('../utils/logger');

// Listar pedidos
router.get('/', async (req, res) => {
    const { status, periodo } = req.query;
    
    try {
        const pedidoModel = new Pedido();
        let pedidos = [];
        
        if (status) {
            pedidos = await pedidoModel.buscarPorStatus(status);
        } else if (periodo === 'mes') {
            const inicio = new Date();
            inicio.setMonth(inicio.getMonth() - 1);
            pedidos = await pedidoModel.buscarPorPeriodo(inicio, new Date());
        } else {
            pedidos = await pedidoModel.buscarTodos();
        }
        
        res.render('pedidos/index', {
            title: 'Pedidos - E-commerce',
            pedidos,
            statusFiltro: status,
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.list');
        req.session.error_msg = 'Erro ao carregar pedidos';
        res.redirect('/dashboard');
    }
});

// Formulário de novo pedido
router.get('/novo', async (req, res) => {
    try {
        const produtoModel = new Produto();
        const produtos = await produtoModel.buscarTodos();
        
        res.render('pedidos/form', {
            title: 'Novo Pedido',
            produtos,
            itens: [],
            action: '/pedidos',
            method: 'POST',
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.new');
        req.session.error_msg = 'Erro ao carregar formulário';
        res.redirect('/pedidos');
    }
});

// Criar pedido
router.post('/', async (req, res) => {
    const { itens } = req.body;
    
    try {
        if (!itens || itens.length === 0) {
            req.session.error_msg = 'Adicione pelo menos um item ao pedido';
            return res.redirect('/pedidos/novo');
        }
        
        // Converter itens para o formato esperado
        const itensProcessados = Array.isArray(itens) ? itens : [itens];
        const itensFormatados = itensProcessados.map(item => ({
            produtoId: item.produtoId,
            quantidade: parseInt(item.quantidade)
        }));
        
        const pedidoModel = new Pedido();
        await pedidoModel.criarPedido(req.session.user.id, itensFormatados);
        
        req.session.success_msg = 'Pedido criado com sucesso!';
        res.redirect('/pedidos');
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.create');
        req.session.error_msg = error.message || 'Erro ao criar pedido';
        res.redirect('/pedidos/novo');
    }
});

// Visualizar pedido
router.get('/:id', async (req, res) => {
    try {
        const pedidoModel = new Pedido();
        const pedido = await pedidoModel.buscarPorId(req.params.id);
        
        if (!pedido) {
            req.session.error_msg = 'Pedido não encontrado';
            return res.redirect('/pedidos');
        }
        
        res.render('pedidos/show', {
            title: `Pedido #${pedido._id}`,
            pedido,
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.show');
        req.session.error_msg = 'Erro ao carregar pedido';
        res.redirect('/pedidos');
    }
});

// Atualizar status do pedido
router.post('/:id/status', async (req, res) => {
    const { status, observacao } = req.body;
    
    try {
        const pedidoModel = new Pedido();
        await pedidoModel.atualizarStatus(req.params.id, status, observacao);
        
        req.session.success_msg = `Status do pedido atualizado para "${status}"!`;
        res.redirect(`/pedidos/${req.params.id}`);
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.updateStatus');
        req.session.error_msg = error.message || 'Erro ao atualizar status';
        res.redirect(`/pedidos/${req.params.id}`);
    }
});

// Cancelar pedido
router.post('/:id/cancelar', async (req, res) => {
    const { motivo } = req.body;
    
    try {
        const pedidoModel = new Pedido();
        await pedidoModel.cancelarPedido(req.params.id, motivo);
        
        req.session.success_msg = 'Pedido cancelado com sucesso!';
        res.redirect(`/pedidos/${req.params.id}`);
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.cancel');
        req.session.error_msg = error.message || 'Erro ao cancelar pedido';
        res.redirect(`/pedidos/${req.params.id}`);
    }
});

// Relatório de vendas
router.get('/relatorio/vendas', async (req, res) => {
    const { inicio, fim } = req.query;
    
    try {
        const pedidoModel = new Pedido();
        
        let dataInicio, dataFim;
        if (inicio && fim) {
            dataInicio = new Date(inicio);
            dataFim = new Date(fim);
            dataFim.setHours(23, 59, 59, 999);
        } else {
            // Últimos 30 dias por padrão
            dataInicio = new Date();
            dataInicio.setDate(dataInicio.getDate() - 30);
            dataFim = new Date();
        }
        
        const resumo = await pedidoModel.obterResumoVendas(dataInicio, dataFim);
        
        res.render('pedidos/relatorio', {
            title: 'Relatório de Vendas',
            resumo,
            inicio: dataInicio.toISOString().split('T')[0],
            fim: dataFim.toISOString().split('T')[0],
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.report');
        req.session.error_msg = 'Erro ao gerar relatório';
        res.redirect('/pedidos');
    }
});

// Meus pedidos (para o cliente logado)
router.get('/cliente/meus', async (req, res) => {
    try {
        const pedidoModel = new Pedido();
        const pedidos = await pedidoModel.buscarPorCliente(req.session.user.id);
        
        res.render('pedidos/meus', {
            title: 'Meus Pedidos',
            pedidos,
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'pedidoRoutes.myOrders');
        req.session.error_msg = 'Erro ao carregar seus pedidos';
        res.redirect('/dashboard');
    }
});

module.exports = router;
