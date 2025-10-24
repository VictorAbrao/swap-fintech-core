-- Migration: Add annual limits and usage tracking to clients table
-- This migration adds fields to track annual transaction limits and current usage

-- Add annual limit fields
ALTER TABLE clients 
ADD COLUMN annual_transaction_limit_usdt DECIMAL(15,2) DEFAULT 0,
ADD COLUMN annual_limit_reset_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN current_annual_usage_usdt DECIMAL(15,2) DEFAULT 0,
ADD COLUMN limit_currency VARCHAR(10) DEFAULT 'USDT';

-- Add index for performance
CREATE INDEX idx_clients_annual_limit ON clients(annual_transaction_limit_usdt);
CREATE INDEX idx_clients_reset_date ON clients(annual_limit_reset_date);

-- Add comments
COMMENT ON COLUMN clients.annual_transaction_limit_usdt IS 'Annual transaction limit in USDT';
COMMENT ON COLUMN clients.annual_limit_reset_date IS 'Date when the annual limit resets';
COMMENT ON COLUMN clients.current_annual_usage_usdt IS 'Current annual usage in USDT';
COMMENT ON COLUMN clients.limit_currency IS 'Currency used for limit calculations';

-- Update existing clients with default values
UPDATE clients 
SET 
  annual_transaction_limit_usdt = 1000000, -- Default 1M USDT annual limit
  annual_limit_reset_date = CURRENT_DATE,
  current_annual_usage_usdt = 0,
  limit_currency = 'USDT'
WHERE annual_transaction_limit_usdt IS NULL;
