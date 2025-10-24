-- ========================================
-- ALTERAR ROLE DO ADMIN PARA "admin"
-- ========================================
-- Execute este SQL no Supabase Dashboard:
-- SQL Editor → New Query → Colar e executar
-- ========================================

-- 1. Atualizar role na tabela profiles
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'e6533471-7316-434e-8a9b-a8ee9f2603f0';

-- 2. Verificar se foi atualizado
SELECT id, role, client_id, twofa_enabled, created_at
FROM public.profiles
WHERE id = 'e6533471-7316-434e-8a9b-a8ee9f2603f0';

-- ========================================
-- RESULTADO ESPERADO:
-- ========================================
-- id: e6533471-7316-434e-8a9b-a8ee9f2603f0
-- role: admin  ← Deve mostrar "admin" agora
-- client_id: null
-- twofa_enabled: false
-- ========================================



