-- Migracao: painel da Escola (telas do Figma).
--
-- - Perfil 'aluno' passa a existir em usuario (aluno faz login).
-- - usuario.ativo permite desativar professor sem apagar o historico.
-- - Turma ganha serie, letra, turno, ano letivo, sala e limite de alunos.
-- - Aluno ganha login opcional, perfil de aprendizagem e data do laudo.
-- - Responsavel ganha parentesco.
-- - Diagnosticos e disciplinas basicas para os formularios.
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/painel-escola.sql

USE bancolinka;

ALTER TABLE usuario
  MODIFY COLUMN perfil ENUM('admin', 'escola', 'professor', 'responsavel', 'aluno') NOT NULL,
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER escola_id;

ALTER TABLE turma
  ADD COLUMN serie VARCHAR(20) NULL AFTER nome,
  ADD COLUMN letra VARCHAR(5) NULL AFTER serie,
  ADD COLUMN turno ENUM('manha', 'tarde', 'noite', 'integral') NULL AFTER letra,
  ADD COLUMN ano_letivo SMALLINT UNSIGNED NULL AFTER turno,
  ADD COLUMN sala VARCHAR(50) NULL AFTER ano_letivo,
  ADD COLUMN limite_alunos INT UNSIGNED NULL AFTER sala,
  ADD COLUMN criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE aluno
  ADD COLUMN usuario_id BIGINT UNSIGNED NULL AFTER escola_id,
  ADD COLUMN laudo_enviado_em DATETIME NULL AFTER laudo,
  ADD COLUMN dificuldades TEXT NULL AFTER laudo_enviado_em,
  ADD COLUMN pontos_fortes TEXT NULL AFTER dificuldades,
  ADD COLUMN interesses VARCHAR(255) NULL AFTER pontos_fortes,
  ADD CONSTRAINT fk_aluno_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id);

ALTER TABLE responsavel
  ADD COLUMN parentesco VARCHAR(30) NULL AFTER telefone;

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
