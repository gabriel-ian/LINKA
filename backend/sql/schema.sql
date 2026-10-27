-- Estrutura completa do banco da Linka (sem dados), ja com todas as migracoes
-- desta pasta aplicadas. Use em uma instalacao nova, no lugar das migracoes:
--
--   mysql -u root -p < backend/sql/schema.sql
--   mysql -u root -p bancolinka < backend/sql/dados-base.sql
--   mysql -u root -p bancolinka < backend/sql/seed-admin.sql
--
-- Gerado com mysqldump --no-data. Ao criar uma migracao nova, gere de novo.

CREATE DATABASE IF NOT EXISTS bancolinka CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE bancolinka;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aluno` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(255) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `cgm` varchar(50) DEFAULT NULL,
  `escola_id` bigint unsigned NOT NULL,
  `usuario_id` bigint unsigned DEFAULT NULL,
  `neurodivergente` tinyint DEFAULT '0',
  `laudo` varchar(255) DEFAULT NULL,
  `laudo_enviado_em` datetime DEFAULT NULL,
  `dificuldades` text,
  `pontos_fortes` text,
  `interesses` varchar(255) DEFAULT NULL,
  `preferencias` json DEFAULT NULL,
  `ativo` tinyint DEFAULT '1',
  `anonimizado_em` datetime DEFAULT NULL,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `escola_id` (`escola_id`),
  KEY `fk_aluno_usuario` (`usuario_id`),
  CONSTRAINT `aluno_ibfk_1` FOREIGN KEY (`escola_id`) REFERENCES `escola` (`id`),
  CONSTRAINT `fk_aluno_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aluno_lembrete` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `aluno_id` bigint unsigned NOT NULL,
  `texto` varchar(200) NOT NULL,
  `quando` datetime NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_aluno_lembrete_quando` (`aluno_id`,`quando`),
  CONSTRAINT `fk_aluno_lembrete_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aluno_neurodivergencia` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `aluno_id` bigint unsigned DEFAULT NULL,
  `neurodivergencia_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `aluno_id` (`aluno_id`),
  KEY `neurodivergencia_id` (`neurodivergencia_id`),
  CONSTRAINT `aluno_neurodivergencia_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `aluno_neurodivergencia_ibfk_2` FOREIGN KEY (`neurodivergencia_id`) REFERENCES `neurodivergencia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aluno_responsavel` (
  `aluno_id` bigint unsigned NOT NULL,
  `responsavel_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`aluno_id`,`responsavel_id`),
  KEY `responsavel_id` (`responsavel_id`),
  CONSTRAINT `aluno_responsavel_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `aluno_responsavel_ibfk_2` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comunicado` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `escola_id` bigint unsigned NOT NULL,
  `professor_id` bigint unsigned NOT NULL,
  `turma_id` bigint unsigned NOT NULL,
  `tipo` enum('atividade','evento','material','aviso') NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `mensagem` text NOT NULL,
  `versao_simplificada` text,
  `rascunho` tinyint(1) NOT NULL DEFAULT '0',
  `enviado_em` datetime DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comunicado_escola` (`escola_id`),
  KEY `fk_comunicado_professor` (`professor_id`),
  KEY `fk_comunicado_turma` (`turma_id`),
  CONSTRAINT `fk_comunicado_escola` FOREIGN KEY (`escola_id`) REFERENCES `escola` (`id`),
  CONSTRAINT `fk_comunicado_professor` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`id`),
  CONSTRAINT `fk_comunicado_turma` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comunicado_leitura` (
  `comunicado_id` bigint unsigned NOT NULL,
  `responsavel_id` bigint unsigned NOT NULL,
  `lido_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comunicado_id`,`responsavel_id`),
  KEY `fk_leitura_responsavel` (`responsavel_id`),
  CONSTRAINT `fk_leitura_comunicado` FOREIGN KEY (`comunicado_id`) REFERENCES `comunicado` (`id`),
  CONSTRAINT `fk_leitura_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comunicado_leitura_aluno` (
  `comunicado_id` bigint unsigned NOT NULL,
  `aluno_id` bigint unsigned NOT NULL,
  `lido_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`comunicado_id`,`aluno_id`),
  KEY `fk_leitura_aluno_aluno` (`aluno_id`),
  CONSTRAINT `fk_leitura_aluno_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_leitura_aluno_comunicado` FOREIGN KEY (`comunicado_id`) REFERENCES `comunicado` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consentimento` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `responsavel_id` bigint unsigned NOT NULL,
  `versao` varchar(20) NOT NULL,
  `aceito_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_consentimento_responsavel` (`responsavel_id`),
  CONSTRAINT `fk_consentimento_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disciplina` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `escola_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_disciplina_escola` (`escola_id`),
  CONSTRAINT `fk_disciplina_escola` FOREIGN KEY (`escola_id`) REFERENCES `escola` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `escola` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `inep` char(8) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `cidade` varchar(120) DEFAULT NULL,
  `uf` char(2) DEFAULT NULL,
  `responsavel` varchar(255) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `plano` enum('basico','institucional') NOT NULL DEFAULT 'basico',
  `limite_professores` int unsigned DEFAULT NULL,
  `limite_alunos_nee` int unsigned DEFAULT NULL,
  `ativo` tinyint DEFAULT '1',
  `desativada_em` date DEFAULT NULL,
  `motivo_desativacao` varchar(60) DEFAULT NULL,
  `observacao_desativacao` text,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime DEFAULT NULL,
  `atualizado_por` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incentivo` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `responsavel_id` bigint unsigned NOT NULL,
  `aluno_id` bigint unsigned NOT NULL,
  `tarefa_id` bigint unsigned DEFAULT NULL,
  `mensagem` varchar(300) NOT NULL,
  `voz` tinyint(1) NOT NULL DEFAULT '1',
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lido_em` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_incentivo_aluno` (`aluno_id`,`criado_em`),
  KEY `fk_incentivo_responsavel` (`responsavel_id`),
  KEY `fk_incentivo_tarefa` (`tarefa_id`),
  CONSTRAINT `fk_incentivo_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `fk_incentivo_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`),
  CONSTRAINT `fk_incentivo_tarefa` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `laudo_acesso` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `aluno_id` bigint unsigned NOT NULL,
  `usuario_id` bigint unsigned DEFAULT NULL,
  `acao` varchar(20) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_laudo_acesso_aluno` (`aluno_id`),
  KEY `fk_laudo_acesso_usuario` (`usuario_id`),
  CONSTRAINT `fk_laudo_acesso_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_laudo_acesso_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lgpd_pedido` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `aluno_id` bigint unsigned NOT NULL,
  `responsavel_id` bigint unsigned DEFAULT NULL,
  `tipo` varchar(20) NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `atendido_em` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_lgpd_pedido_aluno` (`aluno_id`),
  KEY `fk_lgpd_pedido_responsavel` (`responsavel_id`),
  CONSTRAINT `fk_lgpd_pedido_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lgpd_pedido_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matricula` (
  `aluno_id` bigint unsigned NOT NULL,
  `turma_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`aluno_id`,`turma_id`),
  KEY `turma_id` (`turma_id`),
  CONSTRAINT `matricula_ibfk_1` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `matricula_ibfk_2` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `neurodivergencia` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacao_enviada` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `responsavel_id` bigint unsigned NOT NULL,
  `tipo` varchar(30) NOT NULL,
  `aluno_id` bigint unsigned NOT NULL,
  `tarefa_id` bigint unsigned NOT NULL,
  `dia` date NOT NULL,
  `enviado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_notificacao` (`responsavel_id`,`tipo`,`aluno_id`,`tarefa_id`,`dia`),
  CONSTRAINT `fk_notificacao_responsavel` FOREIGN KEY (`responsavel_id`) REFERENCES `responsavel` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedido_ajuda` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `aluno_id` bigint unsigned NOT NULL,
  `tarefa_id` bigint unsigned NOT NULL,
  `passo` tinyint unsigned DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `visto_em` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pedido_ajuda_tarefa` (`tarefa_id`),
  KEY `fk_pedido_ajuda_aluno` (`aluno_id`),
  CONSTRAINT `fk_pedido_ajuda_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `fk_pedido_ajuda_tarefa` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professor` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(255) DEFAULT NULL,
  `usuario_id` bigint unsigned DEFAULT NULL,
  `escola_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `escola_id` (`escola_id`),
  CONSTRAINT `professor_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `professor_ibfk_2` FOREIGN KEY (`escola_id`) REFERENCES `escola` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professor_disciplina` (
  `professor_id` bigint unsigned NOT NULL,
  `disciplina_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`professor_id`,`disciplina_id`),
  KEY `disciplina_id` (`disciplina_id`),
  CONSTRAINT `professor_disciplina_ibfk_1` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`id`),
  CONSTRAINT `professor_disciplina_ibfk_2` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplina` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `responsavel` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome_completo` varchar(255) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `parentesco` varchar(30) DEFAULT NULL,
  `preferencias` json DEFAULT NULL,
  `usuario_id` bigint unsigned DEFAULT NULL,
  `escola_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `fk_responsavel_escola` (`escola_id`),
  CONSTRAINT `fk_responsavel_escola` FOREIGN KEY (`escola_id`) REFERENCES `escola` (`id`),
  CONSTRAINT `responsavel_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `senha_reset` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint unsigned NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expira_em` datetime NOT NULL,
  `usado_em` datetime DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_senha_reset_token` (`token_hash`),
  KEY `fk_senha_reset_usuario` (`usuario_id`),
  CONSTRAINT `fk_senha_reset_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarefa` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descricao` text,
  `data_entrega` date DEFAULT NULL,
  `hora_limite` time DEFAULT NULL,
  `turma_id` bigint unsigned DEFAULT NULL,
  `disciplina_id` bigint unsigned DEFAULT NULL,
  `professor_id` bigint unsigned DEFAULT NULL,
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  `orientacao_ia` text,
  PRIMARY KEY (`id`),
  KEY `turma_id` (`turma_id`),
  KEY `disciplina_id` (`disciplina_id`),
  KEY `professor_id` (`professor_id`),
  CONSTRAINT `tarefa_ibfk_1` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`),
  CONSTRAINT `tarefa_ibfk_2` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplina` (`id`),
  CONSTRAINT `tarefa_ibfk_3` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarefa_anexo` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tarefa_id` bigint unsigned NOT NULL,
  `nome` varchar(255) NOT NULL,
  `arquivo` varchar(100) NOT NULL,
  `tipo` varchar(10) NOT NULL,
  `tamanho` int unsigned NOT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tarefa_anexo_tarefa` (`tarefa_id`),
  CONSTRAINT `fk_tarefa_anexo_tarefa` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefa` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarefa_adaptada` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tarefa_id` bigint unsigned DEFAULT NULL,
  `aluno_id` bigint unsigned DEFAULT NULL,
  `descricao_adaptada` text,
  `passos` json DEFAULT NULL,
  `recursos` json DEFAULT NULL,
  `materiais` json DEFAULT NULL,
  `gerado_por_ia` tinyint DEFAULT '1',
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  `atualizado_em` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tarefa_adaptada_tarefa_aluno` (`tarefa_id`,`aluno_id`),
  KEY `aluno_id` (`aluno_id`),
  CONSTRAINT `tarefa_adaptada_ibfk_1` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefa` (`id`),
  CONSTRAINT `tarefa_adaptada_ibfk_2` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarefa_status` (
  `aluno_id` bigint unsigned NOT NULL,
  `tarefa_id` bigint unsigned NOT NULL,
  `status` enum('pendente','concluida') NOT NULL DEFAULT 'pendente',
  `iniciado_em` datetime DEFAULT NULL,
  `iniciou_sozinho` tinyint(1) DEFAULT NULL,
  `passos_feitos` tinyint unsigned NOT NULL DEFAULT '0',
  `concluido_em` datetime DEFAULT NULL,
  `resposta` text,
  `resposta_em` datetime DEFAULT NULL,
  PRIMARY KEY (`aluno_id`,`tarefa_id`),
  KEY `fk_tarefa_status_tarefa` (`tarefa_id`),
  CONSTRAINT `fk_tarefa_status_aluno` FOREIGN KEY (`aluno_id`) REFERENCES `aluno` (`id`),
  CONSTRAINT `fk_tarefa_status_tarefa` FOREIGN KEY (`tarefa_id`) REFERENCES `tarefa` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turma` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) DEFAULT NULL,
  `serie` varchar(20) DEFAULT NULL,
  `letra` varchar(5) DEFAULT NULL,
  `turno` enum('manha','tarde','noite','integral') DEFAULT NULL,
  `ano_letivo` smallint unsigned DEFAULT NULL,
  `sala` varchar(50) DEFAULT NULL,
  `limite_alunos` int unsigned DEFAULT NULL,
  `encerrada` tinyint(1) NOT NULL DEFAULT '0',
  `escola_id` bigint unsigned DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `escola_id` (`escola_id`),
  CONSTRAINT `turma_ibfk_1` FOREIGN KEY (`escola_id`) REFERENCES `escola` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `turma_professor_disciplina` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `turma_id` bigint unsigned DEFAULT NULL,
  `professor_id` bigint unsigned DEFAULT NULL,
  `disciplina_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `turma_id` (`turma_id`),
  KEY `professor_id` (`professor_id`),
  KEY `disciplina_id` (`disciplina_id`),
  CONSTRAINT `turma_professor_disciplina_ibfk_1` FOREIGN KEY (`turma_id`) REFERENCES `turma` (`id`),
  CONSTRAINT `turma_professor_disciplina_ibfk_2` FOREIGN KEY (`professor_id`) REFERENCES `professor` (`id`),
  CONSTRAINT `turma_professor_disciplina_ibfk_3` FOREIGN KEY (`disciplina_id`) REFERENCES `disciplina` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `senha_provisoria` tinyint(1) NOT NULL DEFAULT '0',
  `perfil` enum('admin','escola','professor','responsavel','aluno') NOT NULL,
  `escola_id` bigint unsigned DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `criado_em` datetime DEFAULT CURRENT_TIMESTAMP,
  `ultimo_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

