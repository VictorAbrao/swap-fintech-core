-- Script COMPLETO para criar e calcular carteiras para os 2 clientes

-- PASSO 1: Remover constraint NOT NULL de user_id (se necessário)
ALTER TABLE wallets ALTER COLUMN user_id DROP NOT NULL;

-- PASSO 2: Limpar TODAS as carteiras existentes
DELETE FROM wallets;

-- PASSO 3: Criar as 12 carteiras (6 para cada cliente) com saldo 0
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

-- PASSO 4: Atualizar saldo USDT para cliente 3540fd26-9b18-4a88-b589-5cbac8378aa9
UPDATE wallets 
SET balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN operation_type = 'buy' THEN amount
            WHEN operation_type = 'sell' THEN -amount
            ELSE 0
        END
    ), 0)
    FROM operations_history 
    WHERE client_id = '3540fd26-9b18-4a88-b589-5cbac8378aa9'
      AND currency = 'USDT'
      AND status = 'executed'
),
updated_at = NOW()
WHERE client_id = '3540fd26-9b18-4a88-b589-5cbac8378aa9'
  AND currency = 'USDT';

-- PASSO 5: Atualizar saldo BRL para cliente 3540fd26-9b18-4a88-b589-5cbac8378aa9 (sinal oposto)
UPDATE wallets 
SET balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN operation_type = 'buy' THEN -brl_amount
            WHEN operation_type = 'sell' THEN brl_amount
            ELSE 0
        END
    ), 0)
    FROM operations_history 
    WHERE client_id = '3540fd26-9b18-4a88-b589-5cbac8378aa9'
      AND brl_amount IS NOT NULL
      AND brl_amount > 0
      AND status = 'executed'
),
updated_at = NOW()
WHERE client_id = '3540fd26-9b18-4a88-b589-5cbac8378aa9'
  AND currency = 'BRL';

-- PASSO 6: Atualizar saldo USDT para cliente 00000000-0000-0000-0000-000000000001
UPDATE wallets 
SET balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN operation_type = 'buy' THEN amount
            WHEN operation_type = 'sell' THEN -amount
            ELSE 0
        END
    ), 0)
    FROM operations_history 
    WHERE client_id = '00000000-0000-0000-0000-000000000001'
      AND currency = 'USDT'
      AND status = 'executed'
),
updated_at = NOW()
WHERE client_id = '00000000-0000-0000-0000-000000000001'
  AND currency = 'USDT';

-- PASSO 7: Atualizar saldo BRL para cliente 00000000-0000-0000-0000-000000000001 (sinal oposto)
UPDATE wallets 
SET balance = (
    SELECT COALESCE(SUM(
        CASE 
            WHEN operation_type = 'buy' THEN -brl_amount
            WHEN operation_type = 'sell' THEN brl_amount
            ELSE 0
        END
    ), 0)
    FROM operations_history 
    WHERE client_id = '00000000-0000-0000-0000-000000000001'
      AND brl_amount IS NOT NULL
      AND brl_amount > 0
      AND status = 'executed'
),
updated_at = NOW()
WHERE client_id = '00000000-0000-0000-0000-000000000001'
  AND currency = 'BRL';

-- PASSO 8: VERIFICAR resultado final
SELECT 
    'Total de carteiras criadas' as info,
    COUNT(*) as total
FROM wallets;

-- PASSO 9: Mostrar as carteiras com saldo
SELECT 
    client_id,
    currency,
    balance,
    created_at,
    updated_at
FROM wallets 
ORDER BY client_id, currency;

-- PASSO 10: Mostrar apenas carteiras com saldo diferente de zero
SELECT 
    'Carteiras com saldo' as info,
    client_id,
    currency,
    balance
FROM wallets 
WHERE balance != 0
ORDER BY client_id, currency;

