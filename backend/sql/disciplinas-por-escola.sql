-- Disciplinas por escola: escola_id NULL = disciplina padrao (todas as
-- escolas veem); preenchido = criada por uma escola, so ela ve e usa.
-- Antes, uma disciplina criada por uma escola aparecia para todas.
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/disciplinas-por-escola.sql

USE bancolinka;

ALTER TABLE disciplina
  ADD COLUMN escola_id BIGINT UNSIGNED NULL AFTER nome,
  ADD KEY fk_disciplina_escola (escola_id),
  ADD CONSTRAINT fk_disciplina_escola FOREIGN KEY (escola_id) REFERENCES escola (id) ON DELETE CASCADE;

-- Disciplinas que ja existiam e nao sao padrao: ficam com a escola que as
-- usa (professores, turmas ou tarefas). Usadas por mais de uma escola ou
-- por nenhuma continuam visiveis para todas, como antes.
UPDATE disciplina d
JOIN (
  SELECT disciplina_id, MIN(escola_id) escola_id
    FROM (
      SELECT pd.disciplina_id, p.escola_id
        FROM professor_disciplina pd JOIN professor p ON p.id = pd.professor_id
      UNION
      SELECT tpd.disciplina_id, tu.escola_id
        FROM turma_professor_disciplina tpd JOIN turma tu ON tu.id = tpd.turma_id
       WHERE tpd.disciplina_id IS NOT NULL
      UNION
      SELECT t.disciplina_id, tu.escola_id
        FROM tarefa t JOIN turma tu ON tu.id = t.turma_id
       WHERE t.disciplina_id IS NOT NULL
    ) uso
   WHERE escola_id IS NOT NULL
   GROUP BY disciplina_id
  HAVING COUNT(DISTINCT escola_id) = 1
) u ON u.disciplina_id = d.id
SET d.escola_id = u.escola_id
WHERE d.nome NOT IN ('Matemática', 'Ciências', 'Português', 'História', 'Geografia',
                     'Ed. Física', 'Inglês', 'Artes');
