-- Adicionar campo braza_order_id na tabela operations_history
-- Este campo armazenará o UUID retornado pelo Braza Bank para executar a ordem

ALTER TABLE operations_history 
ADD COLUMN braza_order_id VARCHAR(255);

-- Adicionar índice para melhor performance nas consultas
CREATE INDEX idx_operations_history_braza_order_id ON operations_history(braza_order_id);

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN operations_history.braza_order_id IS 'UUID da ordem no Braza Bank para execução posterior';
