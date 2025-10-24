require('dotenv').config({ path: './.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupUsers() {
  console.log('🚀 Configurando usuários do sistema...\n');

  try {
    // 1. Atualizar admin@swapone.com para role "admin"
    console.log('1️⃣ Atualizando admin@swapone.com para role ADMIN...');
    
    const { data: adminUsers, error: adminSearchError } = await supabase.auth.admin.listUsers();
    
    if (adminSearchError) {
      throw adminSearchError;
    }

    const adminUser = adminUsers.users.find(u => u.email === 'admin@swapone.com');
    
    if (adminUser) {
      // Atualizar perfil para role admin
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', adminUser.id);

      if (profileUpdateError) {
        console.error('  ⚠️ Erro ao atualizar perfil:', profileUpdateError.message);
      } else {
        console.log('  ✅ admin@swapone.com agora tem role: ADMIN');
        console.log(`  📧 Email: admin@swapone.com`);
        console.log(`  🔑 Senha: admin123`);
        console.log(`  👤 ID: ${adminUser.id}\n`);
      }
    } else {
      console.log('  ⚠️ Usuário admin@swapone.com não encontrado\n');
    }

    // 2. Verificar se teste@swapone.com existe
    console.log('2️⃣ Verificando teste@swapone.com...');
    
    const testeUser = adminUsers.users.find(u => u.email === 'teste@swapone.com');
    
    if (testeUser) {
      // Garantir que é role client
      const { error: testeProfileError } = await supabase
        .from('profiles')
        .update({ role: 'client' })
        .eq('id', testeUser.id);

      if (testeProfileError) {
        console.error('  ⚠️ Erro ao atualizar perfil:', testeProfileError.message);
      } else {
        console.log('  ✅ teste@swapone.com já existe com role: CLIENT');
        console.log(`  📧 Email: teste@swapone.com`);
        console.log(`  🔑 Senha: 123456`);
        console.log(`  👤 ID: ${testeUser.id}\n`);
      }
    } else {
      console.log('  ℹ️ teste@swapone.com não encontrado\n');
    }

    // 3. Criar novo usuário comum: cliente@swapone.com
    console.log('3️⃣ Criando usuário comum: cliente@swapone.com...');
    
    const clientEmail = 'cliente@swapone.com';
    const clientPassword = 'cliente123';
    const clientId = '00000000-0000-0000-0000-000000000001'; // Cliente demo

    // Verificar se já existe
    const existingClient = adminUsers.users.find(u => u.email === clientEmail);
    
    if (existingClient) {
      console.log('  ℹ️ cliente@swapone.com já existe');
      console.log(`  👤 ID: ${existingClient.id}\n`);
    } else {
      // Criar novo usuário
      const { data: newClient, error: createError } = await supabase.auth.admin.createUser({
        email: clientEmail,
        password: clientPassword,
        email_confirm: true,
        app_metadata: {
          provider: 'email',
          providers: ['email']
        },
        user_metadata: {
          name: 'Cliente Comum'
        }
      });

      if (createError) {
        console.error('  ❌ Erro ao criar usuário:', createError.message);
      } else {
        console.log('  ✅ Usuário criado com sucesso!');
        console.log(`  📧 Email: ${clientEmail}`);
        console.log(`  🔑 Senha: ${clientPassword}`);
        console.log(`  👤 ID: ${newClient.user.id}`);

        // Criar perfil
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert([
            {
              id: newClient.user.id,
              client_id: clientId,
              role: 'client',
              twofa_enabled: false,
            },
          ]);

        if (profileCreateError) {
          console.error('  ⚠️ Erro ao criar perfil:', profileCreateError.message);
        } else {
          console.log('  ✅ Perfil criado com role: CLIENT\n');
        }
      }
    }

    // 4. Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SETUP CONCLUÍDO!\n');
    console.log('👥 USUÁRIOS DISPONÍVEIS:\n');
    console.log('🔐 ADMIN:');
    console.log('   Email: admin@swapone.com');
    console.log('   Senha: admin123');
    console.log('   Role: admin\n');
    console.log('👤 CLIENTE 1:');
    console.log('   Email: teste@swapone.com');
    console.log('   Senha: 123456');
    console.log('   Role: client\n');
    console.log('👤 CLIENTE 2:');
    console.log('   Email: cliente@swapone.com');
    console.log('   Senha: cliente123');
    console.log('   Role: client\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('\n❌ Erro durante setup:', error.message);
    console.error(error);
    process.exit(1);
  }
}

setupUsers();

