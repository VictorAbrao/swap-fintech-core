-- Script para limpar carteiras duplicadas e manter apenas as corretas

-- 1. Verificar quantas carteiras existem atualmente
SELECT 
    'Total de carteiras' as info,
    COUNT(*) as count
FROM wallets;

-- 2. Limpar TODAS as carteiras
DELETE FROM wallets;

-- 3. Criar carteiras apenas para os 2 clientes (12 carteiras no total)
WITH client_ids AS (
    SELECT '3540fd26-9b18-4a88-b589-5cbac8378aa9'::uuid as id
    UNION ALL
    SELECT '00000000-0000-0000-0000-000000000001'::uuid as id
),
currencies AS (
    SELECT 'USDT' as currency UNION ALL
    SELECT 'BRL' UNION ALL
    SELECT 'USD' UNION ALL
    SELECT 'EUR' UNION ALL
    SELECT 'GBP' UNION ALL
    SELECT 'USDC'
)
INSERT INTO wallets (client_id, currency, balance, user_id, created_at, updated_at)
SELECT
    ci.id as client_id,
    c.currency,
    0 as balance,
    NULL as user_id,
    NOW() as created_at,
    NOW() as updated_at
FROM client_ids ci
CROSS JOIN currencies c;

-- 4. Verificar resultado
SELECT 
    'Carteiras criadas' as info,
    COUNT(*) as count
FROM wallets;

-- 5. Mostrar as carteiras
SELECT * FROM wallets ORDER BY client_id, currency;

