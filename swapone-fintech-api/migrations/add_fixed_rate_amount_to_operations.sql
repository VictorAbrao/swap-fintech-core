-- Migration: Add fixed_rate_amount field to operations_history table
-- Execute this SQL in Supabase SQL Editor

-- Add fixed_rate_amount column to operations_history table  
ALTER TABLE operations_history 
ADD COLUMN IF NOT EXISTS fixed_rate_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add comment to explain the field
COMMENT ON COLUMN operations_history.fixed_rate_amount IS 'Fixed rate amount in target currency applied to this operation (additional to percentage markup)';

-- Update existing records to have 0.00 as default
UPDATE operations_history SET fixed_rate_amount = 0.00 WHERE fixed_rate_amount IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE operations_history ALTER COLUMN fixed_rate_amount SET NOT NULL;
