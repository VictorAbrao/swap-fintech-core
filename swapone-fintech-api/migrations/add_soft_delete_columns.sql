-- Migration: Add soft delete columns to all tables
-- This migration adds deleted_at and is_deleted columns to enable soft delete functionality

-- 1. Add soft delete columns to clients table
ALTER TABLE clients 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at);
CREATE INDEX idx_clients_is_deleted ON clients(is_deleted);

-- 2. Add soft delete columns to profiles (users) table
ALTER TABLE profiles 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);
CREATE INDEX idx_profiles_is_deleted ON profiles(is_deleted);

-- 3. Add soft delete columns to operations_history (transactions) table
ALTER TABLE operations_history 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_operations_history_deleted_at ON operations_history(deleted_at);
CREATE INDEX idx_operations_history_is_deleted ON operations_history(is_deleted);

-- 4. Add soft delete columns to beneficiaries table
ALTER TABLE beneficiaries 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_beneficiaries_deleted_at ON beneficiaries(deleted_at);
CREATE INDEX idx_beneficiaries_is_deleted ON beneficiaries(is_deleted);

-- 5. Add soft delete columns to wallets table
ALTER TABLE wallets 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_wallets_deleted_at ON wallets(deleted_at);
CREATE INDEX idx_wallets_is_deleted ON wallets(is_deleted);

-- 6. Add soft delete columns to client_markups table
ALTER TABLE client_markups 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_client_markups_deleted_at ON client_markups(deleted_at);
CREATE INDEX idx_client_markups_is_deleted ON client_markups(is_deleted);

-- 7. Add soft delete columns to braza_requests_log table
ALTER TABLE braza_requests_log 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_braza_requests_log_deleted_at ON braza_requests_log(deleted_at);
CREATE INDEX idx_braza_requests_log_is_deleted ON braza_requests_log(is_deleted);

-- 8. Add soft delete columns to webhook_notifications table
ALTER TABLE webhook_notifications 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for better performance on soft delete queries
CREATE INDEX idx_webhook_notifications_deleted_at ON webhook_notifications(deleted_at);
CREATE INDEX idx_webhook_notifications_is_deleted ON webhook_notifications(is_deleted);

-- Add comments for documentation
COMMENT ON COLUMN clients.deleted_at IS 'Timestamp when the client was soft deleted';
COMMENT ON COLUMN clients.is_deleted IS 'Boolean flag indicating if the client is soft deleted';

COMMENT ON COLUMN profiles.deleted_at IS 'Timestamp when the user was soft deleted';
COMMENT ON COLUMN profiles.is_deleted IS 'Boolean flag indicating if the user is soft deleted';

COMMENT ON COLUMN operations_history.deleted_at IS 'Timestamp when the transaction was soft deleted';
COMMENT ON COLUMN operations_history.is_deleted IS 'Boolean flag indicating if the transaction is soft deleted';

COMMENT ON COLUMN beneficiaries.deleted_at IS 'Timestamp when the beneficiary was soft deleted';
COMMENT ON COLUMN beneficiaries.is_deleted IS 'Boolean flag indicating if the beneficiary is soft deleted';

COMMENT ON COLUMN wallets.deleted_at IS 'Timestamp when the wallet was soft deleted';
COMMENT ON COLUMN wallets.is_deleted IS 'Boolean flag indicating if the wallet is soft deleted';

COMMENT ON COLUMN client_markups.deleted_at IS 'Timestamp when the markup was soft deleted';
COMMENT ON COLUMN client_markups.is_deleted IS 'Boolean flag indicating if the markup is soft deleted';

COMMENT ON COLUMN braza_requests_log.deleted_at IS 'Timestamp when the request log was soft deleted';
COMMENT ON COLUMN braza_requests_log.is_deleted IS 'Boolean flag indicating if the request log is soft deleted';

COMMENT ON COLUMN webhook_notifications.deleted_at IS 'Timestamp when the webhook notification was soft deleted';
COMMENT ON COLUMN webhook_notifications.is_deleted IS 'Boolean flag indicating if the webhook notification is soft deleted';
