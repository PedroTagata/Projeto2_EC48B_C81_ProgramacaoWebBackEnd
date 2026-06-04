const db = require('../db/connection');
const logger = require('../utils/logger');
const { ObjectId } = require('mongodb');

class Cliente {
    constructor() {
        this.collectionName = 'clientes';
    }

    getCollection() {
        return db.getCollection(this.collectionName);
    }

    // Validar campos obrigatórios
    validateFields(cliente, isUpdate = false) {
        const errors = [];
        
        if (!cliente.nome || typeof cliente.nome !== 'string' || cliente.nome.trim() === '') {
            errors.push('Campo "nome" é obrigatório e deve ser uma string não vazia');
        }
        
        if (!cliente.email || typeof cliente.email !== 'string' || cliente.email.trim() === '') {
            errors.push('Campo "email" é obrigatório e deve ser uma string não vazia');
        } else if (!this.isValidEmail(cliente.email)) {
            errors.push('Formato de email inválido');
        }

        // Só valida senha se não for atualização (cadastro)
        if (!isUpdate && (!cliente.senha || cliente.senha.trim() === '')) {
            errors.push('Campo "senha" é obrigatório para cadastro');
        }
        
        return errors;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Inserir cliente
    async inserir(cliente) {
        try {
            // Validação
            const errors = this.validateFields(cliente);
            if (errors.length > 0) {
                throw new Error(`Erro de validação: ${errors.join(', ')}`);
            }

            const collection = this.getCollection();
            
            // Verificar se email já existe
            const emailExistente = await collection.findOne({ 
                email: cliente.email.trim().toLowerCase() 
            });
            
            if (emailExistente) {
                throw new Error('Email já cadastrado no sistema');
            }

            const novoCliente = {
                nome: cliente.nome.trim(),
                email: cliente.email.trim().toLowerCase(),
                senha: cliente.senha, // Agora a senha é armazenada (em produção, use hash)
                endereco: cliente.endereco || null,
                dataCadastro: new Date(),
                ativo: true
            };

            const result = await collection.insertOne(novoCliente);
            
            logger.logInfo('Cliente inserido com sucesso', { 
                id: result.insertedId, 
                nome: cliente.nome 
            });
            
            return { 
                success: true, 
                id: result.insertedId,
                cliente: { ...novoCliente, _id: result.insertedId }
            };
            
        } catch (error) {
            logger.logException(error, 'Cliente.inserir');
            throw error;
        }
    }

    // Autenticar cliente
    async autenticar(email, senha) {
        try {
            const cliente = await this.buscarPorEmail(email);
            if (!cliente) return null;
            
            // Comparação direta (em produção, use bcrypt.compare)
            if (cliente.senha === senha) {
                return cliente;
            }
            return null;
        } catch (error) {
            logger.logException(error, 'Cliente.autenticar');
            throw error;
        }
    }

    // Buscar cliente por ID
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
            const cliente = await collection.findOne({ _id: queryId, ativo: true });

            if (!cliente) {
                return null;
            }

            logger.logInfo('Cliente buscado por ID', { id });
            return cliente;
            
        } catch (error) {
            logger.logException(error, 'Cliente.buscarPorId');
            throw error;
        }
    }

    // Buscar cliente por email
    async buscarPorEmail(email) {
        try {
            if (!email || email.trim() === '') {
                throw new Error('Email é obrigatório para busca');
            }

            const collection = this.getCollection();
            const cliente = await collection.findOne({ 
                email: email.trim().toLowerCase(),
                ativo: true
            });

            logger.logInfo('Cliente buscado por email', { email });
            return cliente;
            
        } catch (error) {
            logger.logException(error, 'Cliente.buscarPorEmail');
            throw error;
        }
    }

    // Buscar todos os clientes
    async buscarTodos(limit = 100, skip = 0) {
        try {
            const collection = this.getCollection();
            const clientes = await collection.find({ ativo: true })
                .sort({ nome: 1 })
                .skip(skip)
                .limit(limit)
                .toArray();

            logger.logInfo('Lista de todos os clientes obtida', { quantidade: clientes.length });
            return clientes;
            
        } catch (error) {
            logger.logException(error, 'Cliente.buscarTodos');
            throw error;
        }
    }

    // Atualizar dados do cliente (não atualiza senha por segurança)
    async atualizarDados(id, novosDados) {
        try {
            if (!id) {
                throw new Error('ID é obrigatório para atualização');
            }

            let queryId;
            try {
                queryId = typeof id === 'string' ? new ObjectId(id) : id;
            } catch (error) {
                throw new Error('ID inválido');
            }

            const clienteExistente = await this.buscarPorId(queryId);
            if (!clienteExistente) {
                throw new Error('Cliente não encontrado');
            }

            const updates = {};
            if (novosDados.nome && novosDados.nome.trim() !== '') {
                updates.nome = novosDados.nome.trim();
            }
            if (novosDados.endereco !== undefined) {
                updates.endereco = novosDados.endereco || null;
            }

            if (Object.keys(updates).length === 0) {
                throw new Error('Nenhum campo válido para atualização');
            }

            updates.dataAtualizacao = new Date();

            const collection = this.getCollection();
            const result = await collection.updateOne(
                { _id: queryId },
                { $set: updates }
            );

            logger.logInfo('Cliente atualizado com sucesso', { 
                id, 
                atualizacoes: Object.keys(updates) 
            });
            
            return { 
                success: true, 
                affectedRows: result.modifiedCount,
                updates
            };
            
        } catch (error) {
            logger.logException(error, 'Cliente.atualizarDados');
            throw error;
        }
    }

    // Deletar cliente (soft delete - apenas marca como inativo)
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

            // Verificar se cliente tem pedidos
            const pedidosCollection = db.getCollection('pedidos');
            const pedidos = await pedidosCollection.countDocuments({ 
                clienteId: queryId.toString(),
                status: { $ne: 'cancelado' }
            });

            if (pedidos > 0) {
                throw new Error('Não é possível deletar cliente que possui pedidos ativos');
            }

            const collection = this.getCollection();
            const result = await collection.updateOne(
                { _id: queryId },
                { $set: { ativo: false, dataDelecao: new Date() } }
            );

            if (result.modifiedCount === 0) {
                throw new Error('Cliente não encontrado');
            }

            logger.logInfo('Cliente deletado com sucesso (soft delete)', { id });
            return { success: true, affectedRows: result.modifiedCount };
            
        } catch (error) {
            logger.logException(error, 'Cliente.deletar');
            throw error;
        }
    }
}

module.exports = Cliente;
