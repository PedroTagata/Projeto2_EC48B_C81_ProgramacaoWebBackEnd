require('dotenv').config();
const db = require('./src/db/connection');
const Cliente = require('./src/models/Cliente');
const Produto = require('./src/models/Produto');
const Pedido = require('./src/models/Pedido');
const logger = require('./src/utils/logger');

async function testarSistema() {
    console.log('\nIniciando testes do sistema de e-commerce com MongoDB...\n');
    
    let clienteId, produtoIds = [];
    
    try {
        // Conectar ao MongoDB
        await db.connect();
        
        const clienteModel = new Cliente();
        const produtoModel = new Produto();
        const pedidoModel = new Pedido();
        
        // TESTE 1: Inserir cliente
        console.log('TESTE 1: Inserir cliente');
        try {
            const result = await clienteModel.inserir({
                nome: 'João Silva',
                email: 'joao@email.com',
                endereco: 'Rua A, 123 - São Paulo/SP'
            });
            clienteId = result.id;
            console.log('Cliente inserido com sucesso, ID:', clienteId.toString());
        } catch (error) {
            console.error('Erro ao inserir cliente:', error.message);
        }
        
        // TESTE 2: Tentar inserir cliente com email duplicado
        console.log('\nTESTE 2: Tentar inserir cliente com email duplicado');
        try {
            await clienteModel.inserir({
                nome: 'Maria Souza',
                email: 'joao@email.com', // Email já utilizado
                endereco: 'Rua B, 456 - Rio de Janeiro/RJ'
            });
        } catch (error) {
            console.log('Validação funcionou:', error.message);
        }
        
        // TESTE 3: Inserir produtos
        console.log('\nTESTE 3: Inserir produtos');
        try {
            const produto1 = await produtoModel.inserir({
                nome: 'Smartphone XYZ Pro',
                descricao: 'Smartphone de última geração com 256GB',
                preco: 2499.99,
                estoque: 15,
                categoria: 'Eletrônicos'
            });
            produtoIds.push(produto1.id);
            console.log('Produto 1 inserido, ID:', produto1.id.toString());
            
            const produto2 = await produtoModel.inserir({
                nome: 'Fone de Ouvido Bluetooth Premium',
                descricao: 'Fone sem fio com cancelamento de ruído ativo',
                preco: 399.99,
                estoque: 50,
                categoria: 'Acessórios'
            });
            produtoIds.push(produto2.id);
            console.log('Produto 2 inserido, ID:', produto2.id.toString());
            
            const produto3 = await produtoModel.inserir({
                nome: 'Carregador Rápido 65W GaN',
                descricao: 'Carregador USB-C com tecnologia GaN',
                preco: 129.99,
                estoque: 30,
                categoria: 'Acessórios'
            });
            produtoIds.push(produto3.id);
            console.log('Produto 3 inserido, ID:', produto3.id.toString());
            
            const produto4 = await produtoModel.inserir({
                nome: 'Smartwatch Fitness',
                descricao: 'Relógio inteligente com monitor cardíaco',
                preco: 599.99,
                estoque: 20,
                categoria: 'Wearables'
            });
            produtoIds.push(produto4.id);
            console.log('Produto 4 inserido, ID:', produto4.id.toString());
            
        } catch (error) {
            console.error('Erro ao inserir produtos:', error.message);
        }
        
        // TESTE 4: Testar validação de produto
        console.log('\nTESTE 4: Testar validação de produto');
        try {
            await produtoModel.inserir({
                nome: 'Produto Inválido',
                // preco faltando
                estoque: 5
            });
        } catch (error) {
            console.log('Validação de produto funcionou:', error.message);
        }
        
        // TESTE 5: Buscar todos os produtos
        console.log('\nTESTE 5: Buscar todos os produtos');
        try {
            const produtos = await produtoModel.buscarTodos();
            console.log(`${produtos.length} produtos encontrados:`);
            produtos.forEach(p => {
                console.log(`   - ${p.nome}: R$ ${p.preco} (Estoque: ${p.estoque})`);
            });
        } catch (error) {
            console.error('Erro ao buscar produtos:', error.message);
        }
        
        // TESTE 6: Buscar produtos por categoria
        console.log('\nTESTE 6: Buscar produtos por categoria');
        try {
            const acessorios = await produtoModel.buscarPorCategoria('Acessórios');
            console.log(`${acessorios.length} produtos na categoria Acessórios`);
            acessorios.forEach(p => console.log(`   - ${p.nome}`));
        } catch (error) {
            console.error('Erro na busca por categoria:', error.message);
        }
        
        // TESTE 7: Busca textual
        console.log('\nTESTE 7: Busca textual');
        try {
            const resultados = await produtoModel.buscarTexto('smart');
            console.log(`${resultados.length} resultados para "smart":`);
            resultados.forEach(p => console.log(`   - ${p.nome}`));
        } catch (error) {
            console.error('Erro na busca textual:', error.message);
        }
        
        // TESTE 8: Buscar produtos por faixa de preço
        console.log('\nTESTE 8: Buscar produtos por faixa de preço');
        try {
            const produtos = await produtoModel.buscarPorPreco(100, 500);
            console.log(`${produtos.length} produtos entre R$100 e R$500`);
        } catch (error) {
            console.error('Erro na busca por preço:', error.message);
        }
        
        // TESTE 9: Buscar cliente por ID
        console.log('\nTESTE 9: Buscar cliente por ID');
        try {
            const cliente = await clienteModel.buscarPorId(clienteId);
            if (cliente) {
                console.log('Cliente encontrado:', cliente.nome, '-', cliente.email);
            }
        } catch (error) {
            console.error('Erro ao buscar cliente:', error.message);
        }
        
        // TESTE 10: Criar pedido
        console.log('\nTESTE 10: Criar pedido');
        try {
            const pedido = await pedidoModel.criarPedido(clienteId, [
                { produtoId: produtoIds[0], quantidade: 1 },
                { produtoId: produtoIds[1], quantidade: 2 }
            ]);
            console.log('Pedido criado com sucesso');
        } catch (error) {
            console.error('Erro ao criar pedido:', error.message);
        }
        
        // TESTE 11: Tentar criar pedido com estoque insuficiente
        console.log('\nTESTE 11: Testar validação de estoque');
        try {
            await pedidoModel.criarPedido(clienteId, [
                { produtoId: produtoIds[0], quantidade: 100 }
            ]);
        } catch (error) {
            console.log('Validação de estoque funcionou:', error.message);
        }
        
        // TESTE 12: Buscar pedidos por cliente
        console.log('\nTESTE 12: Buscar pedidos por cliente');
        try {
            const pedidos = await pedidoModel.buscarPorCliente(clienteId);
            console.log(`${pedidos.length} pedidos encontrados para o cliente`);
            pedidos.forEach(p => {
                console.log(`   - Pedido #${p._id}: R$ ${p.valorTotal} - Status: ${p.status}`);
                console.log(`     ${p.itens.length} item(ns):`);
                p.itens.forEach(item => {
                    console.log(`       • ${item.quantidade}x ${item.produtoNome} = R$ ${item.subtotal}`);
                });
            });
        } catch (error) {
            console.error('Erro ao buscar pedidos:', error.message);
        }
        
        // TESTE 13: Buscar pedido por ID
        console.log('\nTESTE 13: Buscar pedido por ID');
        try {
            const pedidos = await pedidoModel.buscarPorCliente(clienteId);
            if (pedidos.length > 0) {
                const pedido = await pedidoModel.buscarPorId(pedidos[0]._id);
                if (pedido) {
                    console.log(`   Pedido #${pedido._id}`);
                    console.log(`   Cliente: ${pedido.clienteNome}`);
                    console.log(`   Total: R$ ${pedido.valorTotal}`);
                    console.log(`   Status: ${pedido.status}`);
                    console.log(`   Histórico: ${pedido.historicoStatus.length} alterações`);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar pedido:', error.message);
        }
        
        // TESTE 14: Atualizar status do pedido
        console.log('\nTESTE 14: Atualizar status do pedido');
        try {
            const pedidos = await pedidoModel.buscarPorCliente(clienteId);
            if (pedidos.length > 0) {
                const result = await pedidoModel.atualizarStatus(pedidos[0]._id, 'pago', 'Pagamento aprovado');
                console.log('Status atualizado para "pago"');
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error.message);
        }
        
        // TESTE 15: Buscar pedidos por status
        console.log('\nTESTE 15: Buscar pedidos por status');
        try {
            const pedidosPagos = await pedidoModel.buscarPorStatus('pago');
            console.log(`${pedidosPagos.length} pedidos com status "pago"`);
        } catch (error) {
            console.error('Erro na busca por status:', error.message);
        }
        
        // TESTE 16: Atualizar dados do cliente
        console.log('\nTESTE 16: Atualizar dados do cliente');
        try {
            const result = await clienteModel.atualizarDados(clienteId, {
                endereco: 'Av. Paulista, 1000 - São Paulo/SP',
                nome: 'João Pedro Silva'
            });
            console.log('Cliente atualizado:', result);
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error.message);
        }
        
        // TESTE 17: Atualizar estoque do produto
        console.log('\nTESTE 17: Atualizar estoque do produto');
        try {
            const result = await produtoModel.atualizarEstoque(produtoIds[0], -2);
            console.log('Estoque atualizado:', result);
        } catch (error) {
            console.error('Erro ao atualizar estoque:', error.message);
        }
        
        // TESTE 18: Resumo de vendas
        console.log('\nTESTE 18: Resumo de vendas');
        try {
            const resumo = await pedidoModel.obterResumoVendas();
            console.log('   Resumo de vendas:');
            console.log(`   Total de pedidos: ${resumo.totalPedidos}`);
            console.log(`   Total vendas: R$ ${resumo.totalVendas.toFixed(2)}`);
            console.log(`   Ticket médio: R$ ${resumo.ticketMedio.toFixed(2)}`);
            if (resumo.produtosMaisVendidos.length > 0) {
                console.log('   Produtos mais vendidos:');
                resumo.produtosMaisVendidos.forEach(p => {
                    console.log(`     • ${p.produtoNome}: ${p.quantidade} unidade(s) - R$ ${p.receita.toFixed(2)}`);
                });
            }
        } catch (error) {
            console.error('Erro ao gerar resumo:', error.message);
        }
        
        // TESTE 19: Cancelar pedido
        console.log('\nTESTE 19: Cancelar pedido');
        try {
            const pedidos = await pedidoModel.buscarPorCliente(clienteId);
            if (pedidos.length > 0 && pedidos[0].status !== 'entregue') {
                const result = await pedidoModel.cancelarPedido(pedidos[0]._id, 'Cliente desistiu da compra');
                console.log('Pedido cancelado com sucesso');
            }
        } catch (error) {
            console.error('Erro ao cancelar pedido:', error.message);
        }
        
        // TESTE 20: Buscar pedidos por período
        console.log('\nTESTE 20: Buscar pedidos por período');
        try {
            const inicio = new Date();
            inicio.setMonth(inicio.getMonth() - 1);
            const pedidos = await pedidoModel.buscarPorPeriodo(inicio, new Date());
            console.log(`${pedidos.length} pedidos no último mês`);
        } catch (error) {
            console.error('Erro na busca por período:', error.message);
        }
        
        console.log('\n Todos os testes foram executados com sucesso!');
        console.log(' Verifique a pasta "logs" para arquivos de erro e informações.');
        console.log('\n Estatísticas finais:');
        
        const totalClientes = await clienteModel.buscarTodos();
        const totalProdutos = await produtoModel.buscarTodos();
        const totalPedidos = await pedidoModel.buscarTodos();
        
        console.log(`   - Clientes ativos: ${totalClientes.length}`);
        console.log(`   - Produtos ativos: ${totalProdutos.length}`);
        console.log(`   - Total de pedidos: ${totalPedidos.length}`);
        
    } catch (error) {
        console.error('Erro fatal durante os testes:', error.message);
        logger.logException(error, 'TestesSistema');
    } finally {
        await db.close();
    }
}

// Executar testes
testarSistema();
