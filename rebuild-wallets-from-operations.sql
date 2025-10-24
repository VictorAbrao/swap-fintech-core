-- Script para recriar wallets baseado em operations_history
-- Este script limpa as carteiras antigas e recria com base nas operações

-- 1. BACKUP (Opcional - descomente se quiser fazer backup)
-- CREATE TABLE wallets_backup AS SELECT * FROM wallets;

-- 2. LIMPAR todas as carteiras existentes
DELETE FROM wallets;

-- 3. INSERIR carteiras baseadas nos client_id das operações
-- Criar carteiras USDT para cada combinação user_id + client_id que tem operações
INSERT INTO wallets (user_id, client_id, currency, balance, created_at, updated_at)
SELECT DISTINCT
    oh.user_id,
    oh.client_id,
    'USDT' as currency,
    0 as balance,
    NOW() as created_at,
    NOW() as updated_at
FROM operations_history oh
WHERE oh.client_id IS NOT NULL
  AND oh.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM wallets w 
    WHERE w.user_id = oh.user_id 
      AND w.client_id = oh.client_id 
      AND w.currency = 'USDT'
  );

-- Criar carteiras BRL para cada combinação user_id + client_id que tem operações
INSERT INTO wallets (user_id, client_id, currency, balance, created_at, updated_at)
SELECT DISTINCT
    oh.user_id,
    oh.client_id,
    'BRL' as currency,
    0 as balance,
    NOW() as created_at,
    NOW() as updated_at
FROM operations_history oh
WHERE oh.client_id IS NOT NULL
  AND oh.user_id IS NOT NULL
  AND oh.brl_amount IS NOT NULL
  AND oh.brl_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM wallets w 
    WHERE w.user_id = oh.user_id 
      AND w.client_id = oh.client_id 
      AND w.currency = 'BRL'
  );

-- Criar outras carteiras padrão (USD, EUR, GBP, USDC) para cada usuário
INSERT INTO wallets (user_id, client_id, currency, balance, created_at, updated_at)
SELECT DISTINCT
    p.id as user_id,
    p.client_id,
    c.currency,
    0 as balance,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
CROSS JOIN (
    SELECT 'USD' as currency UNION ALL
    SELECT 'EUR' UNION ALL
    SELECT 'GBP' UNION ALL
    SELECT 'USDC'
) c
WHERE p.client_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM wallets w 
    WHERE w.user_id = p.id 
      AND w.client_id = p.client_id 
      AND w.currency = c.currency
  );

-- 4. CALCULAR e ATUALIZAR saldo USDT baseado em operations_history
UPDATE wallets w
SET balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN oh.operation_type = 'buy' THEN oh.amount
            WHEN oh.operation_type = 'sell' THEN -oh.amount
            ELSE 0
        END
    ), 0)
    FROM operations_history oh
    WHERE oh.user_id = w.user_id
      AND oh.client_id = w.client_id
      AND oh.currency = 'USDT'
      AND oh.status = 'executed'
),
updated_at = NOW()
WHERE w.currency = 'USDT';

-- 5. CALCULAR e ATUALIZAR saldo BRL baseado em operations_history
UPDATE wallets w
SET balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN oh.operation_type = 'buy' THEN -oh.brl_amount
            WHEN oh.operation_type = 'sell' THEN oh.brl_amount
            ELSE 0
        END
    ), 0)
    FROM operations_history oh
    WHERE oh.user_id = w.user_id
      AND oh.client_id = w.client_id
      AND oh.brl_amount IS NOT NULL
      AND oh.brl_amount > 0
      AND oh.status = 'executed'
),
updated_at = NOW()
WHERE w.currency = 'BRL';

-- 6. VERIFICAR resultados
SELECT 
    '=== RESUMO DAS CARTEIRAS RECRIADAS ===' as status;

SELECT 
    'Total de carteiras criadas' as metric,
    COUNT(*) as value
FROM wallets;

SELECT 
    'Carteiras por moeda' as metric,
    currency,
    COUNT(*) as count,
    SUM(balance) as total_balance
FROM wallets
GROUP BY currency
ORDER BY currency;

SELECT 
    'Carteiras por cliente' as metric,
    c.name as client_name,
    COUNT(*) as wallets_count,
    COUNT(DISTINCT w.user_id) as users_count
FROM wallets w
JOIN profiles p ON p.id = w.user_id
JOIN clients c ON c.id = w.client_id
GROUP BY c.id, c.name
ORDER BY c.name;

SELECT 
    '=== CARTEIRAS DO CLIENTE cliente01 ===' as status;

SELECT 
    w.user_id,
    w.currency,
    w.balance,
    w.created_at
FROM wallets w
JOIN clients c ON c.id = w.client_id
WHERE c.name = 'cliente01'
ORDER BY w.user_id, w.currency;

SELECT 
    '=== OPERAÇÕES DO CLIENTE cliente01 ===' as status;

SELECT 
    oh.user_id,
    oh.operation_type,
    oh.currency,
    oh.amount,
    oh.brl_amount,
    oh.status,
    oh.created_at
FROM operations_history oh
JOIN clients c ON c.id = oh.client_id
WHERE c.name = 'cliente01'
ORDER BY oh.created_at DESC
LIMIT 10;
