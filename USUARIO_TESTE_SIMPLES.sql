-- USUÁRIO DE TESTE PARA SWAPONE FINTECH
-- Execute este SQL no dashboard: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/sql

-- 1. Criar usuário de teste
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'teste@swapone.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Usuário Teste"}',
  false,
  'authenticated'
);

-- 2. Criar perfil do usuário
INSERT INTO public.profiles (
  id,
  client_id,
  role,
  twofa_enabled,
  created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'client',
  false,
  now()
);

-- 3. Verificar se foi criado
SELECT 
  u.id,
  u.email,
  p.role,
  c.name as client_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.clients c ON p.client_id = c.id
WHERE u.email = 'teste@swapone.com';
