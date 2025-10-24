const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://sfncazmkxhschlizcjdg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbmNhem1reGhzY2hsaXpjamRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NzAwMDUsImV4cCI6MjA3NjU0NjAwNX0.UWuodAKKIO0Un7eaU4Oa1NwrtOjd8PW1JQo4nVIHqnA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function criarUsuario2() {
  console.log('🚀 Criando segundo usuário de teste...');
  
  try {
    // Criar usuário via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@swapone.com',
      password: 'admin123',
      options: {
        data: {
          name: 'Administrador'
        }
      }
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      return;
    }

    console.log('✅ Segundo usuário criado com sucesso!');
    console.log('📧 Email: admin@swapone.com');
    console.log('🔑 Senha: admin123');
    console.log('👤 ID:', data.user?.id);

    // Aguardar um pouco para o usuário ser processado
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🎯 Usuário pronto para login!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

criarUsuario2();
