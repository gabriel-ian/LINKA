-- Resposta da professora a um pedido de ajuda do aluno ("Avisar a professora").
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/ajuda-resposta.sql

USE bancolinka;

ALTER TABLE pedido_ajuda
  ADD COLUMN resposta TEXT NULL,
  ADD COLUMN respondido_em DATETIME NULL;
