# To-Do List

[Breve descrição do seu projeto aqui]

## Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas na sua máquina:

* [Node.js](https://nodejs.org/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Configurando a aplicação para rodar localmente

### 1. Clone o Repositório

```bash
git clone https://github.com/mteusbarbosa/todo.git
cd todo
```

### 2. Instale as Dependências

Instale as dependências do projeto listadas no package.json:

```bash
npm install
```

### 3. Configure as Variáveis de Ambiente

Este projeto utiliza variáveis de ambiente para configurar a conexão com o banco de dados e outras configurações. Como o arquivo .env não está incluído no repositório por segurança, você precisará criá-lo manualmente.

* Crie um arquivo chamado .env na raiz do projeto.
* Copie o conteúdo abaixo para o seu arquivo .env e substitua os valores pelos seus próprios (escolha o nome do usuário e senha para o banco de dados).

```dotenv
# Configurações do Banco de Dados (PostgreSQL via Docker)
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=todo-postgres
DB_PORT_HOST=5432 # Porta no seu PC para acessar o banco (mude se 5432 já estiver ocupada)

# String de conexão para a aplicação
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT_HOST}/${DB_NAME}"
```

### 4. Configure e Inicie o Banco de Dados (Docker)

Usamos Docker Compose para gerenciar o container do banco de dados PostgreSQL.

* Certifique-se de que o Docker Desktop esteja em execução.
* No terminal, na raiz do projeto (onde está o arquivo docker-compose.yml), execute o seguinte comando para baixar a imagem do PostgreSQL (se ainda não tiver) e iniciar o container em segundo plano:

```bash
docker compose up -d
```

* Você pode verificar se o container está rodando com:

```bash
docker ps
```

Você deverá ver um container chamado `todo-postgres`.

### 5. Execute as Migrações do Banco de Dados

Com o banco de dados rodando no Docker, precisamos criar as tabelas e a estrutura inicial definidas no Prisma.schema:

```bash
npx prisma migrate dev --name init
```

### 6. Execute

Finalmente, inicie o servidor de desenvolvimento para visualizar o projeto:

```bash
npm run dev
```
