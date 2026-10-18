# Linka

Plataforma educacional de apoio a alunos com necessidades educacionais especiais
(TDAH, TEA, dislexia, discalculia, deficiências visual e auditiva). O professor
escreve a tarefa uma vez e a Linka adapta para cada aluno, em passos curtos.

| Perfil      | O que faz                                                                 |
| ----------- | ------------------------------------------------------------------------- |
| ADM         | Cadastra, atualiza, desativa e reativa escolas                            |
| Escola      | Cadastra professores, turmas, alunos e famílias; acompanha relatórios     |
| Professor   | Cria tarefas (adaptadas por IA), envia comunicados, acompanha a turma     |
| Aluno       | Segue as tarefas passo a passo, pede ajuda, vê progresso e conquistas     |
| Família     | Acompanha os filhos, recebe avisos e o resumo da semana, envia incentivos |

## Estrutura

```
backend/    API em NestJS + TypeORM (MySQL)        -> http://localhost:3000
frontend/   Angular                                -> http://localhost:4200
backend/sql Estrutura do banco, dados base e migrações
```

## Pré-requisitos

- Node.js 22 ou mais novo
- MySQL 8

## Como rodar

### 1. Banco de dados

Em uma instalação nova, crie o banco com a estrutura completa e os dados iniciais:

```bash
mysql -u root -p < backend/sql/schema.sql
mysql -u root -p bancolinka < backend/sql/dados-base.sql
mysql -u root -p bancolinka < backend/sql/seed-admin.sql
```

`schema.sql` já inclui todas as migrações da pasta `backend/sql`. As migrações
avulsas (`painel-escola.sql`, `familias.sql`...) só servem para atualizar um banco
antigo.

Banco que já existia antes do "Esqueci minha senha"? Rode também:

```bash
mysql -u root -p bancolinka < backend/sql/senha-reset.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env     # preencha DB_PASSWORD e JWT_SECRET
npm install
npm run start
```

> No Windows, prefira `npm run start` a `npm run start:dev`: o modo watch às vezes
> deixa a porta 3000 presa com o código antigo.

A documentação da API (Swagger) fica em http://localhost:3000/api.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Abra http://localhost:4200.

## Acessos de teste

Criados pelo `seed-admin.sql`, todos com a senha `linka123`:

| Perfil | E-mail           | Entrada                            |
| ------ | ---------------- | ---------------------------------- |
| ADM    | admin@linka.com  | http://localhost:4200/adm/login    |
| Escola | escola@linka.com | http://localhost:4200/login        |

Professores, alunos e famílias são cadastrados pela escola e recebem uma senha
provisória, trocada no primeiro acesso.

Para encher a escola com dados fictícios (famílias e alunos gerados com Faker):

```bash
cd backend
npm run seed:faker                          # 150 alunos na escola 1
npm run seed:faker -- --alunos=200 --escola=1
npm run seed:faker -- --limpar              # apaga só o que a carga criou
```

As famílias geradas entram com a senha `linka123`.

## Variáveis de ambiente (backend/.env)

| Variável            | Para que serve                                         |
| ------------------- | ------------------------------------------------------ |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão com o MySQL |
| `DB_LOGGING`        | `true` mostra as consultas SQL no terminal             |
| `JWT_SECRET`        | Segredo dos tokens de login (use um valor longo)       |
| `JWT_EXPIRES_IN`    | Validade do login (ex.: `1d`)                          |
| `FRONTEND_URL`      | Origem liberada no CORS                                |
| `PORT`              | Porta da API (padrão 3000)                             |
| `ANTHROPIC_API_KEY` | Opcional. Liga a adaptação de tarefas e comunicados por IA (Claude). Sem ela, o professor adapta manualmente |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Opcionais. Ligam os e-mails: senha de acesso, "Esqueci minha senha" e o resumo semanal das famílias (domingo às 18h). Sem `SMTP_HOST`, nada é enviado e o conteúdo aparece no terminal |

O endereço da API usado pelo frontend fica em
`frontend/src/environments/environment*.ts`.

## Testes e qualidade

```bash
cd backend
npm test          # testes unitários (Jest)
npm run lint

cd frontend
npm run build
```

## Privacidade

- Laudos enviados ficam em `backend/uploads/`, fora do git, porque contêm dados de saúde.
- A IA recebe só o primeiro nome, a idade, os diagnósticos e os interesses do aluno.
  Nunca recebe CGM, laudo ou e-mail.
