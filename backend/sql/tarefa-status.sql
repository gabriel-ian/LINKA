-- Migracao: status da tarefa por aluno (pendente/concluida).
--
-- Sem esta tabela nao ha como o aluno (via responsavel) acompanhar o
-- proprio progresso, que e a proposta central do Linka (ver APLICAR.md).
--
-- Chave primaria composta (aluno_id, tarefa_id), mesmo padrao de
-- `matricula`: um aluno tem no maximo um status por tarefa, e a PK
-- composta ja impede duplicata no proprio banco.
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/tarefa-status.sql

USE bancolinka;

CREATE TABLE IF NOT EXISTS tarefa_status (
  aluno_id BIGINT UNSIGNED NOT NULL,
  tarefa_id BIGINT UNSIGNED NOT NULL,
  status ENUM('pendente', 'concluida') NOT NULL DEFAULT 'pendente',
  concluido_em DATETIME NULL,
  PRIMARY KEY (aluno_id, tarefa_id),
  CONSTRAINT fk_tarefa_status_aluno
    FOREIGN KEY (aluno_id) REFERENCES aluno (id),
  CONSTRAINT fk_tarefa_status_tarefa
    FOREIGN KEY (tarefa_id) REFERENCES tarefa (id)
);
