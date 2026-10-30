# SaaS MVP Hackathon

Projeto único e responsivo: app Ionic React para clientes e painel web para gestores.

## Estrutura
- `backend/`: Express + TypeScript + MySQL (`mysql2/promise`), JWT e bcrypt.
- `frontend/`: Ionic React + TypeScript + Vite.
- `backend/schema.sql`: criação do banco, tabelas e serviços iniciais.

## Requisitos
Node.js 20+, MySQL 8+ e npm.

## 1. Banco
No MySQL Workbench, execute todo o conteúdo de `backend/schema.sql`.

## 2. Backend
```bash
cd backend
npm install
```
Copie `.env.example` para `.env` e ajuste as credenciais do MySQL e `JWT_SECRET`.
Para criar o usuário gestor, acrescente ao `.env`:
```env
GESTOR_NOME=Gestor
GESTOR_EMAIL=gestor@demo.com
GESTOR_SENHA=SenhaForte123
```
Depois execute:
```bash
npm run seed:gestor
npm run dev
```
API: `http://localhost:3001/api/health`

O cadastro público cria somente clientes. O perfil gestor é provisionado pelo script `seed:gestor`, evitando que qualquer visitante se cadastre como administrador.

## 3. Frontend
Em outro terminal:
```bash
cd frontend
npm install
```
Copie `.env.example` para `.env` (opcional; o padrão é `http://localhost:3001/api`).
```bash
npm run start
```
Abra `http://localhost:8100`.

## 4. Fluxo de demonstração
1. Entre como cliente, crie uma conta e faça login.
2. Solicite um dos serviços da vitrine.
3. Abra “Meus pedidos” e confira o stepper.
4. Saia e entre com o gestor configurado no `.env`.
5. No painel, altere o status para Em Análise, Confirmado e Concluído.
6. Entre novamente como cliente e confira a atualização.

## Endpoints
- `POST /api/auth/register` — cadastro de cliente.
- `POST /api/auth/login` — login e emissão de JWT.
- `GET /api/auth/me` — usuário autenticado.
- `GET /api/items` — catálogo.
- `POST /api/items` — cria item (gestor).
- `POST /api/actions` — cria solicitação (cliente).
- `GET /api/actions/user/:id` — solicitações do próprio cliente (ou gestor).
- `GET /api/actions` — todas as solicitações (gestor).
- `PATCH /api/actions/:id/status` — atualiza status (gestor).

## Regras implementadas
- Senhas armazenadas com bcrypt.
- Rotas protegidas por JWT.
- Apenas gestor pode consultar todas as solicitações e atualizar status.
- Cliente só consulta as próprias solicitações.
- Não permite solicitação ativa duplicada para o mesmo serviço.
- Respostas da API usam `{ success, data, message? }`.

## Observações para a apresentação
- A atualização é refletida ao recarregar/consultar a tela; este MVP não usa WebSocket. Se a banca exigir tempo real estrito, a próxima evolução é Socket.IO ou polling periódico.
- O frontend mantém o token em `localStorage` para simplificar a demonstração. Para produção, avaliar cookies HttpOnly, política de refresh token, rate limiting, validação com schema, logs e testes automatizados.
- O visual segue o tema dark solicitado (roxo `#7c3aed`, verde `#22c55e`) e adapta navegação/cards para mobile e tabela para desktop.
