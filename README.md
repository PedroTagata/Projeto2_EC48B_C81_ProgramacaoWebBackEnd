# Projeto 2 - Web App de E-commerce (AliExpress)

**Aluno:** Pedro Henrique Tagata Ferreira | **RA:** 1884476

Este é o Projeto 2 da disciplina **Programação Web Back-End (EC48B-C81)**. Trata-se da implementação de uma aplicação web completa de e-commerce, utilizando **Node.js, Express, MongoDB** e o padrão MVC, como continuação do Projeto 1.

---

## Funcionalidades

*   **Autenticação de Usuários**: Cadastro (`/register`) e login (`/login`) com sessões HTTP.
*   **Clientes (`/clientes`)**: Listagem, cadastro, edição e remoção (soft delete) de clientes.
*   **Produtos (`/produtos`)**: CRUD completo, com busca textual, filtros por categoria e faixa de preço, e controle de estoque.
*   **Pedidos (`/pedidos`)**: Criação de pedidos com múltiplos itens, rastreamento de status (pendente, pago, enviado, entregue, cancelado), histórico de alterações e relatório de vendas.
*   **Logs de Sistema**: Registro de erros e informações em arquivos na pasta `logs/`.

---

## Como Executar o Projeto

1.  **Pré-requisitos**: Tenha o **Node.js** e o **MongoDB** instalados em sua máquina.
2.  **Clone o Repositório**:
    ```bash
    git clone https://github.com/PedroTagata/Projeto2_EC48B_C81_ProgramacaoWebBackEnd.git
    cd Projeto2_EC48B_C81_ProgramacaoWebBackEnd
    ```
3. Istale as Dependências:
   ```bash
   npm install
   ```
5.Configure as Variáveis de Ambiente: Crie um arquivo .env na raiz do projeto com as seguintes variáveis (ajuste conforme sua configuração local do MongoDB):
   ```bash
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=ecommerce_db
SESSION_SECRET=seu_segredo_aqui
PORT=3000
 ```
6. Inicie o Servidor MongoDB:
    ```bash
    mongod
     ```
7.Execute a Aplicação:
 ```bash
npm start
 ```
A aplicação estará disponivel em http://localhost:3000.

##Estrutura do Projeto
 ```bash
projeto-ecommerce-web/
├── src/
│   ├── db/            # Conexão com o MongoDB
│   ├── models/        # Classes Cliente, Produto, Pedido
│   ├── routes/        # Rotas da aplicação (autenticação, clientes, produtos, pedidos)
│   ├── middlewares/   # Middleware de autenticação
│   ├── utils/         # Logger do sistema
│   └── views/         # Templates EJS (layouts, autenticação, CRUDs, relatórios)
├── public/            # Arquivos estáticos (CSS)
├── logs/              # Arquivos de log gerados pela aplicação
├── .env               # Configurações de ambiente (não versionado)
├── package.json
├── server.js
└── README.md
```
