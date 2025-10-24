require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkProfilesTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela profiles...');
    
    // Buscar alguns registros para ver a estrutura
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar profiles:', error);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Estrutura da tabela profiles:');
      const profile = profiles[0];
      Object.keys(profile).forEach(key => {
        console.log(`   - ${key}: ${typeof profile[key]} = ${profile[key]}`);
      });
    } else {
      console.log('📝 Tabela profiles está vazia');
    }
    
    // Tentar inserir um perfil simples
    console.log('\n🔍 Tentando criar perfil simples...');
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: '43d57990-68d1-4194-b074-5b894a2b9f82',
        role: 'client',
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        user_name: 'Cliente 01'
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar perfil:', createError);
    } else {
      console.log('✅ Perfil criado com sucesso:', newProfile);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkProfilesTable();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkProfilesTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela profiles...');
    
    // Buscar alguns registros para ver a estrutura
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar profiles:', error);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Estrutura da tabela profiles:');
      const profile = profiles[0];
      Object.keys(profile).forEach(key => {
        console.log(`   - ${key}: ${typeof profile[key]} = ${profile[key]}`);
      });
    } else {
      console.log('📝 Tabela profiles está vazia');
    }
    
    // Tentar inserir um perfil simples
    console.log('\n🔍 Tentando criar perfil simples...');
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: '43d57990-68d1-4194-b074-5b894a2b9f82',
        role: 'client',
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        user_name: 'Cliente 01'
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Erro ao criar perfil:', createError);
    } else {
      console.log('✅ Perfil criado com sucesso:', newProfile);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkProfilesTable();
