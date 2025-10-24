-- Criar tabela de markups por cliente e par de moedas
CREATE TABLE IF NOT EXISTS client_markups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  from_currency VARCHAR(10) NOT NULL,
  to_currency VARCHAR(10) NOT NULL,
  
  markup_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  spread_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_id, from_currency, to_currency)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_markups_client_id ON client_markups(client_id);
CREATE INDEX IF NOT EXISTS idx_client_markups_pair ON client_markups(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_client_markups_active ON client_markups(active);

-- RLS
ALTER TABLE client_markups ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os markups
CREATE POLICY "Admins can view all markups"
  ON client_markups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem inserir markups
CREATE POLICY "Admins can insert markups"
  ON client_markups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem atualizar markups
CREATE POLICY "Admins can update markups"
  ON client_markups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins podem deletar markups
CREATE POLICY "Admins can delete markups"
  ON client_markups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_client_markups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_markups_updated_at_trigger
  BEFORE UPDATE ON client_markups
  FOR EACH ROW
  EXECUTE FUNCTION update_client_markups_updated_at();

-- Função para inicializar markups padrão de um cliente
CREATE OR REPLACE FUNCTION initialize_client_markups(p_client_id UUID)
RETURNS void AS $$
BEGIN
  -- USDT → USD (sem spread, 1:1)
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'USDT', 'USD', 0, 0)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
  
  -- USD → EUR
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'USD', 'EUR', 0.5, 0)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
  
  -- USD → GBP
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'USD', 'GBP', 0.5, 0)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
  
  -- USD → USDT (com spread)
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'USD', 'USDT', 0.5, 0.1)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
  
  -- EUR → USD
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'EUR', 'USD', 0.5, 0)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
  
  -- EUR → GBP
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'EUR', 'GBP', 0.5, 0)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
  
  -- GBP → USD
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'GBP', 'USD', 0.5, 0)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
  
  -- GBP → EUR
  INSERT INTO client_markups (client_id, from_currency, to_currency, markup_percentage, spread_percentage)
  VALUES (p_client_id, 'GBP', 'EUR', 0.5, 0)
  ON CONFLICT (client_id, from_currency, to_currency) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

