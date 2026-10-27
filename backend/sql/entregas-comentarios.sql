-- Entrega com foto ou documento (aluno), comentario do professor e data em
-- que o professor editou a tarefa.
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/entregas-comentarios.sql

USE bancolinka;

-- Foto ou documento da tarefa feita (arquivo em backend/uploads/entregas).
CREATE TABLE IF NOT EXISTS tarefa_entrega_arquivo (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tarefa_id BIGINT UNSIGNED NOT NULL,
  aluno_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  arquivo VARCHAR(120) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  tamanho INT UNSIGNED NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_entrega_arquivo_tarefa (tarefa_id),
  KEY fk_entrega_arquivo_aluno (aluno_id),
  CONSTRAINT fk_entrega_arquivo_tarefa FOREIGN KEY (tarefa_id) REFERENCES tarefa (id) ON DELETE CASCADE,
  CONSTRAINT fk_entrega_arquivo_aluno FOREIGN KEY (aluno_id) REFERENCES aluno (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Comentario ou correcao do professor sobre a entrega (aluno e familia veem).
ALTER TABLE tarefa_status
  ADD COLUMN comentario TEXT NULL,
  ADD COLUMN comentario_em DATETIME NULL;

-- Quando o professor editou a tarefa pela ultima vez.
ALTER TABLE tarefa ADD COLUMN atualizada_em DATETIME NULL;
