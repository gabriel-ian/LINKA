-- Seed inicial do Linka.
-- Senha de todos os usuarios abaixo: linka123
-- Troque as senhas depois do primeiro login.
--
-- Rode com:  mysql -u root -p bancolinka < backend/sql/seed-admin.sql

USE bancolinka;

-- Escola de exemplo
INSERT INTO escola (nome, cnpj)
VALUES ('Colegio Nova Esperanca', '12.345.678/0001-90');

SET @escola_id = LAST_INSERT_ID();

-- Admin da Linka: nao pertence a nenhuma escola
INSERT INTO usuario (email, senha, perfil, escola_id) VALUES
  ('admin@linka.com', '$2b$10$zwsKfmkexjY/awdaozJ/m.7sxbJLuqwkmeEePvWhGuhN4LjBub5Ii', 'admin', NULL);

-- Login da escola criada acima
INSERT INTO usuario (email, senha, perfil, escola_id) VALUES
  ('escola@linka.com', '$2b$10$zwsKfmkexjY/awdaozJ/m.7sxbJLuqwkmeEePvWhGuhN4LjBub5Ii', 'escola', @escola_id);

SELECT id, email, perfil, escola_id FROM usuario;
