-- Criar tabela de histórico de operações
CREATE TABLE IF NOT EXISTS operations_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados da operação
  quotation_id VARCHAR(255) NOT NULL,
  operation_type VARCHAR(10) NOT NULL CHECK (operation_type IN ('buy', 'sell')),
  currency VARCHAR(10) NOT NULL,
  
  -- Valores
  amount DECIMAL(20, 2) NOT NULL,
  brl_amount DECIMAL(20, 2) NOT NULL,
  final_quotation DECIMAL(20, 8) NOT NULL,
  
  -- Taxa aplicada
  markup_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  
  -- Detalhes da cotação
  quote DECIMAL(20, 8),
  vet DECIMAL(20, 8),
  iof DECIMAL(20, 2),
  fees_amount DECIMAL(20, 2),
  
  -- Status da operação
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'failed', 'cancelled')),
  
  -- Resposta do Braza Bank
  braza_response JSONB,
  braza_order_id VARCHAR(255),
  
  -- Dados do cliente
  client_name VARCHAR(255),
  client_cpf_cnpj VARCHAR(20),
  client_braza_id INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_operations_user_id ON operations_history(user_id);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations_history(status);
CREATE INDEX IF NOT EXISTS idx_operations_created_at ON operations_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operations_quotation_id ON operations_history(quotation_id);

-- RLS (Row Level Security)
ALTER TABLE operations_history ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas suas próprias operações
CREATE POLICY "Users can view own operations"
  ON operations_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Admins podem ver todas as operações
CREATE POLICY "Admins can view all operations"
  ON operations_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Sistema pode inserir operações
CREATE POLICY "System can insert operations"
  ON operations_history
  FOR INSERT
  WITH CHECK (true);

-- Política: Sistema pode atualizar operações
CREATE POLICY "System can update operations"
  ON operations_history
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_operations_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_operations_history_updated_at_trigger
  BEFORE UPDATE ON operations_history
  FOR EACH ROW
  EXECUTE FUNCTION update_operations_history_updated_at();


