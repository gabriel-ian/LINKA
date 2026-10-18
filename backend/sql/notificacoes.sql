-- Migracao: avisos por e-mail para a familia.
--
-- Guarda cada aviso ja enviado para nao repetir (ex.: o lembrete de tarefa
-- nao iniciada e conferido a cada 15 minutos, mas sai uma vez por dia).
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/notificacoes.sql

USE bancolinka;

CREATE TABLE notificacao_enviada (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  responsavel_id BIGINT UNSIGNED NOT NULL,
  tipo VARCHAR(30) NOT NULL,
  aluno_id BIGINT UNSIGNED NOT NULL,
  tarefa_id BIGINT UNSIGNED NOT NULL,
  dia DATE NOT NULL,
  enviado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_notificacao (responsavel_id, tipo, aluno_id, tarefa_id, dia),
  CONSTRAINT fk_notificacao_responsavel FOREIGN KEY (responsavel_id) REFERENCES responsavel (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
