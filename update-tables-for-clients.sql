-- Execute apenas isso (tabela clients já existe)

-- Atualizar profiles
ALTER TABLE profiles ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN user_name VARCHAR(255);
ALTER TABLE profiles ADD COLUMN user_cpf VARCHAR(14);
CREATE INDEX idx_profiles_client_id ON profiles(client_id);

-- Atualizar wallets
ALTER TABLE wallets ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX idx_wallets_client_id ON wallets(client_id);

-- Atualizar operations_history
ALTER TABLE operations_history ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
CREATE INDEX idx_operations_client_id ON operations_history(client_id);

