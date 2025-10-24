const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://sfncazmkxhschlizcjdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbmNhem1reGhzY2hsaXpjamRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NzAwMDUsImV4cCI6MjA3NjU0NjAwNX0.UWuodAKKIO0Un7eaU4Oa1NwrtOjd8PW1JQo4nVIHqnA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarUsuario() {
  console.log('🚀 Criando usuário de teste...');
  
  try {
    // Criar usuário via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: 'teste@swapone.com',
      password: '123456',
      options: {
        data: {
          name: 'Usuário Teste'
        }
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email: teste@swapone.com');
    console.log('🔑 Senha: 123456');
    console.log('👤 ID:', data.user?.id);

    // Aguardar um pouco para o usuário ser processado
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se o usuário foi criado
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('⚠️ Não foi possível listar usuários (normal se não for admin)');
    } else {
      const usuarioCriado = users.users.find(u => u.email === 'teste@swapone.com');
      if (usuarioCriado) {
        console.log('✅ Usuário confirmado na lista:', usuarioCriado.email);
      }
    }

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

criarUsuario();
