-- Migracao: LGPD (dados de saude de criancas e adolescentes).
--
-- consentimento: aceite do termo pela familia (qual versao e quando).
-- lgpd_pedido:   pedidos da familia (ex.: exclusao dos dados do filho).
-- laudo_acesso:  quem enviou ou baixou cada laudo, e quando.
-- aluno.anonimizado_em: dados pessoais apagados a pedido (fica so o
--                aluno anonimo, para os numeros dos relatorios).
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/lgpd.sql

USE bancolinka;

CREATE TABLE consentimento (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  responsavel_id BIGINT UNSIGNED NOT NULL,
  versao VARCHAR(20) NOT NULL,
  aceito_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45) NULL,
  PRIMARY KEY (id),
  KEY fk_consentimento_responsavel (responsavel_id),
  CONSTRAINT fk_consentimento_responsavel FOREIGN KEY (responsavel_id) REFERENCES responsavel (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lgpd_pedido (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aluno_id BIGINT UNSIGNED NOT NULL,
  responsavel_id BIGINT UNSIGNED NULL,
  tipo VARCHAR(20) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atendido_em DATETIME NULL,
  PRIMARY KEY (id),
  KEY fk_lgpd_pedido_aluno (aluno_id),
  KEY fk_lgpd_pedido_responsavel (responsavel_id),
  CONSTRAINT fk_lgpd_pedido_aluno FOREIGN KEY (aluno_id) REFERENCES aluno (id) ON DELETE CASCADE,
  CONSTRAINT fk_lgpd_pedido_responsavel FOREIGN KEY (responsavel_id) REFERENCES responsavel (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE laudo_acesso (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aluno_id BIGINT UNSIGNED NOT NULL,
  usuario_id BIGINT UNSIGNED NULL,
  acao VARCHAR(20) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_laudo_acesso_aluno (aluno_id),
  KEY fk_laudo_acesso_usuario (usuario_id),
  CONSTRAINT fk_laudo_acesso_aluno FOREIGN KEY (aluno_id) REFERENCES aluno (id) ON DELETE CASCADE,
  CONSTRAINT fk_laudo_acesso_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE aluno ADD COLUMN anonimizado_em DATETIME NULL AFTER ativo;
