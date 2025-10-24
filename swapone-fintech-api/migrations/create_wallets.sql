-- Criar tabela de carteiras (wallets) para armazenar saldos por moeda
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency VARCHAR(10) NOT NULL,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, currency)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_currency ON wallets(currency);
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets(user_id, currency);

-- RLS (Row Level Security)
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias carteiras
CREATE POLICY "Users can view own wallets"
  ON wallets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Admins podem ver todas as carteiras
CREATE POLICY "Admins can view all wallets"
  ON wallets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Sistema pode inserir carteiras
CREATE POLICY "System can insert wallets"
  ON wallets
  FOR INSERT
  WITH CHECK (true);

-- Política: Sistema pode atualizar carteiras
CREATE POLICY "System can update wallets"
  ON wallets
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wallets_updated_at_trigger
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_wallets_updated_at();

-- Função para inicializar carteiras de um usuário
CREATE OR REPLACE FUNCTION initialize_user_wallets(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_currencies TEXT[] := ARRAY['USD', 'EUR', 'GBP', 'BRL', 'USDC', 'USDT'];
  v_currency TEXT;
BEGIN
  FOREACH v_currency IN ARRAY v_currencies
  LOOP
    INSERT INTO wallets (user_id, currency, balance)
    VALUES (p_user_id, v_currency, 0)
    ON CONFLICT (user_id, currency) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inicializar carteiras para o usuário cliente01
SELECT initialize_user_wallets('43d57990-68d1-4194-b074-5b894a2b9f82');

-- Verificar se as carteiras foram criadas
SELECT user_id, currency, balance, created_at 
FROM wallets 
WHERE user_id = '43d57990-68d1-4194-b074-5b894a2b9f82'
ORDER BY currency;

