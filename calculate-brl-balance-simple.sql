-- SQL SIMPLIFICADO para calcular saldo BRL baseado nas operações
-- Este SQL calcula o saldo BRL considerando:
-- - Buy operations: subtrai BRL (você gasta BRL para comprar USDT)
-- - Sell operations: adiciona BRL (você recebe BRL vendendo USDT)

-- 1. Query para ver o saldo BRL calculado baseado nas operações
SELECT 
    c.name as client_name,
    COALESCE(
        SUM(
            CASE 
                WHEN oh.operation_type = 'buy' THEN -oh.brl_amount
                WHEN oh.operation_type = 'sell' THEN oh.brl_amount
                ELSE 0
            END
        ), 0
    ) as calculated_brl_balance,
    w.balance as current_wallet_balance
FROM clients c
LEFT JOIN operations_history oh ON c.id = oh.client_id AND oh.status = 'executed'
LEFT JOIN profiles p ON c.id = p.client_id
LEFT JOIN wallets w ON p.id = w.user_id AND w.currency = 'BRL'
GROUP BY c.id, c.name, w.balance
ORDER BY c.name;

-- 2. Query para ver as operações que contribuem para o saldo BRL
SELECT 
    oh.id,
    oh.operation_type,
    oh.amount,
    oh.currency,
    oh.brl_amount,
    oh.final_quotation,
    oh.created_at,
    c.name as client_name,
    CASE 
        WHEN oh.operation_type = 'buy' THEN -oh.brl_amount
        WHEN oh.operation_type = 'sell' THEN oh.brl_amount
        ELSE 0
    END as brl_impact
FROM operations_history oh
JOIN clients c ON oh.client_id = c.id
WHERE oh.status = 'executed'
ORDER BY oh.created_at DESC;

-- 3. Função simplificada para recalcular saldo BRL de um cliente específico
CREATE OR REPLACE FUNCTION recalculate_client_brl_balance(client_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    calculated_balance DECIMAL;
    user_uuid UUID;
BEGIN
    -- Buscar o user_id do cliente
    SELECT p.id INTO user_uuid
    FROM profiles p
    WHERE p.client_id = client_uuid;
    
    -- Calcular o saldo BRL baseado nas operações
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN oh.operation_type = 'buy' THEN -oh.brl_amount
                WHEN oh.operation_type = 'sell' THEN oh.brl_amount
                ELSE 0
            END
        ), 0
    ) INTO calculated_balance
    FROM operations_history oh
    WHERE oh.client_id = client_uuid 
    AND oh.status = 'executed';
    
    -- Atualizar a carteira BRL do cliente
    UPDATE wallets 
    SET balance = calculated_balance,
        updated_at = NOW()
    WHERE user_id = user_uuid 
    AND currency = 'BRL';
    
    RETURN calculated_balance;
END;
$$ LANGUAGE plpgsql;

-- 4. Exemplo de uso da função para recalcular saldo BRL
-- Primeiro, vamos ver qual é o UUID do cliente
SELECT id, name FROM clients;

-- Depois executar a função (substitua 'uuid-do-cliente' pelo UUID real)
-- SELECT recalculate_client_brl_balance('uuid-do-cliente-aqui');

-- 5. Query para verificar se o cálculo está correto
-- Com base nos dados fornecidos, o saldo BRL deveria ser:
-- Sell 20 USDT: +108.03 BRL
-- Buy 100 USDT: -541.51 BRL  
-- Buy 5 USDT: -27.03 BRL
-- Buy 100 USDT: -540.75 BRL
-- Sell 1 USDT: +5.40 BRL
-- Total: 108.03 - 541.51 - 27.03 - 540.75 + 5.40 = -995.86 BRL

SELECT 
    'Expected BRL Balance' as description,
    (108.03 - 541.51 - 27.03 - 540.75 + 5.40) as expected_balance;

-- 6. Query para atualizar todas as carteiras BRL com os saldos calculados
UPDATE wallets 
SET balance = (
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN oh.operation_type = 'buy' THEN -oh.brl_amount
                WHEN oh.operation_type = 'sell' THEN oh.brl_amount
                ELSE 0
            END
        ), 0
    )
    FROM operations_history oh
    JOIN clients c ON oh.client_id = c.id
    JOIN profiles p ON c.id = p.client_id
    WHERE p.id = wallets.user_id
    AND oh.status = 'executed'
),
updated_at = NOW()
WHERE currency = 'BRL';
