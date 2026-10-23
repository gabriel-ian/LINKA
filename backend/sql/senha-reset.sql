-- Migracao: "Esqueci minha senha" com link por e-mail.
--
-- Cada pedido gera um codigo aleatorio enviado por e-mail; aqui fica so o
-- hash (SHA-256) dele, para que quem ler o banco nao consiga usar o link.
-- O link vale 1 hora e serve uma unica vez.
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/senha-reset.sql

USE bancolinka;

CREATE TABLE senha_reset (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expira_em DATETIME NOT NULL,
  usado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_senha_reset_token (token_hash),
  KEY fk_senha_reset_usuario (usuario_id),
  CONSTRAINT fk_senha_reset_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
