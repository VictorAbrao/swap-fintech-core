-- ⚠️ ATENÇÃO: Este script irá APAGAR TODOS os dados de operações e zerar saldos
-- Execute com cuidado!

-- 1. Ver quantas operações existem antes de excluir
SELECT 
  COUNT(*) as total_operations,
  COUNT(CASE WHEN status = 'executed' THEN 1 END) as executed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM operations_history;

-- 2. Ver saldos atuais antes de zerar
SELECT 
  c.name as client_name,
  w.currency,
  w.balance
FROM wallets w
LEFT JOIN clients c ON c.id = w.client_id
WHERE w.user_id IS NULL
ORDER BY c.name, w.currency;

-- 3. EXCLUIR todas as operações
DELETE FROM operations_history;

-- 4. ZERAR todos os saldos das carteiras
UPDATE wallets 
SET balance = 0 
WHERE user_id IS NULL;

-- 5. Verificar que tudo foi limpo
SELECT 'Operations after delete:' as info, COUNT(*) as count FROM operations_history
UNION ALL
SELECT 'Wallets with balance > 0:' as info, COUNT(*) as count FROM wallets WHERE balance > 0 AND user_id IS NULL;

-- 6. Ver saldos finais (deve estar tudo zerado)
SELECT 
  c.name as client_name,
  w.currency,
  w.balance
FROM wallets w
LEFT JOIN clients c ON c.id = w.client_id
WHERE w.user_id IS NULL
ORDER BY c.name, w.currency;

