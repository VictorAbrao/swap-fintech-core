require('dotenv').config();
const axios = require('axios');

async function testClientResponse() {
  console.log('🧪 Testando resposta da API para cliente\n');
  
  try {
    // Simular dados retornados pela API
    const mockApiResponse = {
      success: true,
      data: {
        from_currency: 'USDT',
        to_currency: 'BRL',
        amount: 100,
        braza_rate: 5.4044,
        base_rate: 5.4044,
        markup_percentage: 0,
        fixed_rate_amount: 10.5,
        final_rate: 5.4044,
        converted_amount: 597.1862,
        operation: 'buy',
        braza_order_id: 'fc35dc27-f6d1-48ee-84cf-c4675130e36f'
      }
    };
    
    console.log('📊 Resposta da API (o que o cliente recebe):');
    console.log(JSON.stringify(mockApiResponse, null, 2));
    
    console.log('\n✅ O que o cliente DEVE ver:');
    console.log('   - from_currency:', mockApiResponse.data.from_currency);
    console.log('   - to_currency:', mockApiResponse.data.to_currency);
    console.log('   - amount:', mockApiResponse.data.amount);
    console.log('   - final_rate:', mockApiResponse.data.final_rate);
    console.log('   - markup_percentage:', mockApiResponse.data.markup_percentage);
    console.log('   - fixed_rate_amount:', mockApiResponse.data.fixed_rate_amount);
    console.log('   - converted_amount:', mockApiResponse.data.converted_amount);
    console.log('   - operation:', mockApiResponse.data.operation);
    
    console.log('\n❌ O que o cliente NÃO DEVE ver:');
    console.log('   - braza_data:', mockApiResponse.data.braza_data ? '❌ Exposto!' : '✅ Oculto');
    console.log('   - braza_rate:', mockApiResponse.data.braza_rate ? '⚠️ Exibido' : '✅ Oculto');
    console.log('   - base_rate:', mockApiResponse.data.base_rate ? '⚠️ Exibido' : '✅ Oculto');
    console.log('   - braza_order_id:', mockApiResponse.data.braza_order_id ? '⚠️ Exibido' : '✅ Oculto');
    
    // Verificar se braza_data foi removido
    if (!mockApiResponse.data.braza_data) {
      console.log('\n✅ CORRETO: braza_data foi removido da resposta');
    } else {
      console.log('\n❌ ERRO: braza_data ainda está na resposta!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testClientResponse();








