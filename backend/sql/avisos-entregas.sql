-- Migracao: avisos para o aluno e entrega de resposta da tarefa.
--
-- comunicado_leitura_aluno: o aluno tambem ve os avisos da turma e marca
--                           como lido (a familia ja tinha comunicado_leitura).
-- tarefa_status.resposta:   o aluno pode entregar um texto (com formatacao)
--                           na tarefa; resposta_em guarda quando entregou.
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/avisos-entregas.sql

USE bancolinka;

CREATE TABLE comunicado_leitura_aluno (
  comunicado_id BIGINT UNSIGNED NOT NULL,
  aluno_id BIGINT UNSIGNED NOT NULL,
  lido_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comunicado_id, aluno_id),
  KEY fk_leitura_aluno_aluno (aluno_id),
  CONSTRAINT fk_leitura_aluno_comunicado FOREIGN KEY (comunicado_id) REFERENCES comunicado (id) ON DELETE CASCADE,
  CONSTRAINT fk_leitura_aluno_aluno FOREIGN KEY (aluno_id) REFERENCES aluno (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE tarefa_status
  ADD COLUMN resposta TEXT NULL,
  ADD COLUMN resposta_em DATETIME NULL;
