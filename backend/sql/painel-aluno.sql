-- Migracao: telas do aluno (Figma "Aluno - ...").
--
-- tarefa_status passa a guardar quando o aluno comecou a tarefa, se comecou
-- sozinho (sem lembrete/incentivo) e quantos passos ja concluiu. Pontos,
-- niveis e conquistas sao calculados a partir disso, sem tabela propria.
--
-- aluno.preferencias: como o aluno gosta de aprender (voz, letras maiores,
-- modo calmo, mascote). tarefa_adaptada.materiais: "O que voce vai precisar".
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/painel-aluno.sql

USE bancolinka;

ALTER TABLE tarefa_status
  ADD COLUMN iniciado_em DATETIME NULL AFTER status,
  ADD COLUMN iniciou_sozinho TINYINT(1) NULL AFTER iniciado_em,
  ADD COLUMN passos_feitos TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER iniciou_sozinho;

ALTER TABLE aluno
  ADD COLUMN preferencias JSON NULL AFTER interesses;

ALTER TABLE tarefa_adaptada
  ADD COLUMN materiais JSON NULL AFTER recursos;

CREATE TABLE IF NOT EXISTS aluno_lembrete (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aluno_id BIGINT UNSIGNED NOT NULL,
  texto VARCHAR(200) NOT NULL,
  quando DATETIME NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_aluno_lembrete_quando (aluno_id, quando),
  CONSTRAINT fk_aluno_lembrete_aluno
    FOREIGN KEY (aluno_id) REFERENCES aluno (id)
);

-- "Avisar a professora" na tela Precisa de ajuda.
CREATE TABLE IF NOT EXISTS pedido_ajuda (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  aluno_id BIGINT UNSIGNED NOT NULL,
  tarefa_id BIGINT UNSIGNED NOT NULL,
  passo TINYINT UNSIGNED NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  visto_em DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_pedido_ajuda_tarefa (tarefa_id),
  CONSTRAINT fk_pedido_ajuda_aluno
    FOREIGN KEY (aluno_id) REFERENCES aluno (id),
  CONSTRAINT fk_pedido_ajuda_tarefa
    FOREIGN KEY (tarefa_id) REFERENCES tarefa (id)
);
