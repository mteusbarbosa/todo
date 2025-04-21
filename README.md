# To-Do List

O **deploy** do projeto está disponível e você pode acessá-lo [aqui](https://todo-indol-omega-17.vercel).

---
O To-Do List é um projeto desenvolvido com base na T3 Stack, aproveitando seus principais conceitos e tecnologias para criar uma aplicação web moderna, eficiente e type-safe.

Tecnologias Utilizadas:

<p align="left">
  <a href="https://nextjs.org/" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js"/>
  </a>
  <a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  </a>
  <a href="https://trpc.io/" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/tRPC-3974A8?style=for-the-badge&logo=trpc&logoColor=white" alt="tRPC"/>
  </a>
  <a href="https://tailwindcss.com/" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  </a>
  <a href="https://www.prisma.io/" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma"/>
  </a>
  <a href="https://www.postgresql.org" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  </a>
  <a href="https://www.docker.com/" target="_blank" rel="noreferrer">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  </a>
</p>

* **Next.js**: Framework React para renderização no servidor e geração de sites estáticos.
* **TypeScript**: Superset do JavaScript que adiciona tipagem estática.
* **tRPC**: Para construir APIs type-safe de ponta a ponta sem a necessidade de geração de código ou schemas.
* **Tailwind CSS**: Framework CSS utility-first para estilização rápida e customizável.
* **Prisma**: ORM (Object-Relational Mapper) para interagir com o banco de dados (PostgreSQL neste caso) de forma segura e intuitiva.
* **Docker:** Plataforma para desenvolver, enviar e executar aplicações em containers.

## Configurando a aplicação para rodar localmente

### Pré-requisitos

Antes de começar, certifique-se de ter as seguintes ferramentas instaladas na sua máquina:

* [Node.js](https://nodejs.org/)
* [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Clone o Repositório

Abra o terminal em sua pasta de prefeência e execute os seguinte comandos:

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
