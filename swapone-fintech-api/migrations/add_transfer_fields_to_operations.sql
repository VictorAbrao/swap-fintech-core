-- Adicionar campos para transferências internas em uma única operação
-- Este migration adiciona campos necessários para registrar transferências internas
-- como uma única operação 'transfer' em vez de criar dois registros separados

-- Adicionar campos para identificar cliente de destino em transferências internas
ALTER TABLE operations_history 
ADD COLUMN IF NOT EXISTS destination_client_id UUID,
ADD COLUMN IF NOT EXISTS destination_client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS transfer_method VARCHAR(20),
ADD COLUMN IF NOT EXISTS beneficiary_account VARCHAR(50),
ADD COLUMN IF NOT EXISTS beneficiary_bank_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS beneficiary_bank_address TEXT,
ADD COLUMN IF NOT EXISTS beneficiary_iban VARCHAR(50),
ADD COLUMN IF NOT EXISTS beneficiary_swift_bic VARCHAR(20),
ADD COLUMN IF NOT EXISTS beneficiary_routing_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS beneficiary_account_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS intermediary_bank_swift VARCHAR(20),
ADD COLUMN IF NOT EXISTS crypto_protocol VARCHAR(20),
ADD COLUMN IF NOT EXISTS crypto_wallet VARCHAR(255),
ADD COLUMN IF NOT EXISTS internal_account_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS attachment_url_1 TEXT,
ADD COLUMN IF NOT EXISTS attachment_url_2 TEXT;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_operations_destination_client_id ON operations_history(destination_client_id);
CREATE INDEX IF NOT EXISTS idx_operations_transfer_method ON operations_history(transfer_method);
CREATE INDEX IF NOT EXISTS idx_operations_payment_reference ON operations_history(payment_reference);
CREATE INDEX IF NOT EXISTS idx_operations_internal_account_number ON operations_history(internal_account_number);

-- Comentários para documentação
COMMENT ON COLUMN operations_history.destination_client_id IS 'ID do cliente de destino (para transferências internas)';
COMMENT ON COLUMN operations_history.destination_client_name IS 'Nome do cliente de destino';
COMMENT ON COLUMN operations_history.transfer_method IS 'Método de transferência: SEPA, SWIFT, ACH, CRYPTO, INTERNAL';
COMMENT ON COLUMN operations_history.beneficiary_account IS 'Número da conta do beneficiário';
COMMENT ON COLUMN operations_history.beneficiary_bank_name IS 'Nome do banco do beneficiário';
COMMENT ON COLUMN operations_history.beneficiary_bank_address IS 'Endereço do banco do beneficiário';
COMMENT ON COLUMN operations_history.beneficiary_iban IS 'IBAN do beneficiário (SEPA)';
COMMENT ON COLUMN operations_history.beneficiary_swift_bic IS 'SWIFT/BIC do beneficiário';
COMMENT ON COLUMN operations_history.beneficiary_routing_number IS 'Routing number do beneficiário (ACH)';
COMMENT ON COLUMN operations_history.beneficiary_account_type IS 'Tipo de conta do beneficiário';
COMMENT ON COLUMN operations_history.intermediary_bank_swift IS 'SWIFT do banco intermediário';
COMMENT ON COLUMN operations_history.crypto_protocol IS 'Protocolo crypto (TRC20, ERC20, etc.)';
COMMENT ON COLUMN operations_history.crypto_wallet IS 'Endereço da carteira crypto';
COMMENT ON COLUMN operations_history.internal_account_number IS 'Número da conta interna (transferências internas)';
COMMENT ON COLUMN operations_history.payment_reference IS 'Referência do pagamento';
COMMENT ON COLUMN operations_history.attachment_url_1 IS 'URL do primeiro anexo';
COMMENT ON COLUMN operations_history.attachment_url_2 IS 'URL do segundo anexo';
