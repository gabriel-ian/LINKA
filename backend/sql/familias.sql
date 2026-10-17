-- Migracao: cadastrar a familia antes dos filhos.
--
-- A escola agora cadastra o responsavel sozinho e, depois, cada filho
-- escolhendo essa familia. Para a escola achar "suas" familias antes de ter
-- aluno vinculado, o responsavel guarda a escola que o cadastrou. O acesso do
-- responsavel continua vindo de aluno_responsavel (pode ter filhos em outra
-- escola).
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/familias.sql

USE bancolinka;

ALTER TABLE responsavel
  ADD COLUMN escola_id BIGINT UNSIGNED NULL AFTER usuario_id,
  ADD CONSTRAINT fk_responsavel_escola FOREIGN KEY (escola_id) REFERENCES escola (id);

-- Responsaveis que ja existem: a escola do primeiro filho vinculado.
UPDATE responsavel r
   SET r.escola_id = (
     SELECT a.escola_id FROM aluno_responsavel ar
       JOIN aluno a ON a.id = ar.aluno_id
      WHERE ar.responsavel_id = r.id
      ORDER BY a.id LIMIT 1
   )
 WHERE r.escola_id IS NULL;
