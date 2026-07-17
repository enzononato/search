-- Migração 002: Q2 (equipamento principal) vira múltipla escolha + opção
-- "celular"; perguntas de estrela ganham campo de comentário opcional.
--
-- "ambos" deixava de fazer sentido como opção própria já que agora dá para
-- marcar notebook + desktop ao mesmo tempo. Linhas antigas com 'ambos' são
-- migradas para {notebook,desktop}; as demais viram array de 1 elemento.
--
-- Este arquivo NÃO é executado automaticamente. Aplique manualmente:
--   psql "$DATABASE_URL" -f migrations/002_equipamento_multiplo_e_comentarios.sql

ALTER TABLE pesquisa_ti.respostas
  ALTER COLUMN equipamento_principal TYPE text[]
  USING (
    CASE equipamento_principal
      WHEN 'ambos' THEN ARRAY['notebook', 'desktop']
      ELSE ARRAY[equipamento_principal]
    END
  );

ALTER TABLE pesquisa_ti.respostas
  ALTER COLUMN equipamento_principal SET DEFAULT '{}';

ALTER TABLE pesquisa_ti.respostas
  ADD COLUMN IF NOT EXISTS comentario_avaliacao_equipamento text,
  ADD COLUMN IF NOT EXISTS comentario_avaliacao_celular text,
  ADD COLUMN IF NOT EXISTS comentario_avaliacao_atendimento text,
  ADD COLUMN IF NOT EXISTS comentario_avaliacao_presenca text;
