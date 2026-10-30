CREATE DATABASE IF NOT EXISTS hackathon_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hackathon_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  perfil ENUM('cliente','gestor') NOT NULL DEFAULT 'cliente',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(140) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(80) NOT NULL,
  status ENUM('Ativo','Indisponivel') NOT NULL DEFAULT 'Ativo',
  meta_dados JSON NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS solicitacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  item_id INT NOT NULL,
  status ENUM('Pendente','Em Análise','Confirmado','Concluído','Cancelado')
    NOT NULL DEFAULT 'Pendente',
  observacao VARCHAR(500) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_solicitacao_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_solicitacao_item FOREIGN KEY (item_id)
    REFERENCES itens(id) ON DELETE RESTRICT,
  INDEX idx_solicitacoes_usuario_status (usuario_id, status)
);

INSERT INTO itens (titulo, descricao, categoria, status, meta_dados)
SELECT 'Atendimento geral', 'Tire dúvidas e resolva suas solicitações com nossa equipe.',
       'Atendimento', 'Ativo', JSON_OBJECT('tempo_estimado', '15 min', 'modalidade', 'Online')
WHERE NOT EXISTS (SELECT 1 FROM itens WHERE titulo = 'Atendimento geral');

INSERT INTO itens (titulo, descricao, categoria, status, meta_dados)
SELECT 'Suporte técnico', 'Conte com ajuda para acessar e utilizar a plataforma.',
       'Suporte', 'Ativo', JSON_OBJECT('tempo_estimado', '10 min', 'modalidade', 'Online')
WHERE NOT EXISTS (SELECT 1 FROM itens WHERE titulo = 'Suporte técnico');

INSERT INTO itens (titulo, descricao, categoria, status, meta_dados)
SELECT 'Consultoria', 'Reserve um horário com um especialista para orientar você.',
       'Consultoria', 'Ativo', JSON_OBJECT('tempo_estimado', '30 min', 'modalidade', 'Online')
WHERE NOT EXISTS (SELECT 1 FROM itens WHERE titulo = 'Consultoria');
