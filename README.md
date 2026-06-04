# Projeto2_EC48B_C81_ProgramacaoWebBackEnd
# Aluno: Pedro Henrique Tagata Ferreira RA:1884476
Continuação do Projeto 1 da disciplina de Programação Web Back-End (EC48B-C81)
(https://github.com/PedroTagata/Projeto1_EC48B_C81_ProgramacaoWebBackEnd.git)

## Como executar o projeto
## 1. Visitar primeira parte do projeto
Seguir os passos do projeto 1 (https://github.com/PedroTagata/Projeto1_EC48B_C81_ProgramacaoWebBackEnd.git), atualizando arquivos repetidos encotrados iguais no projeto 2

## 2. Instalar dependências
```bash
npm install
```
# 3. Iniciar MongoDB
```bash
mongod
```
# 4. Executar a aplicação
```bash
npm start
```
# Ou com nodemon para desenvolvimento
```bash
npm run dev
```

## Estrutura do Projeto
```bash
projeto-ecommerce-web/
├── src/
│   ├── db/
│   │   └── connection.js
│   ├── models/
│   │   ├── Cliente.js
│   │   ├── Produto.js
│   │   └── Pedido.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── clienteRoutes.js
│   │   ├── produtoRoutes.js
│   │   └── pedidoRoutes.js
│   ├── middlewares/
│   │   └── auth.js
│   ├── utils/
│   │   └── logger.js
│   └── views/
│       ├── layouts/
│       │   └── main.ejs
│       ├── auth/
│       │   ├── login.ejs
│       │   └── register.ejs
│       ├── clientes/
│       │   ├── index.ejs
│       │   ├── form.ejs
│       │   └── show.ejs
│       ├── produtos/
│       │   ├── index.ejs
│       │   ├── form.ejs
│       │   └── show.ejs
│       ├── pedidos/
│       │   ├── index.ejs
│       │   ├── form.ejs
│       │   ├── show.ejs
│       │   ├── meus.ejs
│       │   └── relatorio.ejs
│       ├── dashboard.ejs
│       └── error.ejs
├── public/
│   └── css/
│       └── style.css
├── logs/
├── .env
├── package.json
├── server.js
└── README.md
```
