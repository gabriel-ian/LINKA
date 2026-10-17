-- Migracao: painel do Professor (telas do Figma).
--
-- - tarefa_adaptada ganha os passos (JSON) e os recursos usados pela IA,
--   alem de uma linha unica por (tarefa, aluno) para permitir regerar/editar.
-- - comunicado: avisos do professor para uma turma (alunos e familias),
--   com versao simplificada opcional para alunos NEE.
-- - comunicado_leitura: quando cada familia abriu o aviso (preenchido
--   pelas telas da Familia).
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/painel-professor.sql

USE bancolinka;

ALTER TABLE tarefa_adaptada
  ADD COLUMN passos JSON NULL AFTER descricao_adaptada,
  ADD COLUMN recursos JSON NULL AFTER passos,
  ADD COLUMN atualizado_em DATETIME NULL AFTER criado_em,
  ADD UNIQUE KEY uq_tarefa_adaptada_tarefa_aluno (tarefa_id, aluno_id);

CREATE TABLE IF NOT EXISTS comunicado (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  escola_id BIGINT UNSIGNED NOT NULL,
  professor_id BIGINT UNSIGNED NOT NULL,
  turma_id BIGINT UNSIGNED NOT NULL,
  tipo ENUM('atividade', 'evento', 'material', 'aviso') NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  mensagem TEXT NOT NULL,
  versao_simplificada TEXT NULL,
  rascunho TINYINT(1) NOT NULL DEFAULT 0,
  enviado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comunicado_escola FOREIGN KEY (escola_id) REFERENCES escola (id),
  CONSTRAINT fk_comunicado_professor FOREIGN KEY (professor_id) REFERENCES professor (id),
  CONSTRAINT fk_comunicado_turma FOREIGN KEY (turma_id) REFERENCES turma (id)
);

CREATE TABLE IF NOT EXISTS comunicado_leitura (
  comunicado_id BIGINT UNSIGNED NOT NULL,
  responsavel_id BIGINT UNSIGNED NOT NULL,
  lido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comunicado_id, responsavel_id),
  CONSTRAINT fk_leitura_comunicado FOREIGN KEY (comunicado_id) REFERENCES comunicado (id),
  CONSTRAINT fk_leitura_responsavel FOREIGN KEY (responsavel_id) REFERENCES responsavel (id)
);
