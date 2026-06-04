const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');
const logger = require('../utils/logger');

// Listar produtos com busca e filtros
router.get('/', async (req, res) => {
    const { search, categoria, minPreco, maxPreco } = req.query;
    
    try {
        const produtoModel = new Produto();
        let produtos = [];
        
        if (search) {
            produtos = await produtoModel.buscarTexto(search);
        } else if (categoria) {
            produtos = await produtoModel.buscarPorCategoria(categoria);
        } else if (minPreco || maxPreco) {
            produtos = await produtoModel.buscarPorPreco(
                minPreco ? parseFloat(minPreco) : undefined,
                maxPreco ? parseFloat(maxPreco) : undefined
            );
        } else {
            produtos = await produtoModel.buscarTodos();
        }
        
        // Buscar categorias únicas para o filtro
        const todosProdutos = await produtoModel.buscarTodos(1000);
        const categorias = [...new Set(todosProdutos.map(p => p.categoria).filter(c => c))];
        
        res.render('produtos/index', {
            title: 'Produtos - E-commerce',
            produtos,
            categorias,
            filtros: { search, categoria, minPreco, maxPreco },
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'produtoRoutes.list');
        req.session.error_msg = 'Erro ao carregar produtos';
        res.redirect('/dashboard');
    }
});

// Formulário de novo produto
router.get('/novo', (req, res) => {
    res.render('produtos/form', {
        title: 'Novo Produto',
        produto: null,
        action: '/produtos',
        method: 'POST',
        user: req.session.user
    });
});

// Criar produto
router.post('/', async (req, res) => {
    const { nome, descricao, preco, estoque, categoria } = req.body;
    
    try {
        const produtoModel = new Produto();
        const result = await produtoModel.inserir({
            nome,
            descricao,
            preco: parseFloat(preco),
            estoque: parseInt(estoque),
            categoria
        });
        
        req.session.success_msg = 'Produto cadastrado com sucesso!';
        res.redirect('/produtos');
    } catch (error) {
        logger.logException(error, 'produtoRoutes.create');
        req.session.error_msg = error.message || 'Erro ao cadastrar produto';
        res.redirect('/produtos/novo');
    }
});

// Visualizar produto
router.get('/:id', async (req, res) => {
    try {
        const produtoModel = new Produto();
        const produto = await produtoModel.buscarPorId(req.params.id);
        
        if (!produto) {
            req.session.error_msg = 'Produto não encontrado';
            return res.redirect('/produtos');
        }
        
        res.render('produtos/show', {
            title: `Produto: ${produto.nome}`,
            produto,
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'produtoRoutes.show');
        req.session.error_msg = 'Erro ao carregar produto';
        res.redirect('/produtos');
    }
});

// Formulário de edição
router.get('/:id/editar', async (req, res) => {
    try {
        const produtoModel = new Produto();
        const produto = await produtoModel.buscarPorId(req.params.id);
        
        if (!produto) {
            req.session.error_msg = 'Produto não encontrado';
            return res.redirect('/produtos');
        }
        
        res.render('produtos/form', {
            title: `Editar Produto: ${produto.nome}`,
            produto,
            action: `/produtos/${req.params.id}?_method=PUT`,
            method: 'POST',
            user: req.session.user
        });
    } catch (error) {
        logger.logException(error, 'produtoRoutes.edit');
        req.session.error_msg = 'Erro ao carregar formulário de edição';
        res.redirect('/produtos');
    }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
    const { nome, descricao, preco, estoque, categoria } = req.body;
    
    try {
        const produtoModel = new Produto();
        
        // Atualizar dados básicos
        if (nome || descricao || preco || categoria) {
            // Método de atualização geral
            const updates = {};
            if (nome) updates.nome = nome;
            if (descricao !== undefined) updates.descricao = descricao;
            if (preco) updates.preco = parseFloat(preco);
            if (categoria !== undefined) updates.categoria = categoria;
            if (Object.keys(updates).length > 0) {
            }
        }
        
        // Atualizar estoque
        if (estoque !== undefined) {
            const produtoAtual = await produtoModel.buscarPorId(req.params.id);
            const diferenca = parseInt(estoque) - produtoAtual.estoque;
            await produtoModel.atualizarEstoque(req.params.id, diferenca);
        }
        
        req.session.success_msg = 'Produto atualizado com sucesso!';
        res.redirect(`/produtos/${req.params.id}`);
    } catch (error) {
        logger.logException(error, 'produtoRoutes.update');
        req.session.error_msg = error.message || 'Erro ao atualizar produto';
        res.redirect(`/produtos/${req.params.id}/editar`);
    }
});

// Atualizar estoque via formulário específico
router.post('/:id/estoque', async (req, res) => {
    const { quantidade, operacao } = req.body;
    
    try {
        const produtoModel = new Produto();
        const quantidadeNum = parseInt(quantidade);
        const ajuste = operacao === 'adicionar' ? quantidadeNum : -quantidadeNum;
        
        await produtoModel.atualizarEstoque(req.params.id, ajuste);
        
        req.session.success_msg = `Estoque ${operacao === 'adicionar' ? 'adicionado' : 'removido'} com sucesso!`;
        res.redirect(`/produtos/${req.params.id}`);
    } catch (error) {
        logger.logException(error, 'produtoRoutes.updateStock');
        req.session.error_msg = error.message || 'Erro ao atualizar estoque';
        res.redirect(`/produtos/${req.params.id}`);
    }
});

// Deletar produto
router.delete('/:id', async (req, res) => {
    try {
        const produtoModel = new Produto();
        await produtoModel.deletar(req.params.id);
        
        req.session.success_msg = 'Produto removido com sucesso!';
        res.redirect('/produtos');
    } catch (error) {
        logger.logException(error, 'produtoRoutes.delete');
        req.session.error_msg = error.message || 'Erro ao remover produto';
        res.redirect('/produtos');
    }
});

module.exports = router;
