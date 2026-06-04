const { MongoClient } = require('mongodb');
require('dotenv').config();
const logger = require('../utils/logger');

class MongoDBConnection {
    constructor() {
        this.client = null;
        this.db = null;
        this.uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
        this.dbName = process.env.MONGO_DB_NAME || 'ecommerce_db';
    }

    async connect() {
        try {
            // Configurar opções para conexão mais estável
            const options = {
                maxPoolSize: 10,
                minPoolSize: 2,
                connectTimeoutMS: 30000,
                socketTimeoutMS: 45000,
                serverSelectionTimeoutMS: 30000
            };

            if (process.env.MONGO_USER && process.env.MONGO_PASSWORD) {
                options.auth = {
                    username: process.env.MONGO_USER,
                    password: process.env.MONGO_PASSWORD
                };
            }

            this.client = new MongoClient(this.uri, options);
            await this.client.connect();
            
            this.db = this.client.db(this.dbName);
            
            // Criar índices para otimização
            await this.createIndexes();
            
            console.log('MongoDB conectado com sucesso!');
            logger.logInfo('Conexão com MongoDB estabelecida', { database: this.dbName });
            
            return this.db;
        } catch (error) {
            logger.logException(error, 'MongoDBConnection.connect');
            throw new Error(`Erro ao conectar ao MongoDB: ${error.message}`);
        }
    }

    async createIndexes() {
        try {
            // Índices para coleção de clientes
            const clientesCollection = this.db.collection('clientes');
            await clientesCollection.createIndex({ email: 1 }, { unique: true });
            await clientesCollection.createIndex({ nome: 1 });
            
            // Índices para coleção de produtos
            const produtosCollection = this.db.collection('produtos');
            await produtosCollection.createIndex({ nome: 'text', descricao: 'text', categoria: 'text' });
            await produtosCollection.createIndex({ categoria: 1 });
            await produtosCollection.createIndex({ preco: 1 });
            
            // Índices para coleção de pedidos
            const pedidosCollection = this.db.collection('pedidos');
            await pedidosCollection.createIndex({ clienteId: 1 });
            await pedidosCollection.createIndex({ status: 1 });
            await pedidosCollection.createIndex({ dataPedido: -1 });
            await pedidosCollection.createIndex({ "itens.produtoId": 1 });
            
            logger.logInfo('Índices criados com sucesso');
        } catch (error) {
            logger.logInfo('Aviso ao criar índices', { error: error.message });
        }
    }

    getDb() {
        if (!this.db) {
            throw new Error('Conexão com banco de dados não inicializada. Execute connect() primeiro.');
        }
        return this.db;
    }

    getCollection(collectionName) {
        return this.getDb().collection(collectionName);
    }

    async close() {
        if (this.client) {
            await this.client.close();
            console.log('Conexões com o MongoDB encerradas.');
            logger.logInfo('Conexão com MongoDB encerrada');
        }
    }

    // Gerar ID sequencial simples
    async getNextSequence(sequenceName) {
        const counterCollection = this.db.collection('counters');
        const result = await counterCollection.findOneAndUpdate(
            { _id: sequenceName },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        return result.value.seq;
    }
}

module.exports = new MongoDBConnection();
