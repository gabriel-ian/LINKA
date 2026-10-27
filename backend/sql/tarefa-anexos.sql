-- Arquivos anexados as tarefas pelo professor (PDF, PNG, JPG, DOC, DOCX).
-- O arquivo fica em backend/uploads/tarefas; aqui so o nome e os dados.
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/tarefa-anexos.sql

USE bancolinka;

CREATE TABLE IF NOT EXISTS tarefa_anexo (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tarefa_id BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  arquivo VARCHAR(100) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  tamanho INT UNSIGNED NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_tarefa_anexo_tarefa (tarefa_id),
  CONSTRAINT fk_tarefa_anexo_tarefa FOREIGN KEY (tarefa_id) REFERENCES tarefa (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
