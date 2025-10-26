-- Adicionar internal_deposit ao constraint de operation_type
-- Este tipo é usado para depósitos internos de transferências entre clientes

-- Atualizar constraint de operation_type para incluir internal_deposit
ALTER TABLE operations_history 
DROP CONSTRAINT IF EXISTS operations_history_operation_type_check;

ALTER TABLE operations_history 
ADD CONSTRAINT operations_history_operation_type_check 
CHECK (operation_type IN ('buy', 'sell', 'fx_trade', 'transfer', 'conversion', 'external_deposit', 'deposit', 'internal_deposit', 'arbitrage', 'withdrawal'));

-- Comentário para documentação
COMMENT ON COLUMN operations_history.operation_type IS 'Tipo da operação: buy, sell, fx_trade, transfer, conversion, external_deposit, deposit, internal_deposit, arbitrage, withdrawal';
