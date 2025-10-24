-- Atualizar tabela operations_history para suportar FX Trade
-- Adicionar novos campos necessários

-- Adicionar colunas para FX Trade
ALTER TABLE operations_history 
ADD COLUMN IF NOT EXISTS source_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS target_currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS source_amount DECIMAL(20, 2),
ADD COLUMN IF NOT EXISTS target_amount DECIMAL(20, 2),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS base_rate DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS final_rate DECIMAL(20, 8),
ADD COLUMN IF NOT EXISTS spread_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(20, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS side VARCHAR(10) CHECK (side IN ('buy', 'sell')),
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS client_id UUID;

-- Atualizar constraint de operation_type para incluir fx_trade
ALTER TABLE operations_history 
DROP CONSTRAINT IF EXISTS operations_history_operation_type_check;

ALTER TABLE operations_history 
ADD CONSTRAINT operations_history_operation_type_check 
CHECK (operation_type IN ('buy', 'sell', 'fx_trade', 'transfer', 'conversion', 'external_deposit', 'deposit'));

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_operations_source_currency ON operations_history(source_currency);
CREATE INDEX IF NOT EXISTS idx_operations_target_currency ON operations_history(target_currency);
CREATE INDEX IF NOT EXISTS idx_operations_side ON operations_history(side);
CREATE INDEX IF NOT EXISTS idx_operations_client_id ON operations_history(client_id);

-- Comentários para documentação
COMMENT ON COLUMN operations_history.source_currency IS 'Moeda de origem da operação';
COMMENT ON COLUMN operations_history.target_currency IS 'Moeda de destino da operação';
COMMENT ON COLUMN operations_history.source_amount IS 'Quantidade da moeda de origem';
COMMENT ON COLUMN operations_history.target_amount IS 'Quantidade da moeda de destino';
COMMENT ON COLUMN operations_history.exchange_rate IS 'Taxa de câmbio aplicada';
COMMENT ON COLUMN operations_history.base_rate IS 'Taxa base do Braza Bank';
COMMENT ON COLUMN operations_history.final_rate IS 'Taxa final após markup/spread';
COMMENT ON COLUMN operations_history.spread_percentage IS 'Spread aplicado em porcentagem';
COMMENT ON COLUMN operations_history.side IS 'Lado da operação (buy/sell)';
COMMENT ON COLUMN operations_history.notes IS 'Notas adicionais da operação';
COMMENT ON COLUMN operations_history.reference_id IS 'ID de referência externa';
COMMENT ON COLUMN operations_history.client_id IS 'ID do cliente associado';
