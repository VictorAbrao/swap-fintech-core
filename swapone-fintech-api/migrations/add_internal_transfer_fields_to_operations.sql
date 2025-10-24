-- Migration: Add internal transfer fields to operations_history table
-- Date: 2025-10-24
-- Description: Add support for internal transfers with destination client tracking

-- Add fields for internal transfers
ALTER TABLE operations_history 
ADD COLUMN IF NOT EXISTS internal_account_number VARCHAR(5),
ADD COLUMN IF NOT EXISTS destination_client_id UUID,
ADD COLUMN IF NOT EXISTS is_internal_transfer BOOLEAN DEFAULT FALSE;

-- Add foreign key constraint for destination_client_id
ALTER TABLE operations_history 
ADD CONSTRAINT fk_operations_destination_client 
FOREIGN KEY (destination_client_id) REFERENCES clients(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operations_internal_account_number ON operations_history(internal_account_number);
CREATE INDEX IF NOT EXISTS idx_operations_destination_client_id ON operations_history(destination_client_id);
CREATE INDEX IF NOT EXISTS idx_operations_is_internal_transfer ON operations_history(is_internal_transfer);

-- Add comments for documentation
COMMENT ON COLUMN operations_history.internal_account_number IS 'Internal account number (5 digits) for internal transfers';
COMMENT ON COLUMN operations_history.destination_client_id IS 'Client ID of the destination for internal transfers';
COMMENT ON COLUMN operations_history.is_internal_transfer IS 'Boolean flag indicating if this is an internal transfer between clients';
