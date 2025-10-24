-- Adicionar coluna id_braza_order na tabela operations_history
-- Esta coluna armazenará o ID numérico retornado pelo Braza Bank após execução da ordem

ALTER TABLE operations_history
ADD COLUMN id_braza_order INTEGER;

-- Adicionar índice para melhor performance
CREATE INDEX idx_operations_history_id_braza_order ON operations_history(id_braza_order);

-- Comentário para documentação
COMMENT ON COLUMN operations_history.id_braza_order IS 'ID numérico da ordem no Braza Bank após execução';
