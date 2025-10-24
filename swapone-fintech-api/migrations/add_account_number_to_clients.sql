-- Migration: Add account_number column to clients table
-- This migration adds a unique account_number column to the clients table

-- Add the account_number column
ALTER TABLE clients 
ADD COLUMN account_number VARCHAR(5) UNIQUE;

-- Add index for better performance
CREATE INDEX idx_clients_account_number ON clients(account_number);

-- Add comment to the column
COMMENT ON COLUMN clients.account_number IS 'Unique 5-digit account number for the client';
