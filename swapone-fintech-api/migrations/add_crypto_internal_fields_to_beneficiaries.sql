-- Migration: Add crypto and internal fields to beneficiaries table
-- Date: 2025-10-24
-- Description: Add support for CRYPTO and INTERNAL transfer methods

-- Add crypto fields for CRYPTO transfer method
ALTER TABLE beneficiaries 
ADD COLUMN crypto_protocol VARCHAR(50),
ADD COLUMN crypto_wallet VARCHAR(255);

-- Add internal field for INTERNAL transfer method  
ALTER TABLE beneficiaries 
ADD COLUMN internal_account_number VARCHAR(5);

-- Add comments for documentation
COMMENT ON COLUMN beneficiaries.crypto_protocol IS 'Crypto protocol (e.g., TRC20, ERC20) for CRYPTO transfer method';
COMMENT ON COLUMN beneficiaries.crypto_wallet IS 'Crypto wallet address for CRYPTO transfer method';
COMMENT ON COLUMN beneficiaries.internal_account_number IS 'Internal account number (5 digits) for INTERNAL transfer method';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_beneficiaries_crypto_protocol ON beneficiaries(crypto_protocol);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_internal_account_number ON beneficiaries(internal_account_number);
