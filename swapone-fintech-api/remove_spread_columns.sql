-- Script para remover spread_percentage e manter apenas markup_percentage
-- Execute este SQL no Supabase SQL Editor

-- 1. Remover coluna spread_percentage da tabela client_markups
ALTER TABLE client_markups DROP COLUMN IF EXISTS spread_percentage;

-- 2. Remover coluna spread_percentage da tabela operations_history
ALTER TABLE operations_history DROP COLUMN IF EXISTS spread_percentage;

-- 3. Verificar se as colunas foram removidas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'client_markups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'operations_history' 
AND table_schema = 'public'
ORDER BY ordinal_position;
