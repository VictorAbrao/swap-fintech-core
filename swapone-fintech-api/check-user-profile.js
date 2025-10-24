require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkUserProfile() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';
    
    console.log('🔍 Verificando perfil do usuário:', userId);
    console.log('🔍 Client ID esperado:', clientId);
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }
    
    if (!profile) {
      console.log('❌ Perfil não encontrado');
      return;
    }
    
    console.log('✅ Perfil encontrado:');
    console.log('   - ID:', profile.id);
    console.log('   - Email:', profile.email);
    console.log('   - Client ID:', profile.client_id);
    console.log('   - Role:', profile.role);
    console.log('   - User Name:', profile.user_name);
    
    // Verificar se o client_id está correto
    if (profile.client_id !== clientId) {
      console.log('⚠️ Client ID não confere!');
      console.log('   Esperado:', clientId);
      console.log('   Encontrado:', profile.client_id);
    } else {
      console.log('✅ Client ID confere!');
    }
    
    // Buscar beneficiários do cliente
    console.log('\n🔍 Verificando beneficiários do cliente...');
    const { data: beneficiaries, error: beneficiariesError } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('client_id', profile.client_id);
    
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

checkUserProfile();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkUserProfile() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';
    
    console.log('🔍 Verificando perfil do usuário:', userId);
    console.log('🔍 Client ID esperado:', clientId);
    
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return;
    }
    
    if (!profile) {
      console.log('❌ Perfil não encontrado');
      return;
    }
    
    console.log('✅ Perfil encontrado:');
    console.log('   - ID:', profile.id);
    console.log('   - Email:', profile.email);
    console.log('   - Client ID:', profile.client_id);
    console.log('   - Role:', profile.role);
    console.log('   - User Name:', profile.user_name);
    
    // Verificar se o client_id está correto
    if (profile.client_id !== clientId) {
      console.log('⚠️ Client ID não confere!');
      console.log('   Esperado:', clientId);
      console.log('   Encontrado:', profile.client_id);
    } else {
      console.log('✅ Client ID confere!');
    }
    
    // Buscar beneficiários do cliente
    console.log('\n🔍 Verificando beneficiários do cliente...');
    const { data: beneficiaries, error: beneficiariesError } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('client_id', profile.client_id);
    
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

checkUserProfile();
