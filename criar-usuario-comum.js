require('dotenv').config({ path: './swapone-fintech-api/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Criando usuário comum...\n');

if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'your_service_role_key_here') {
  console.log('⚠️  SERVICE_ROLE_KEY não configurada.');
  console.log('📝 Para criar usuários, você precisa:');
  console.log('');
  console.log('1. Ir para: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/settings/api');
  console.log('2. Copiar a "service_role" key (secret)');
  console.log('3. Atualizar o .env com: SUPABASE_SERVICE_ROLE_KEY=sua_chave');
  console.log('');
  console.log('ℹ️  Por enquanto, crie manualmente no dashboard do Supabase:');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📧 USUÁRIO COMUM PARA CRIAR:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('Email: cliente@swapone.com');
  console.log('Senha: cliente123');
  console.log('Role: client (na tabela profiles)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('👤 USUÁRIOS JÁ EXISTENTES:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('🔐 ADMIN:');
  console.log('   Email: admin@swapone.com');
  console.log('   Senha: admin123');
  console.log('   Role: admin (precisa alterar para "admin" na tabela profiles)');
  console.log('');
  console.log('👤 CLIENTE:');
  console.log('   Email: teste@swapone.com');
  console.log('   Senha: 123456');
  console.log('   Role: client');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📝 PASSOS NO SUPABASE DASHBOARD:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('1. Ir para: Table Editor → profiles');
  console.log('2. Encontrar linha com id do admin@swapone.com');
  console.log('3. Alterar campo "role" de "client" para "admin"');
  console.log('4. Salvar');
  console.log('');
  console.log('5. Para criar novo usuário:');
  console.log('   - Ir para: Authentication → Users');
  console.log('   - Clicar em "Add user" → "Create new user"');
  console.log('   - Email: cliente@swapone.com');
  console.log('   - Password: cliente123');
  console.log('   - Confirmar email automaticamente: ✓');
  console.log('   - Criar');
  console.log('');
  console.log('6. Após criar, ir para Table Editor → profiles');
  console.log('   - Criar novo registro:');
  console.log('     - id: (UUID do usuário criado)');
  console.log('     - client_id: 00000000-0000-0000-0000-000000000001');
  console.log('     - role: client');
  console.log('     - twofa_enabled: false');
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function criarUsuarioComum() {
  const email = 'cliente@swapone.com';
  const password = 'cliente123';
  const clientId = '00000000-0000-0000-0000-000000000001';

  try {
    const { data: userAuth, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      app_metadata: {
        provider: 'email',
        providers: ['email']
      },
      user_metadata: {
        name: 'Cliente Comum'
      }
    });

    if (authError) throw authError;

    console.log('✅ Usuário criado!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}`);
    console.log(`👤 ID: ${userAuth.user.id}`);

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: userAuth.user.id,
          client_id: clientId,
          role: 'client',
          twofa_enabled: false,
        },
      ]);

    if (profileError) throw profileError;

    console.log('✅ Perfil criado com role: CLIENT');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

criarUsuarioComum();



