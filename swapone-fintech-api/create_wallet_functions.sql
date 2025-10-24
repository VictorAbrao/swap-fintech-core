-- Função para atualizar saldo da carteira
CREATE OR REPLACE FUNCTION update_wallet_balance(
  p_client_id UUID,
  p_currency TEXT,
  p_amount DECIMAL,
  p_operation TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  wallet_record RECORD;
  new_balance DECIMAL;
  result JSON;
BEGIN
  -- Buscar a carteira
  SELECT * INTO wallet_record
  FROM wallets
  WHERE client_id = p_client_id AND currency = p_currency;
  
  -- Se não encontrar, criar uma nova carteira
  IF NOT FOUND THEN
    INSERT INTO wallets (client_id, currency, balance, created_at, updated_at)
    VALUES (p_client_id, p_currency, 0, NOW(), NOW())
    RETURNING * INTO wallet_record;
  END IF;
  
  -- Calcular novo saldo baseado na operação
  IF p_operation = 'add' THEN
    new_balance := wallet_record.balance + p_amount;
  ELSIF p_operation = 'subtract' THEN
    new_balance := wallet_record.balance - p_amount;
  ELSE
    RAISE EXCEPTION 'Operação inválida: %', p_operation;
  END IF;
  
  -- Atualizar o saldo
  UPDATE wallets
  SET balance = new_balance, updated_at = NOW()
  WHERE client_id = p_client_id AND currency = p_currency;
  
  -- Retornar resultado
  result := json_build_object(
    'success', true,
    'client_id', p_client_id,
    'currency', p_currency,
    'old_balance', wallet_record.balance,
    'new_balance', new_balance,
    'operation', p_operation,
    'amount', p_amount
  );
  
  RETURN result;
END;
$$;

-- Função para atualizar limite anual de uso
CREATE OR REPLACE FUNCTION update_annual_usage(
  p_client_id UUID,
  p_currency TEXT,
  p_amount DECIMAL,
  p_operation TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  usage_record RECORD;
  new_usage DECIMAL;
  result JSON;
BEGIN
  -- Buscar o registro de uso anual
  SELECT * INTO usage_record
  FROM annual_usage_limits
  WHERE client_id = p_client_id AND currency = p_currency;
  
  -- Se não encontrar, criar um novo registro
  IF NOT FOUND THEN
    INSERT INTO annual_usage_limits (client_id, currency, used_amount, limit_amount, created_at, updated_at)
    VALUES (p_client_id, p_currency, 0, 1000000, NOW(), NOW())
    RETURNING * INTO usage_record;
  END IF;
  
  -- Calcular novo uso baseado na operação
  IF p_operation = 'add' THEN
    new_usage := usage_record.used_amount + p_amount;
  ELSIF p_operation = 'subtract' THEN
    new_usage := GREATEST(0, usage_record.used_amount - p_amount);
  ELSE
    RAISE EXCEPTION 'Operação inválida: %', p_operation;
  END IF;
  
  -- Atualizar o uso
  UPDATE annual_usage_limits
  SET used_amount = new_usage, updated_at = NOW()
  WHERE client_id = p_client_id AND currency = p_currency;
  
  -- Retornar resultado
  result := json_build_object(
    'success', true,
    'client_id', p_client_id,
    'currency', p_currency,
    'old_usage', usage_record.used_amount,
    'new_usage', new_usage,
    'operation', p_operation,
    'amount', p_amount
  );
  
  RETURN result;
END;
$$;
