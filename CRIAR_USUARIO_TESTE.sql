-- Script para criar usuário de teste no Supabase
-- Execute este SQL no dashboard: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/sql

-- 1. Criar usuário de teste (admin)
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
  '00000000-0000-0000-0000-000000000001',
  'admin@swapone.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User"}',
  false,
  'authenticated'
);

-- 2. Criar perfil do usuário admin
INSERT INTO public.profiles (
  id,
  client_id,
  role,
  twofa_enabled,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  false,
  now()
);

-- 3. Criar usuário de teste (cliente)
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
  '00000000-0000-0000-0000-000000000002',
  'client@swapone.com',
  crypt('client123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Client User"}',
  false,
  'authenticated'
);

-- 4. Criar perfil do usuário cliente
INSERT INTO public.profiles (
  id,
  client_id,
  role,
  twofa_enabled,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'client',
  false,
  now()
);

-- 5. Criar contas para o cliente
INSERT INTO public.accounts (id, client_id, currency, balance, created_at) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'USD', 50000.00, now()),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'EUR', 25000.00, now()),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'BRL', 100000.00, now());

-- 6. Verificar se os usuários foram criados
SELECT 
  u.id,
  u.email,
  p.role,
  c.name as client_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.clients c ON p.client_id = c.id
WHERE u.email IN ('admin@swapone.com', 'client@swapone.com');
