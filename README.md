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

Banco que já existia antes do "Esqueci minha senha", dos avisos por e-mail, da virada do ano letivo, da LGPD e das respostas/avisos do aluno? Rode também:

```bash
mysql -u root -p bancolinka < backend/sql/senha-reset.sql
mysql -u root -p bancolinka < backend/sql/notificacoes.sql
mysql -u root -p bancolinka < backend/sql/virada-ano.sql
mysql -u root -p bancolinka < backend/sql/lgpd.sql
mysql -u root -p bancolinka < backend/sql/avisos-entregas.sql
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

## Rodar com Docker

Sobe o MySQL, a API e o site de uma vez (precisa do Docker Desktop):

```bash
cp .env.docker.example .env.docker      # preencha as senhas e o JWT_SECRET
docker compose --env-file .env.docker up -d --build
```

- Site em http://localhost:8080; a API fica em `/api` (Swagger em `/api/api`).
- Na primeira subida o banco é criado com `schema.sql`, `dados-base.sql` e
  `seed-admin.sql` (acessos de teste abaixo).
- Os dados do MySQL e os laudos ficam nos volumes `mysql-dados` e `laudos`:
  inclua os dois no backup.
- Em produção, coloque um HTTPS na frente (Caddy, Traefik ou o proxy da
  hospedagem) e ajuste `SITE_URL` para o endereço público, que vai nos links
  dos e-mails.

O build de produção do site (`npx ng build`) chama a API em `/api` no mesmo
endereço; o `frontend/nginx.conf` faz esse repasse. No `npm start` (ng serve)
a API continua em http://localhost:3000.

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
| `ANTHROPIC_API_KEY` | Opcional. Liga a adaptação de tarefas e comunicados por IA (Claude). Sem IA, o professor adapta manualmente |
| `IA_URL`, `IA_MODELO`, `IA_CHAVE` | Opcional, alternativa ao Claude: qualquer serviço no formato da OpenAI (Groq, Gemini, OpenRouter, Ollama). Exemplos no `backend/.env.example`. Antes de usar com dados reais, confira se o serviço não usa os dados para treinar modelos |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Opcionais. Ligam os e-mails: senha de acesso, "Esqueci minha senha", o resumo semanal das famílias (domingo às 18h) e os avisos que a família liga em Configurações (tarefa não iniciada, tarefa concluída e avisos da escola). Sem `SMTP_HOST`, nada é enviado e o conteúdo aparece no terminal |

O endereço da API usado pelo frontend fica em
`frontend/src/environments/environment*.ts` (`/api` no build de produção).

## Testes e qualidade

```bash
cd backend
npm test          # testes unitários (Jest)
npm run lint

cd frontend
npx ng test --watch=false   # testes unitários (Vitest)
npm run build
```

### Testes de navegador (e2e)

Fluxos completos com o Playwright: login de cada perfil, cadastro de família,
adicionar aluno à turma, professor vendo a turma, aluno fazendo a tarefa e o
modo sem internet.

```bash
cd e2e
npm install
npx playwright test     # sobe backend e frontend sozinho (ou usa os que já estão rodando)
```

Cada execução cria uma escola própria ("Escola E2E ...") e apaga tudo dela no
fim; os dados reais não são tocados. Se sobrar alguma, `npm run limpar`.
No Windows usa o Edge; para usar o Chromium do Playwright, defina
`E2E_CHROMIUM=1` e rode `npx playwright install chromium`.

### CI

O GitHub Actions (`.github/workflows/ci.yml`) roda em cada PR e na `main`:
lint, formatação, testes e build do backend e do frontend e, se passarem, os
testes de navegador com um MySQL novo.

## Privacidade (LGPD)

- Laudos enviados ficam em `backend/uploads/`, fora do git, porque contêm dados de saúde.
  Cada envio e download fica registrado (quem e quando) e aparece no perfil do aluno.
- A IA recebe só o primeiro nome, a idade, os diagnósticos e os interesses do aluno.
  Nunca recebe CGM, laudo ou e-mail.
- Termo de uso e privacidade em `/privacidade` (link no login). A família aceita no
  primeiro acesso; o aceite fica gravado com a versão. Para publicar um texto novo,
  mude o termo em `frontend/src/app/shared/termo/termo-texto.ts` e suba a versão
  lá e em `backend/src/lgpd/lgpd.service.ts`: todas as famílias aceitam de novo.
  **O texto atual é um rascunho e precisa de revisão jurídica.**
- Direito de acesso: a escola (perfil do aluno) e a família (Configurações) baixam
  uma cópia de todos os dados do aluno em JSON.
- Exclusão: a família pede em Configurações; a escola recebe por e-mail e no perfil
  do aluno e apaga os dados (nome, CGM, nascimento, diagnósticos, laudo, perfil de
  aprendizagem, login, recados e vínculo com a família). Fica só um registro anônimo
  com o andamento das tarefas, para os números da turma.
