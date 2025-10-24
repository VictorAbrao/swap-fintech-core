-- SQL para calcular saldo BRL baseado nas operações
-- Este SQL calcula o saldo BRL considerando:
-- - Buy operations: subtrai BRL (você gasta BRL para comprar USDT)
-- - Sell operations: adiciona BRL (você recebe BRL vendendo USDT)

-- 1. Criar uma view para calcular o saldo BRL por cliente
CREATE OR REPLACE VIEW client_brl_balance AS
SELECT 
    c.id as client_id,
    c.name as client_name,
    COALESCE(
        SUM(
            CASE 
                WHEN oh.operation_type = 'buy' THEN -oh.brl_amount
                WHEN oh.operation_type = 'sell' THEN oh.brl_amount
                ELSE 0
            END
        ), 0
    ) as brl_balance
FROM clients c
LEFT JOIN operations_history oh ON c.id = oh.client_id
WHERE oh.status = 'executed' OR oh.status IS NULL
GROUP BY c.id, c.name;

-- 2. Atualizar a tabela de carteiras BRL com o saldo calculado
UPDATE wallets 
SET balance = (
    SELECT COALESCE(brl_balance, 0)
    FROM client_brl_balance cbb
    JOIN clients c ON cbb.client_id = c.id
    JOIN profiles p ON c.id = p.client_id
    WHERE wallets.user_id = p.id
)
WHERE currency = 'BRL';

-- 3. Query para verificar o saldo BRL calculado
SELECT 
    c.name as client_name,
    cbb.brl_balance,
    w.balance as wallet_balance
FROM clients c
JOIN client_brl_balance cbb ON c.id = cbb.client_id
JOIN profiles p ON c.id = p.client_id
LEFT JOIN wallets w ON p.id = w.user_id AND w.currency = 'BRL'
ORDER BY c.name;

-- 4. Query para ver as operações que contribuem para o saldo BRL
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

-- 5. Função para recalcular saldo BRL de um cliente específico
CREATE OR REPLACE FUNCTION recalculate_client_brl_balance(client_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    calculated_balance DECIMAL;
BEGIN
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
    WHERE user_id = (
        SELECT p.id 
        FROM profiles p 
        WHERE p.client_id = client_uuid
    ) 
    AND currency = 'BRL';
    
    RETURN calculated_balance;
END;
$$ LANGUAGE plpgsql;

-- 6. Exemplo de uso da função para recalcular saldo BRL
-- SELECT recalculate_client_brl_balance('uuid-do-cliente-aqui');

-- 7. Trigger para atualizar automaticamente o saldo BRL quando uma operação é inserida/atualizada
CREATE OR REPLACE FUNCTION update_brl_balance_on_operation_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalcular saldo BRL do cliente
    PERFORM recalculate_client_brl_balance(COALESCE(NEW.client_id, OLD.client_id));
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Criar trigger na tabela operations_history
DROP TRIGGER IF EXISTS trigger_update_brl_balance ON operations_history;
CREATE TRIGGER trigger_update_brl_balance
    AFTER INSERT OR UPDATE OR DELETE ON operations_history
    FOR EACH ROW
    EXECUTE FUNCTION update_brl_balance_on_operation_change();

-- 8. Query para verificar se o cálculo está correto
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
