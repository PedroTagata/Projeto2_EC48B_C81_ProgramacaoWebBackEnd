const db = require('../db/connection');
const logger = require('../utils/logger');
const { ObjectId } = require('mongodb');

class Produto {
    constructor() {
        this.collectionName = 'produtos';
    }

    getCollection() {
        return db.getCollection(this.collectionName);
    }

    // Validar campos obrigatórios
    validateFields(produto) {
        const errors = [];
        
        if (!produto.nome || typeof produto.nome !== 'string' || produto.nome.trim() === '') {
            errors.push('Campo "nome" é obrigatório e deve ser uma string não vazia');
        }
        
        if (produto.preco === undefined || produto.preco === null) {
            errors.push('Campo "preco" é obrigatório');
        } else if (typeof produto.preco !== 'number' || produto.preco <= 0) {
            errors.push('Campo "preco" deve ser um número maior que zero');
        }
        
        if (produto.estoque === undefined || produto.estoque === null) {
            errors.push('Campo "estoque" é obrigatório');
        } else if (typeof produto.estoque !== 'number' || produto.estoque < 0) {
            errors.push('Campo "estoque" deve ser um número não negativo');
        }
        
        return errors;
    }

    // Inserir produto
    async inserir(produto) {
        try {
            const errors = this.validateFields(produto);
            if (errors.length > 0) {
                throw new Error(`Erro de validação: ${errors.join(', ')}`);
            }

            const novoProduto = {
                nome: produto.nome.trim(),
                descricao: produto.descricao || null,
                preco: produto.preco,
                estoque: produto.estoque,
                categoria: produto.categoria || null,
                dataCriacao: new Date(),
                ativo: true,
                vendas: 0
            };

            const collection = this.getCollection();
            const result = await collection.insertOne(novoProduto);

            logger.logInfo('Produto inserido com sucesso', { 
                id: result.insertedId, 
                nome: produto.nome 
            });
            
            return { 
                success: true, 
                id: result.insertedId,
                produto: { ...novoProduto, _id: result.insertedId }
            };
            
        } catch (error) {
            logger.logException(error, 'Produto.inserir');
            throw error;
        }
    }

    // Buscar produto por ID
    async buscarPorId(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório para busca');
            }

            let queryId;
            try {
                queryId = typeof id === 'string' ? new ObjectId(id) : id;
            } catch (error) {
                throw new Error('ID inválido');
            }

            const collection = this.getCollection();
            const produto = await collection.findOne({ _id: queryId, ativo: true });

            if (!produto) {
                return null;
            }

            logger.logInfo('Produto buscado por ID', { id });
            return produto;
            
        } catch (error) {
            logger.logException(error, 'Produto.buscarPorId');
            throw error;
        }
    }

    // Buscar produtos por nome
    async buscarPorNome(nome) {
        try {
            if (!nome || nome.trim() === '') {
                throw new Error('Nome é obrigatório para busca');
            }

            const collection = this.getCollection();
            const produtos = await collection.find({
                nome: { $regex: nome.trim(), $options: 'i' },
                ativo: true
            })
            .sort({ nome: 1 })
            .toArray();

            logger.logInfo('Produtos buscados por nome', { 
                nome, 
                quantidade: produtos.length 
            });
            
            return produtos;
            
        } catch (error) {
            logger.logException(error, 'Produto.buscarPorNome');
            throw error;
        }
    }

    // Buscar produtos por categoria
    async buscarPorCategoria(categoria) {
        try {
            if (!categoria || categoria.trim() === '') {
                throw new Error('Categoria é obrigatória para busca');
            }

            const collection = this.getCollection();
            const produtos = await collection.find({ 
                categoria: { $regex: categoria.trim(), $options: 'i' },
                ativo: true 
            })
            .sort({ nome: 1 })
            .toArray();

            logger.logInfo('Produtos buscados por categoria', { 
                categoria, 
                quantidade: produtos.length 
            });
            
            return produtos;
            
        } catch (error) {
            logger.logException(error, 'Produto.buscarPorCategoria');
            throw error;
        }
    }

    // Busca avançada por texto em múltiplos campos
    async buscarTexto(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                throw new Error('Termo de busca é obrigatório');
            }

            const collection = this.getCollection();
            const produtos = await collection.find({
                $or: [
                    { nome: { $regex: searchTerm, $options: 'i' } },
                    { descricao: { $regex: searchTerm, $options: 'i' } },
                    { categoria: { $regex: searchTerm, $options: 'i' } }
                ],
                ativo: true
            })
            .sort({ vendas: -1, nome: 1 })
            .toArray();

            logger.logInfo('Busca textual realizada', { 
                termo: searchTerm, 
                resultados: produtos.length 
            });
            
            return produtos;
            
        } catch (error) {
            logger.logException(error, 'Produto.buscarTexto');
            throw error;
        }
    }

    // Buscar produtos por faixa de preço
    async buscarPorPreco(minPreco, maxPreco) {
        try {
            const collection = this.getCollection();
            const query = { ativo: true };
            
            if (minPreco !== undefined) {
                query.preco = { $gte: minPreco };
            }
            if (maxPreco !== undefined) {
                query.preco = { ...query.preco, $lte: maxPreco };
            }
            
            const produtos = await collection.find(query)
                .sort({ preco: 1 })
                .toArray();

            logger.logInfo('Produtos buscados por faixa de preço', { 
                minPreco, 
                maxPreco, 
                quantidade: produtos.length 
            });
            
            return produtos;
            
        } catch (error) {
            logger.logException(error, 'Produto.buscarPorPreco');
            throw error;
        }
    }

    // Buscar todos os produtos
    async buscarTodos(limit = 100, skip = 0) {
        try {
            const collection = this.getCollection();
            const produtos = await collection.find({ ativo: true })
                .sort({ nome: 1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            logger.logInfo('Lista de todos os produtos obtida', { 
                quantidade: produtos.length 
            });
            
            return produtos;
            
        } catch (error) {
            logger.logException(error, 'Produto.buscarTodos');
            throw error;
        }
    }

    // Atualizar estoque do produto
    async atualizarEstoque(id, quantidade) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório para atualização');
            }

            if (typeof quantidade !== 'number' || isNaN(quantidade)) {
                throw new Error('Quantidade deve ser um número');
            }

            const produto = await this.buscarPorId(id);
            if (!produto) {
                throw new Error('Produto não encontrado');
            }

            const novoEstoque = produto.estoque + quantidade;
            if (novoEstoque < 0) {
                throw new Error(`Estoque insuficiente. Estoque atual: ${produto.estoque}`);
            }

            let queryId;
            try {
                queryId = typeof id === 'string' ? new ObjectId(id) : id;
            } catch (error) {
                throw new Error('ID inválido');
            }

            const collection = this.getCollection();
            const result = await collection.updateOne(
                { _id: queryId },
                { 
                    $set: { 
                        estoque: novoEstoque,
                        dataAtualizacao: new Date()
                    } 
                }
            );

            logger.logInfo('Estoque atualizado', { 
                id, 
                alteracao: quantidade, 
                novoEstoque 
            });
            
            return { success: true, estoqueAtual: novoEstoque };
            
        } catch (error) {
            logger.logException(error, 'Produto.atualizarEstoque');
            throw error;
        }
    }

    // Incrementar contador de vendas
    async incrementarVendas(id, quantidade) {
        try {
            let queryId;
            try {
                queryId = typeof id === 'string' ? new ObjectId(id) : id;
            } catch (error) {
                throw new Error('ID inválido');
            }

            const collection = this.getCollection();
            await collection.updateOne(
                { _id: queryId },
                { $inc: { vendas: quantidade } }
            );
        } catch (error) {
            logger.logWarning('Erro ao incrementar vendas', { id, error: error.message });
        }
    }

    // Deletar produto (soft delete)
    async deletar(id) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório para deleção');
            }

            let queryId;
            try {
                queryId = typeof id === 'string' ? new ObjectId(id) : id;
            } catch (error) {
                throw new Error('ID inválido');
            }

            // Verificar se produto está em algum pedido
            const pedidosCollection = db.getCollection('pedidos');
            const pedidos = await pedidosCollection.countDocuments({
                "itens.produtoId": queryId.toString()
            });

            if (pedidos > 0) {
                throw new Error('Não é possível deletar produto que possui pedidos associados');
            }

            const collection = this.getCollection();
            const result = await collection.updateOne(
                { _id: queryId },
                { $set: { ativo: false, dataDelecao: new Date() } }
            );

            if (result.modifiedCount === 0) {
                throw new Error('Produto não encontrado');
            }

            logger.logInfo('Produto deletado com sucesso', { id });
            return { success: true, affectedRows: result.modifiedCount };
            
        } catch (error) {
            logger.logException(error, 'Produto.deletar');
            throw error;
        }
    }
}

module.exports = Produto;
