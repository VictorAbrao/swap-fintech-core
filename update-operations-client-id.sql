-- Atualizar client_id nas operações existentes

-- 1. Ver operações sem client_id
SELECT 
  oh.id,
  oh.user_id,
  oh.client_id,
  p.client_id as profile_client_id,
  oh.currency,
  oh.amount,
  oh.operation_type,
  oh.status
FROM operations_history oh
LEFT JOIN profiles p ON p.id = oh.user_id
WHERE oh.client_id IS NULL
ORDER BY oh.created_at DESC;

-- 2. ATUALIZAR as operações com client_id dos perfis
UPDATE operations_history oh
SET client_id = p.client_id
FROM profiles p
WHERE oh.user_id = p.id
  AND oh.client_id IS NULL;

-- 3. Verificar se foi atualizado
SELECT 
  oh.id,
  oh.user_id,
  oh.client_id,
  oh.currency,
  oh.amount,
  oh.operation_type,
  oh.status,
  c.name as client_name
FROM operations_history oh
LEFT JOIN clients c ON c.id = oh.client_id
ORDER BY oh.created_at DESC
LIMIT 10;

-- 4. Contar operações por cliente
SELECT 
  c.name as client_name,
  oh.client_id,
  COUNT(*) as total_operations,
  SUM(CASE WHEN oh.status = 'executed' THEN 1 ELSE 0 END) as executed,
  SUM(CASE WHEN oh.status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN oh.status = 'failed' THEN 1 ELSE 0 END) as failed
FROM operations_history oh
LEFT JOIN clients c ON c.id = oh.client_id
GROUP BY c.name, oh.client_id
ORDER BY c.name;
