-- Script SIMPLES para recriar carteiras por CLIENTE (não por usuário)

-- 1. REMOVER constraint NOT NULL de user_id (se necessário)
ALTER TABLE wallets ALTER COLUMN user_id DROP NOT NULL;

-- 2. LIMPAR todas as carteiras
DELETE FROM wallets;

-- 3. CRIAR as 6 carteiras para cada CLIENTE (uma carteira por cliente por moeda)
INSERT INTO wallets (client_id, currency, balance, created_at, updated_at)
SELECT DISTINCT
    c.id as client_id,
    curr.currency,
    0 as balance,
    NOW() as created_at,
    NOW() as updated_at
FROM clients c
CROSS JOIN (
    SELECT 'USDT' as currency UNION ALL
    SELECT 'BRL' UNION ALL
    SELECT 'USD' UNION ALL
    SELECT 'EUR' UNION ALL
    SELECT 'GBP' UNION ALL
    SELECT 'USDC'
) curr;

-- 4. ATUALIZAR saldo USDT com base nas operações do CLIENTE
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
    WHERE oh.client_id = w.client_id
      AND oh.currency = 'USDT'
      AND oh.status = 'executed'
),
updated_at = NOW()
WHERE w.currency = 'USDT';

-- 5. ATUALIZAR saldo BRL com base nas operações do CLIENTE (sinal oposto)
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
    WHERE oh.client_id = w.client_id
      AND oh.brl_amount IS NOT NULL
      AND oh.brl_amount > 0
      AND oh.status = 'executed'
),
updated_at = NOW()
WHERE w.currency = 'BRL';

-- 6. VERIFICAR resultado
SELECT 
    c.name as client_name,
    w.client_id,
    w.currency,
    w.balance,
    w.created_at
FROM wallets w
JOIN clients c ON c.id = w.client_id
ORDER BY c.name, w.currency;
