require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedRateInsert() {
  try {
    console.log('🧪 Testando inserção com fixed_rate_amount...');
    
    // Gerar UUID válido para quotation_id
    const crypto = require('crypto');
    const testQuotationId = crypto.randomUUID();
    
    // Dados de teste similares ao que está sendo enviado
    const testData = {
      user_id: '23deeb94-f12d-4f0c-a83c-b03bd18fc2b4',
      client_id: 'bdf195ee-95a7-478f-a154-4ff0a3d88924',
      quotation_id: testQuotationId,
      operation_type: 'fx_trade',
      source_currency: 'USDT',
      target_currency: 'BRL',
      source_amount: 1,
      target_amount: 59.246,
      exchange_rate: 5.386,
      base_rate: 5.386,
      final_rate: 5.386,
      markup_percentage: 0,
      fixed_rate_amount: 10, // ← VALOR DE TESTE
      fee_amount: 0,
      status: 'executed',
      notes: 'Test fixed_rate_amount',
      braza_order_id: testQuotationId
    };
    
    console.log('📊 Dados de teste:', testData);
    
    const { data, error } = await supabase
      .from('operations_history')
      .insert([testData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Erro ao inserir:', error);
      return false;
    }
    
    console.log('✅ Inserção bem-sucedida!');
    console.log('📊 Dados salvos:', data);
    console.log('🔍 fixed_rate_amount salvo:', data.fixed_rate_amount);
    
    // Verificar se o valor foi salvo corretamente
    if (data.fixed_rate_amount === 10) {
      console.log('🎉 fixed_rate_amount foi salvo corretamente!');
    } else {
      console.log('❌ fixed_rate_amount NÃO foi salvo corretamente!');
      console.log('   Esperado: 10');
      console.log('   Recebido:', data.fixed_rate_amount);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

testFixedRateInsert().then(success => {
  if (success) {
    console.log('🎉 Teste concluído!');
    process.exit(0);
  } else {
    console.log('💥 Teste falhou!');
    process.exit(1);
  }
});
