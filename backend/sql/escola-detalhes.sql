-- Migracao: dados completos da escola para o painel ADM (telas do Figma).
--
-- O cadastro/edicao de escola no Figma pede INEP, endereco, cidade/UF,
-- responsavel, telefone, plano e limites; a tela de desativar guarda
-- motivo, data e observacao. A tela de reativar lista esses dados.
--
-- usuario.ultimo_login permite mostrar a escola como "Pendente"
-- ate o primeiro acesso da coordenacao.
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/escola-detalhes.sql

USE bancolinka;

ALTER TABLE escola
  ADD COLUMN inep CHAR(8) NULL AFTER cnpj,
  ADD COLUMN endereco VARCHAR(255) NULL AFTER inep,
  ADD COLUMN cidade VARCHAR(120) NULL AFTER endereco,
  ADD COLUMN uf CHAR(2) NULL AFTER cidade,
  ADD COLUMN responsavel VARCHAR(255) NULL AFTER uf,
  ADD COLUMN telefone VARCHAR(20) NULL AFTER responsavel,
  ADD COLUMN plano ENUM('basico', 'institucional') NOT NULL DEFAULT 'basico' AFTER telefone,
  ADD COLUMN limite_professores INT UNSIGNED NULL AFTER plano,
  ADD COLUMN limite_alunos_nee INT UNSIGNED NULL AFTER limite_professores,
  ADD COLUMN desativada_em DATE NULL AFTER ativo,
  ADD COLUMN motivo_desativacao VARCHAR(60) NULL AFTER desativada_em,
  ADD COLUMN observacao_desativacao TEXT NULL AFTER motivo_desativacao,
  ADD COLUMN atualizado_em DATETIME NULL AFTER criado_em,
  ADD COLUMN atualizado_por VARCHAR(255) NULL AFTER atualizado_em;

ALTER TABLE usuario
  ADD COLUMN ultimo_login DATETIME NULL;
