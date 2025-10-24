-- Script SUPER SIMPLES: 12 carteiras (6 para cada cliente)

-- 1. Remover constraint NOT NULL de user_id
ALTER TABLE wallets ALTER COLUMN user_id DROP NOT NULL;

-- 2. Limpar todas as carteiras
DELETE FROM wallets;

-- 3. Criar 6 carteiras para cliente 3540fd26-9b18-4a88-b589-5cbac8378aa9
INSERT INTO wallets (client_id, currency, balance, created_at, updated_at) VALUES
('3540fd26-9b18-4a88-b589-5cbac8378aa9', 'USDT', 0, NOW(), NOW()),
('3540fd26-9b18-4a88-b589-5cbac8378aa9', 'BRL', 0, NOW(), NOW()),
('3540fd26-9b18-4a88-b589-5cbac8378aa9', 'USD', 0, NOW(), NOW()),
('3540fd26-9b18-4a88-b589-5cbac8378aa9', 'EUR', 0, NOW(), NOW()),
('3540fd26-9b18-4a88-b589-5cbac8378aa9', 'GBP', 0, NOW(), NOW()),
('3540fd26-9b18-4a88-b589-5cbac8378aa9', 'USDC', 0, NOW(), NOW());

-- 4. Criar 6 carteiras para cliente 00000000-0000-0000-0000-000000000001
INSERT INTO wallets (client_id, currency, balance, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'USDT', 0, NOW(), NOW()),
('00000000-0000-0000-0000-000000000001', 'BRL', 0, NOW(), NOW()),
('00000000-0000-0000-0000-000000000001', 'USD', 0, NOW(), NOW()),
('00000000-0000-0000-0000-000000000001', 'EUR', 0, NOW(), NOW()),
('00000000-0000-0000-0000-000000000001', 'GBP', 0, NOW(), NOW()),
('00000000-0000-0000-0000-000000000001', 'USDC', 0, NOW(), NOW());

-- 5. Verificar resultado
SELECT 
    client_id,
    currency,
    balance
FROM wallets 
ORDER BY client_id, currency;
