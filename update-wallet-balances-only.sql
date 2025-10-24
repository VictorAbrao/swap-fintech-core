-- Script para APENAS ATUALIZAR saldos das carteiras existentes

-- 1. ATUALIZAR saldo USDT para cliente 3540fd26-9b18-4a88-b589-5cbac8378aa9
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

-- 2. ATUALIZAR saldo BRL para cliente 3540fd26-9b18-4a88-b589-5cbac8378aa9 (sinal oposto)
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

-- 3. ATUALIZAR saldo USDT para cliente 00000000-0000-0000-0000-000000000001
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

-- 4. ATUALIZAR saldo BRL para cliente 00000000-0000-0000-0000-000000000001 (sinal oposto)
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

-- 5. VERIFICAR resultado final
SELECT 
    client_id,
    currency,
    balance,
    updated_at
FROM wallets 
WHERE currency IN ('USDT', 'BRL')
ORDER BY client_id, currency;
