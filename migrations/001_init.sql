-- Migração inicial: Pesquisa de Percepção da TI (Revalle)
--
-- Roda no mesmo banco "agente_revalle" já existente, mas em um schema
-- próprio ("pesquisa_ti") para não colidir com as tabelas da aplicação
-- principal (ex.: "colaboradores-revalle").
--
-- IMPORTANTE (privacidade): `respondentes` e `respostas` são tabelas
-- independentes, sem FK entre si. `respostas` NUNCA deve ganhar uma coluna
-- de CPF, hash ou id de colaborador — isso quebraria o anonimato do
-- questionário. Ver PLANO.md seção 2.
--
-- Este arquivo NÃO é executado automaticamente. Aplique manualmente:
--   psql "$DATABASE_URL" -f migrations/001_init.sql

CREATE SCHEMA IF NOT EXISTS pesquisa_ti;

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- necessário para gen_random_uuid()

-- Trava anti-duplicidade (SEM ligação com respostas)
CREATE TABLE IF NOT EXISTS pesquisa_ti.respondentes (
  cpf_hash      char(64) PRIMARY KEY,          -- SHA-256 hex do CPF normalizado + pepper
  respondido_em timestamptz NOT NULL DEFAULT now()
);

-- Respostas (SEM CPF / SEM hash / SEM id de colaborador)
CREATE TABLE IF NOT EXISTS pesquisa_ti.respostas (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em              timestamptz NOT NULL DEFAULT now(),
  unidade                text NOT NULL,        -- validar contra lista fixa
  equipamento_principal  text NOT NULL,        -- notebook|desktop|ambos|nenhum
  avaliacao_equipamento  smallint NOT NULL CHECK (avaliacao_equipamento BETWEEN 1 AND 5),
  acessorios_notebook    text NOT NULL,        -- sim|parcialmente|nao|nao_utiliza
  usa_celular_corp       boolean NOT NULL,
  avaliacao_celular      smallint CHECK (avaliacao_celular BETWEEN 1 AND 5), -- null se não usa
  avaliacao_atendimento  smallint NOT NULL CHECK (avaliacao_atendimento BETWEEN 1 AND 5),
  avaliacao_presenca     smallint NOT NULL CHECK (avaliacao_presenca BETWEEN 1 AND 5),
  resolucao_tempo        text NOT NULL,        -- sempre|maioria|as_vezes|raramente|nunca
  itens_melhoria         text[] NOT NULL DEFAULT '{}', -- máx 3, validar no servidor
  item_melhoria_outro    text,
  equipamento_prejudica  text,
  nps                    smallint NOT NULL CHECK (nps BETWEEN 0 AND 10),
  ti_faz_bem             text,
  principal_melhoria     text,
  sugestao               text
);

CREATE INDEX IF NOT EXISTS idx_respostas_unidade ON pesquisa_ti.respostas (unidade);
CREATE INDEX IF NOT EXISTS idx_respostas_criado_em ON pesquisa_ti.respostas (criado_em);
