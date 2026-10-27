-- Orientacao do professor para a IA ao adaptar a tarefa (ex.: "use exemplos
-- de futebol", "no maximo 4 passos"). Vale para todos os alunos NEE e tambem
-- quando a IA gera de novo.
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/orientacao-ia.sql

USE bancolinka;

ALTER TABLE tarefa ADD COLUMN orientacao_ia TEXT NULL;
