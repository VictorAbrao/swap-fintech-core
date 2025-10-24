-- Script para verificar e atualizar a estrutura da tabela wallets
-- para funcionar com client_id

-- 1. Verificar estrutura atual da tabela wallets
SELECT 
    'Current wallets table structure' as description,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'wallets' 
ORDER BY ordinal_position;

-- 2. Verificar se existe relação entre wallets e profiles
SELECT 
    'Wallets-Profiles relationship check' as description,
    COUNT(*) as total_wallets,
    COUNT(p.client_id) as wallets_with_client_id
FROM wallets w
LEFT JOIN profiles p ON p.id = w.user_id;

-- 3. Verificar carteiras do cliente específico
SELECT 
    'Client wallets check' as description,
    w.id,
    w.user_id,
    w.currency,
    w.balance,
    p.client_id
FROM wallets w
LEFT JOIN profiles p ON p.id = w.user_id
WHERE p.client_id = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

-- 4. Se necessário, adicionar coluna client_id diretamente na tabela wallets
-- (Descomente se necessário)
/*
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Atualizar client_id baseado no user_id
UPDATE wallets 
SET client_id = (
    SELECT p.client_id 
    FROM profiles p 
    WHERE p.id = wallets.user_id
)
WHERE client_id IS NULL 
AND user_id IS NOT NULL
AND EXISTS (
    SELECT 1 
    FROM profiles p 
    WHERE p.id = wallets.user_id 
    AND p.client_id IS NOT NULL
);
*/

-- 5. Verificar resultado após atualização (se aplicada)
SELECT 
    'Wallets with client_id after update' as description,
    COUNT(*) as total_wallets,
    COUNT(client_id) as wallets_with_client_id
FROM wallets;

-- 6. Mostrar carteiras do cliente após atualização
SELECT 
    'Final client wallets' as description,
    id,
    user_id,
    client_id,
    currency,
    balance,
    created_at,
    updated_at
FROM wallets 
WHERE client_id = '3540fd26-9b18-4a88-b589-5cbac8378aa9'
ORDER BY currency;
