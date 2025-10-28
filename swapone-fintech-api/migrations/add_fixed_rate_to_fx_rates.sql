-- Migration: Add fixed_rate_amount to fx_rates table if it doesn't exist
-- This adds the fixed rate amount column that's used in FX trade operations

-- Add fixed_rate_amount column to fx_rates table (if not already added by create_fx_rates_simple.sql)
ALTER TABLE fx_rates 
ADD COLUMN IF NOT EXISTS fixed_rate_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add comment
COMMENT ON COLUMN fx_rates.fixed_rate_amount IS 'Fixed rate amount in target currency for the FX rate pair (additional to percentage markup)';

-- Update existing records to have 0 as default
UPDATE fx_rates SET fixed_rate_amount = 0.00 WHERE fixed_rate_amount IS NULL;








