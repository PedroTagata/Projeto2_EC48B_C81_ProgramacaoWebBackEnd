const db = require('../db/connection');
const logger = require('../utils/logger');
const Produto = require('./Produto');
const Cliente = require('./Cliente');
const { ObjectId } = require('mongodb');

class Pedido {
    constructor() {
        this.collectionName = 'pedidos';
        this.produtoModel = new Produto();
        this.clienteModel = new Cliente();
    }

    getCollection() {
        return db.getCollection(this.collectionName);
    }

    // Validar dados do pedido
    validatePedido(clienteId, itens) {
        const errors = [];
        
        if (!clienteId) {
            errors.push('ID do cliente é obrigatório');
        }
        
        if (!itens || !Array.isArray(itens) || itens.length === 0) {
            errors.push('Pedido deve conter pelo menos um item');
        }
        
        for (let i = 0; i < itens.length; i++) {
            const item = itens[i];
            if (!item.produtoId) {
                errors.push(`Item ${i + 1}: ID do produto inválido`);
            }
            if (!item.quantidade || item.quantidade <= 0) {
                errors.push(`Item ${i + 1}: Quantidade deve ser maior que zero`);
            }
        }
        
        return errors;
    }

    // Criar pedido
    async criarPedido(clienteId, itens) {
        const session = db.getDb().client.startSession();
        
        try {
            // Validação
            const errors = this.validatePedido(clienteId, itens);
            if (errors.length > 0) {
                throw new Error(`Erro de validação: ${errors.join(', ')}`);
            }

            // Verificar se cliente existe
            const cliente = await this.clienteModel.buscarPorId(clienteId);
            if (!cliente) {
                throw new Error('Cliente não encontrado');
            }

            // Calcular total e verificar estoque
            let valorTotal = 0;
            const itensProcessados = [];

            for (const item of itens) {
                const produto = await this.produtoModel.buscarPorId(item.produtoId);
                if (!produto) {
                    throw new Error(`Produto com ID ${item.produtoId} não encontrado`);
                }
                
                if (produto.estoque < item.quantidade) {
                    throw new Error(`Estoque insuficiente para o produto "${produto.nome}". Disponível: ${produto.estoque}`);
                }
                
                const subtotal = produto.preco * item.quantidade;
                valorTotal += subtotal;
                
                itensProcessados.push({
                    produtoId: produto._id.toString(),
                    produtoNome: produto.nome,
                    quantidade: item.quantidade,
                    precoUnitario: produto.preco,
                    subtotal: subtotal
                });
            }

            await session.withTransaction(async () => {
                // Criar pedido
                const pedido = {
                    clienteId: typeof clienteId === 'string' ? clienteId : clienteId.toString(),
                    clienteNome: cliente.nome,
                    clienteEmail: cliente.email,
                    dataPedido: new Date(),
                    status: 'pendente',
                    valorTotal: valorTotal,
                    itens: itensProcessados,
                    historicoStatus: [{
                        status: 'pendente',
                        data: new Date(),
                        observacao: 'Pedido criado'
                    }]
                };

                const pedidosCollection = this.getCollection();
                const pedidoResult = await pedidosCollection.insertOne(pedido);
                const pedidoId = pedidoResult.insertedId;

                // Atualizar estoque e incrementar vendas
                for (const item of itensProcessados) {
                    await this.produtoModel.atualizarEstoque(item.produtoId, -item.quantidade);
                    await this.produtoModel.incrementarVendas(item.produtoId, item.quantidade);
                }

                logger.logInfo('Pedido criado com sucesso', { 
                    pedidoId, 
                    clienteId, 
                    valorTotal 
                });
            });

            return { success: true };
            
        } catch (error) {
            logger.logException(error, 'Pedido.criarPedido');
            throw error;
        } finally {
            await session.endSession();
        }
    }

    // Buscar pedido por ID
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
            const pedido = await collection.findOne({ _id: queryId });

            if (!pedido) {
                return null;
            }

            logger.logInfo('Pedido buscado por ID', { id });
            return pedido;
            
        } catch (error) {
            logger.logException(error, 'Pedido.buscarPorId');
            throw error;
        }
    }

    // Buscar pedidos por cliente
    async buscarPorCliente(clienteId) {
        try {
            if (!clienteId) {
                throw new Error('ID do cliente é obrigatório');
            }

            const collection = this.getCollection();
            const pedidos = await collection.find({ 
                clienteId: clienteId.toString() 
            })
            .sort({ dataPedido: -1 })
            .toArray();

            logger.logInfo('Pedidos buscados por cliente', { 
                clienteId, 
                quantidade: pedidos.length 
            });
            
            return pedidos;
            
        } catch (error) {
            logger.logException(error, 'Pedido.buscarPorCliente');
            throw error;
        }
    }

    // Buscar pedidos por status
    async buscarPorStatus(status) {
        try {
            const statusValidos = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];
            if (!status || !statusValidos.includes(status.toLowerCase())) {
                throw new Error(`Status inválido. Status permitidos: ${statusValidos.join(', ')}`);
            }

            const collection = this.getCollection();
            const pedidos = await collection.find({ 
                status: status.toLowerCase() 
            })
            .sort({ dataPedido: -1 })
            .toArray();

            logger.logInfo('Pedidos buscados por status', { 
                status, 
                quantidade: pedidos.length 
            });
            
            return pedidos;
            
        } catch (error) {
            logger.logException(error, 'Pedido.buscarPorStatus');
            throw error;
        }
    }

    // Buscar pedidos por período
    async buscarPorPeriodo(dataInicio, dataFim) {
        try {
            if (!dataInicio || !dataFim) {
                throw new Error('Data de início e fim são obrigatórias');
            }

            const collection = this.getCollection();
            const pedidos = await collection.find({
                dataPedido: {
                    $gte: new Date(dataInicio),
                    $lte: new Date(dataFim)
                }
            })
            .sort({ dataPedido: -1 })
            .toArray();

            logger.logInfo('Pedidos buscados por período', { 
                dataInicio, 
                dataFim, 
                quantidade: pedidos.length 
            });
            
            return pedidos;
            
        } catch (error) {
            logger.logException(error, 'Pedido.buscarPorPeriodo');
            throw error;
        }
    }

    // Buscar todos os pedidos
    async buscarTodos(limit = 100, skip = 0) {
        try {
            const collection = this.getCollection();
            const pedidos = await collection.find({})
                .sort({ dataPedido: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            logger.logInfo('Lista de todos os pedidos obtida', { 
                quantidade: pedidos.length 
            });
            
            return pedidos;
            
        } catch (error) {
            logger.logException(error, 'Pedido.buscarTodos');
            throw error;
        }
    }

    // Atualizar status do pedido
    async atualizarStatus(pedidoId, novoStatus, observacao = '') {
        try {
            if (!pedidoId) {
                throw new Error('ID do pedido é obrigatório');
            }
            
            const statusValidos = ['pendente', 'pago', 'enviado', 'entregue', 'cancelado'];
            if (!novoStatus || !statusValidos.includes(novoStatus.toLowerCase())) {
                throw new Error(`Status inválido. Status permitidos: ${statusValidos.join(', ')}`);
            }
            
            const pedido = await this.buscarPorId(pedidoId);
            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }
            
            const session = db.getDb().client.startSession();
            
            try {
                await session.withTransaction(async () => {
                    const collection = this.getCollection();
                    let queryId;
                    try {
                        queryId = typeof pedidoId === 'string' ? new ObjectId(pedidoId) : pedidoId;
                    } catch (error) {
                        throw new Error('ID inválido');
                    }

                    // Se está cancelando, restaurar estoque
                    if (novoStatus.toLowerCase() === 'cancelado' && pedido.status !== 'cancelado') {
                        for (const item of pedido.itens) {
                            await this.produtoModel.atualizarEstoque(item.produtoId, item.quantidade);
                        }
                    }

                    const historicoEntry = {
                        status: novoStatus.toLowerCase(),
                        data: new Date(),
                        observacao: observacao || `Status alterado de ${pedido.status} para ${novoStatus}`
                    };

                    await collection.updateOne(
                        { _id: queryId },
                        { 
                            $set: { 
                                status: novoStatus.toLowerCase(),
                                dataAtualizacao: new Date()
                            },
                            $push: { historicoStatus: historicoEntry }
                        }
                    );
                });

                logger.logInfo('Status do pedido atualizado', { 
                    pedidoId, 
                    statusAntigo: pedido.status, 
                    novoStatus 
                });
                
                return { success: true };
                
            } finally {
                await session.endSession();
            }
            
        } catch (error) {
            logger.logException(error, 'Pedido.atualizarStatus');
            throw error;
        }
    }

    // Cancelar pedido
    async cancelarPedido(pedidoId, motivo = '') {
        return this.atualizarStatus(pedidoId, 'cancelado', motivo || 'Pedido cancelado pelo cliente');
    }

    // Obter resumo de vendas
    async obterResumoVendas(dataInicio, dataFim) {
        try {
            const startDate = dataInicio ? new Date(dataInicio) : new Date(new Date().setDate(1));
            const endDate = dataFim ? new Date(dataFim) : new Date();

            const collection = this.getCollection();
            const pedidos = await collection.find({
                status: { $in: ['pago', 'enviado', 'entregue'] },
                dataPedido: { $gte: startDate, $lte: endDate }
            }).toArray();

            const totalVendas = pedidos.reduce((sum, p) => sum + p.valorTotal, 0);
            const totalPedidos = pedidos.length;
            
            // Produtos mais vendidos
            const produtosVendidos = {};
            pedidos.forEach(pedido => {
                pedido.itens.forEach(item => {
                    if (!produtosVendidos[item.produtoId]) {
                        produtosVendidos[item.produtoId] = {
                            produtoNome: item.produtoNome,
                            quantidade: 0,
                            receita: 0
                        };
                    }
                    produtosVendidos[item.produtoId].quantidade += item.quantidade;
                    produtosVendidos[item.produtoId].receita += item.subtotal;
                });
            });

            const produtosMaisVendidos = Object.values(produtosVendidos)
                .sort((a, b) => b.quantidade - a.quantidade)
                .slice(0, 5);

            const resumo = {
                periodo: { inicio: startDate, fim: endDate },
                totalPedidos,
                totalVendas,
                ticketMedio: totalPedidos > 0 ? totalVendas / totalPedidos : 0,
                produtosMaisVendidos
            };

            logger.logInfo('Resumo de vendas gerado', resumo);
            return resumo;
            
        } catch (error) {
            logger.logException(error, 'Pedido.obterResumoVendas');
            throw error;
        }
    }
}

module.exports = Pedido;
