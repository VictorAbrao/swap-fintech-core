-- Criar tabela para taxas de conversão FX Trade
CREATE TABLE IF NOT EXISTS fx_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_currency VARCHAR(5) NOT NULL,
    to_currency VARCHAR(5) NOT NULL,
    rate DECIMAL(10, 6) NOT NULL,
    spread_bps INTEGER DEFAULT 0, -- Spread em basis points (1 bps = 0.01%)
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Garantir que não há duplicatas para o mesmo par de moedas
    UNIQUE(from_currency, to_currency)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fx_rates_from_to ON fx_rates(from_currency, to_currency);
CREATE INDEX IF NOT EXISTS idx_fx_rates_active ON fx_rates(active);

-- Inserir taxas padrão para os pares mais comuns
INSERT INTO fx_rates (from_currency, to_currency, rate, spread_bps) VALUES
    ('USD', 'BRL', 5.20, 50),
    ('EUR', 'BRL', 5.65, 50),
    ('GBP', 'BRL', 6.55, 50),
    ('USDC', 'BRL', 5.20, 10),
    ('USDT', 'BRL', 5.20, 10),
    ('BRL', 'USD', 0.192, 50),
    ('BRL', 'EUR', 0.177, 50),
    ('BRL', 'GBP', 0.153, 50),
    ('BRL', 'USDC', 0.192, 10),
    ('BRL', 'USDT', 0.192, 10)
ON CONFLICT (from_currency, to_currency) DO NOTHING;

-- Políticas RLS
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;

-- Política para leitura pública (necessário para cotação)
CREATE POLICY "Public can read active fx rates"
    ON fx_rates FOR SELECT
    USING (active = true);

-- Política para administradores
CREATE POLICY "Admins can manage fx rates"
    ON fx_rates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_fx_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_fx_rates_updated_at_trigger
    BEFORE UPDATE ON fx_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_fx_rates_updated_at();
