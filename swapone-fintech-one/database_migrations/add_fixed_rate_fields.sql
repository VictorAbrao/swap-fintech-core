-- Migration: Add fixed rate fields to markups and operations
-- Date: 2025-01-23
-- Description: Add fixed_rate_amount field to client_markups, operations_history, and fx_rates tables

-- Add fixed_rate_amount column to client_markups table
ALTER TABLE client_markups 
ADD COLUMN fixed_rate_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add fixed_rate_amount column to operations_history table  
ALTER TABLE operations_history 
ADD COLUMN fixed_rate_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add fixed_rate_amount column to fx_rates table
ALTER TABLE fx_rates 
ADD COLUMN fixed_rate_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to explain the field
COMMENT ON COLUMN client_markups.fixed_rate_amount IS 'Fixed rate amount in target currency for the currency pair (additional to percentage markup)';
COMMENT ON COLUMN operations_history.fixed_rate_amount IS 'Fixed rate amount in target currency applied to this operation (additional to percentage markup)';
COMMENT ON COLUMN fx_rates.fixed_rate_amount IS 'Fixed rate amount in target currency for the FX rate pair (additional to percentage markup)';

-- Update existing records to have 0.00 as default
UPDATE client_markups SET fixed_rate_amount = 0.00 WHERE fixed_rate_amount IS NULL;
UPDATE operations_history SET fixed_rate_amount = 0.00 WHERE fixed_rate_amount IS NULL;
UPDATE fx_rates SET fixed_rate_amount = 0.00 WHERE fixed_rate_amount IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE client_markups ALTER COLUMN fixed_rate_amount SET NOT NULL;
ALTER TABLE operations_history ALTER COLUMN fixed_rate_amount SET NOT NULL;
ALTER TABLE fx_rates ALTER COLUMN fixed_rate_amount SET NOT NULL;
