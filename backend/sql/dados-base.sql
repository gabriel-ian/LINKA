-- Listas fixas usadas nos cadastros (diagnosticos e disciplinas).
-- Pode rodar mais de uma vez: so insere o que ainda nao existe.
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/dados-base.sql

USE bancolinka;

INSERT INTO neurodivergencia (nome)
SELECT n.nome FROM (
  SELECT 'TDAH' AS nome UNION ALL SELECT 'TEA' UNION ALL SELECT 'Dislexia'
  UNION ALL SELECT 'Discalculia' UNION ALL SELECT 'Deficiência visual'
  UNION ALL SELECT 'Deficiência auditiva' UNION ALL SELECT 'Outro'
) n
WHERE NOT EXISTS (SELECT 1 FROM neurodivergencia x WHERE x.nome = n.nome);

INSERT INTO disciplina (nome)
SELECT d.nome FROM (
  SELECT 'Matemática' AS nome UNION ALL SELECT 'Ciências' UNION ALL SELECT 'Português'
  UNION ALL SELECT 'História' UNION ALL SELECT 'Geografia' UNION ALL SELECT 'Ed. Física'
  UNION ALL SELECT 'Inglês' UNION ALL SELECT 'Artes'
) d
WHERE NOT EXISTS (SELECT 1 FROM disciplina x WHERE x.nome = d.nome);
