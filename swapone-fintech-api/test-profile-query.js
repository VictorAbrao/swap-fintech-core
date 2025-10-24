require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testProfileQuery() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    
    console.log('🔍 Testando consulta de perfil...');
    console.log('User ID:', userId);
    
    // Testar consulta simples
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    console.log('📊 Resultado da consulta:');
    console.log('Data:', profiles);
    console.log('Error:', error);
    console.log('Count:', profiles?.length || 0);
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Perfil encontrado:', profiles[0]);
    } else {
      console.log('❌ Nenhum perfil encontrado');
    }
    
    // Testar consulta com single()
    console.log('\n🔍 Testando consulta com .single()...');
    const { data: profile, error: singleError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    console.log('📊 Resultado da consulta single:');
    console.log('Data:', profile);
    console.log('Error:', singleError);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testProfileQuery();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testProfileQuery() {
  try {
    const userId = '43d57990-68d1-4194-b074-5b894a2b9f82';
    
    console.log('🔍 Testando consulta de perfil...');
    console.log('User ID:', userId);
    
    // Testar consulta simples
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    console.log('📊 Resultado da consulta:');
    console.log('Data:', profiles);
    console.log('Error:', error);
    console.log('Count:', profiles?.length || 0);
    
    if (profiles && profiles.length > 0) {
      console.log('✅ Perfil encontrado:', profiles[0]);
    } else {
      console.log('❌ Nenhum perfil encontrado');
    }
    
    // Testar consulta com single()
    console.log('\n🔍 Testando consulta com .single()...');
    const { data: profile, error: singleError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    console.log('📊 Resultado da consulta single:');
    console.log('Data:', profile);
    console.log('Error:', singleError);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testProfileQuery();
