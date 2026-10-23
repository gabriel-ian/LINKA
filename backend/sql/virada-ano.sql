-- Migracao: virada do ano letivo.
--
-- Na virada, as turmas do ano que terminou ficam encerradas: somem das telas
-- do dia a dia (cadastros, professor, adicionar alunos), mas continuam no
-- banco com o historico de tarefas.
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/virada-ano.sql

USE bancolinka;

ALTER TABLE turma
  ADD COLUMN encerrada TINYINT(1) NOT NULL DEFAULT 0 AFTER limite_alunos;
