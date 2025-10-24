require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createUserProfile() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';
    
    console.log('🔍 Criando perfil para o usuário:', userId);
    console.log('🔍 Client ID:', clientId);
    
    // Criar perfil
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        email: 'cliente01@hotmail.com',
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
    console.log('   - User Name:', newProfile.user_name);
    
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

createUserProfile();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function createUserProfile() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';
    
    console.log('🔍 Criando perfil para o usuário:', userId);
    console.log('🔍 Client ID:', clientId);
    
    // Criar perfil
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        email: 'cliente01@hotmail.com',
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
    console.log('   - User Name:', newProfile.user_name);
    
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

createUserProfile();
