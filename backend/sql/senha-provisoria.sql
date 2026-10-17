-- Migracao: primeiro acesso com senha provisoria.
--
-- Toda senha definida por outra pessoa (cadastro feito pela escola ou ADM,
-- ou redefinicao pelo painel) fica marcada como provisoria. No login, o
-- usuario e convidado a criar a propria senha ou manter a recebida.
--
-- Rode UMA vez com:  mysql -u root -p bancolinka < backend/sql/senha-provisoria.sql

USE bancolinka;

ALTER TABLE usuario
  ADD COLUMN senha_provisoria TINYINT(1) NOT NULL DEFAULT 0 AFTER senha;
