-- Criar tabela para armazenar todas as requests feitas para o Braza Bank
CREATE TABLE IF NOT EXISTS braza_requests_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Informações da request
  request_type VARCHAR(50) NOT NULL, -- 'quotation', 'preview', 'execute', etc.
  endpoint VARCHAR(255) NOT NULL, -- URL do endpoint chamado
  method VARCHAR(10) NOT NULL DEFAULT 'POST', -- GET, POST, PUT, DELETE
  
  -- Dados da request
  request_payload JSONB, -- Payload enviado para o Braza Bank
  request_headers JSONB, -- Headers da request
  
  -- Dados da response
  response_status INTEGER, -- Status HTTP da response
  response_payload JSONB, -- Payload recebido do Braza Bank
  response_headers JSONB, -- Headers da response
  
  -- Informações de timing
  request_duration_ms INTEGER, -- Duração da request em milissegundos
  
  -- Informações de erro
  error_message TEXT, -- Mensagem de erro se houver
  error_code VARCHAR(50), -- Código de erro se houver
  
  -- Metadados
  user_id UUID, -- ID do usuário que fez a request (se aplicável)
  client_id UUID, -- ID do cliente (se aplicável)
  quotation_id VARCHAR(255), -- ID da cotação relacionada (se aplicável)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_braza_requests_type ON braza_requests_log(request_type);
CREATE INDEX IF NOT EXISTS idx_braza_requests_endpoint ON braza_requests_log(endpoint);
CREATE INDEX IF NOT EXISTS idx_braza_requests_status ON braza_requests_log(response_status);
CREATE INDEX IF NOT EXISTS idx_braza_requests_created_at ON braza_requests_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_braza_requests_user_id ON braza_requests_log(user_id);
CREATE INDEX IF NOT EXISTS idx_braza_requests_client_id ON braza_requests_log(client_id);
CREATE INDEX IF NOT EXISTS idx_braza_requests_quotation_id ON braza_requests_log(quotation_id);

-- Índice composto para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_braza_requests_type_created ON braza_requests_log(request_type, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE braza_requests_log ENABLE ROW LEVEL SECURITY;

-- Política: Admins podem ver todas as requests
CREATE POLICY "Admins can view all braza requests"
  ON braza_requests_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Sistema pode inserir requests
CREATE POLICY "System can insert braza requests"
  ON braza_requests_log
  FOR INSERT
  WITH CHECK (true);

-- Política: Sistema pode atualizar requests
CREATE POLICY "System can update braza requests"
  ON braza_requests_log
  FOR UPDATE
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_braza_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_braza_requests_updated_at_trigger
  BEFORE UPDATE ON braza_requests_log
  FOR EACH ROW
  EXECUTE FUNCTION update_braza_requests_updated_at();

-- Comentários para documentação
COMMENT ON TABLE braza_requests_log IS 'Log de todas as requests feitas para o Braza Bank';
COMMENT ON COLUMN braza_requests_log.request_type IS 'Tipo da request (quotation, preview, execute, etc.)';
COMMENT ON COLUMN braza_requests_log.endpoint IS 'Endpoint do Braza Bank chamado';
COMMENT ON COLUMN braza_requests_log.request_payload IS 'Payload JSON enviado para o Braza Bank';
COMMENT ON COLUMN braza_requests_log.response_payload IS 'Payload JSON recebido do Braza Bank';
COMMENT ON COLUMN braza_requests_log.request_duration_ms IS 'Duração da request em milissegundos';
COMMENT ON COLUMN braza_requests_log.error_message IS 'Mensagem de erro se a request falhou';
COMMENT ON COLUMN braza_requests_log.quotation_id IS 'ID da cotação relacionada à request';
