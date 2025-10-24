require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAndCreateUserProfile() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';
    
    console.log('🔍 Verificando usuário na tabela auth.users...');
    
    // Buscar usuário na tabela auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('❌ Erro ao buscar usuário auth:', authError);
      return;
    }
    
    if (!authUser.user) {
      console.log('❌ Usuário não encontrado na tabela auth.users');
      return;
    }
    
    console.log('✅ Usuário encontrado na tabela auth.users:');
    console.log('   - ID:', authUser.user.id);
    console.log('   - Email:', authUser.user.email);
    console.log('   - Created:', authUser.user.created_at);
    
    // Verificar se existe perfil
    console.log('\n🔍 Verificando se existe perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }
    
    if (!profile) {
      console.log('❌ Perfil não existe. Criando...');
      
      // Criar perfil
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: authUser.user.email,
          role: 'client',
          client_id: clientId,
          user_name: 'Cliente 01',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar perfil:', createError);
        return;
      }
      
      console.log('✅ Perfil criado com sucesso:');
      console.log('   - ID:', newProfile.id);
      console.log('   - Email:', newProfile.email);
      console.log('   - Client ID:', newProfile.client_id);
      console.log('   - Role:', newProfile.role);
      
    } else {
      console.log('✅ Perfil já existe:');
      console.log('   - ID:', profile.id);
      console.log('   - Email:', profile.email);
      console.log('   - Client ID:', profile.client_id);
      console.log('   - Role:', profile.role);
    }
    
    // Verificar beneficiários
    console.log('\n🔍 Verificando beneficiários...');
    const { data: beneficiaries, error: beneficiariesError } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('client_id', clientId);
    
    if (beneficiariesError) {
      console.error('❌ Erro ao buscar beneficiários:', beneficiariesError);
    } else {
      console.log('✅ Beneficiários encontrados:', beneficiaries?.length || 0);
      beneficiaries?.forEach((beneficiary, index) => {
        console.log(`   ${index + 1}. ${beneficiary.beneficiary_name} (${beneficiary.transfer_method})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAndCreateUserProfile();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAndCreateUserProfile() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';
    
    console.log('🔍 Verificando usuário na tabela auth.users...');
    
    // Buscar usuário na tabela auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('❌ Erro ao buscar usuário auth:', authError);
      return;
    }
    
    if (!authUser.user) {
      console.log('❌ Usuário não encontrado na tabela auth.users');
      return;
    }
    
    console.log('✅ Usuário encontrado na tabela auth.users:');
    console.log('   - ID:', authUser.user.id);
    console.log('   - Email:', authUser.user.email);
    console.log('   - Created:', authUser.user.created_at);
    
    // Verificar se existe perfil
    console.log('\n🔍 Verificando se existe perfil...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }
    
    if (!profile) {
      console.log('❌ Perfil não existe. Criando...');
      
      // Criar perfil
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: authUser.user.email,
          role: 'client',
          client_id: clientId,
          user_name: 'Cliente 01',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Erro ao criar perfil:', createError);
        return;
      }
      
      console.log('✅ Perfil criado com sucesso:');
      console.log('   - ID:', newProfile.id);
      console.log('   - Email:', newProfile.email);
      console.log('   - Client ID:', newProfile.client_id);
      console.log('   - Role:', newProfile.role);
      
    } else {
      console.log('✅ Perfil já existe:');
      console.log('   - ID:', profile.id);
      console.log('   - Email:', profile.email);
      console.log('   - Client ID:', profile.client_id);
      console.log('   - Role:', profile.role);
    }
    
    // Verificar beneficiários
    console.log('\n🔍 Verificando beneficiários...');
    const { data: beneficiaries, error: beneficiariesError } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('client_id', clientId);
    
    if (beneficiariesError) {
      console.error('❌ Erro ao buscar beneficiários:', beneficiariesError);
    } else {
      console.log('✅ Beneficiários encontrados:', beneficiaries?.length || 0);
      beneficiaries?.forEach((beneficiary, index) => {
        console.log(`   ${index + 1}. ${beneficiary.beneficiary_name} (${beneficiary.transfer_method})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkAndCreateUserProfile();
