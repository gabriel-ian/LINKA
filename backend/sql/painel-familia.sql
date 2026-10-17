-- Migracao: telas da familia (Figma "Familia - ...").
--
-- incentivo: mensagem curta da familia para o filho ("Enviar incentivo"),
-- lida pelo mascote na tela do aluno. Quando ha incentivo para a tarefa (ou
-- um geral no mesmo dia) antes de o aluno comecar, a tarefa conta como
-- "iniciou com lembrete" em vez de "iniciou sozinho".
--
-- responsavel.preferencias: avisos escolhidos em Configuracoes.
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/painel-familia.sql

USE bancolinka;

CREATE TABLE IF NOT EXISTS incentivo (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  responsavel_id BIGINT UNSIGNED NOT NULL,
  aluno_id BIGINT UNSIGNED NOT NULL,
  tarefa_id BIGINT UNSIGNED NULL,
  mensagem VARCHAR(300) NOT NULL,
  voz TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lido_em DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_incentivo_aluno (aluno_id, criado_em),
  CONSTRAINT fk_incentivo_responsavel FOREIGN KEY (responsavel_id) REFERENCES responsavel (id),
  CONSTRAINT fk_incentivo_aluno FOREIGN KEY (aluno_id) REFERENCES aluno (id),
  CONSTRAINT fk_incentivo_tarefa FOREIGN KEY (tarefa_id) REFERENCES tarefa (id)
);

ALTER TABLE responsavel
  ADD COLUMN preferencias JSON NULL AFTER parentesco;
