require('dotenv').config();
const axios = require('axios');

const API_BASE_URL = 'http://localhost:5002/api';

// Token de teste (substitua por um token válido)
const TEST_TOKEN = process.env.TEST_TOKEN || '';

async function testEndpoints() {
  console.log('🧪 Testing API Endpoints\n');
  console.log('📍 Base URL:', API_BASE_URL);

  try {
    // Test 1: Verificar se o endpoint /public/fx-rates existe
    console.log('\n📋 Test 1: GET /api/public/fx-rates');
    const fxRatesResponse = await axios.get(`${API_BASE_URL}/public/fx-rates`);
    console.log('✅ Status:', fxRatesResponse.status);
    console.log('📊 Response:', JSON.stringify(fxRatesResponse.data, null, 2));

    // Test 2: Testar endpoint de cotação (precisa de token)
    if (TEST_TOKEN) {
      console.log('\n📋 Test 2: POST /api/public/fx-rates/quote');
      try {
        const quoteResponse = await axios.post(
          `${API_BASE_URL}/public/fx-rates/quote`,
          {
            from_currency: 'USDT',
            to_currency: 'BRL',
            amount: 100,
            operation: 'buy'
          },
          {
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('✅ Status:', quoteResponse.status);
        console.log('📊 Quote Response:', JSON.stringify(quoteResponse.data, null, 2));
        
        // Verificar se os valores do Braza Bank estão ocultos
        const data = quoteResponse.data.data;
        console.log('\n🔍 Verificando se valores do Braza Bank estão ocultos:');
        console.log('   - braza_data:', data.braza_data ? '❌ Exibido (não deveria)' : '✅ Oculto');
        console.log('   - final_quotation:', data.final_quotation ? '✅ Exibido' : '❌ Não exibido');
        console.log('   - converted_amount:', data.converted_amount ? '✅ Exibido' : '❌ Não exibido');
      } catch (error) {
        console.log('❌ Error:', error.response?.status, error.response?.data?.message || error.message);
      }
    }

    // Test 3: Verificar se o endpoint retorna apenas dados necessários
    console.log('\n📋 Test 3: Verificando se retorna apenas dados necessários para cliente');
    console.log('✅ O endpoint deve retornar:');
    console.log('   - final_rate (taxa final com markup)');
    console.log('   - converted_amount (valor convertido final)');
    console.log('   - markup_percentage (markup aplicado)');
    console.log('   - fixed_rate_amount (taxa fixa aplicada)');
    console.log('\n❌ O endpoint NÃO deve retornar:');
    console.log('   - braza_data (dados internos do Braza Bank)');
    console.log('   - base_rate (taxa original do Braza Bank)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testEndpoints();








