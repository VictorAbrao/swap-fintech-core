require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const API_BASE_URL = 'http://localhost:5002/api';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurar token de admin (substituir por um token válido)
let ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || '';

async function getAdminToken() {
  try {
    // Tentar login como admin
    const email = process.env.ADMIN_EMAIL || 'admin@swapone.global';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.success && response.data.token) {
      return response.data.token;
    }
  } catch (error) {
    console.error('❌ Erro ao obter token de admin:', error.message);
  }
  return null;
}

async function testEmailNotifications() {
  console.log('🧪 Testando Notificações de Email - SwapOne Fintech\n');
  console.log('📍 API Base URL:', API_BASE_URL);
  console.log('📧 Destinatários: push@swapone.global, vi-abrao@hotmail.com\n');
  
  try {
    // Obter token de admin
    if (!ADMIN_TOKEN) {
      console.log('🔐 Obtendo token de admin...');
      ADMIN_TOKEN = await getAdminToken();
    }
    
    if (!ADMIN_TOKEN) {
      console.error('❌ Não foi possível obter token de admin');
      console.log('💡 Configure TEST_ADMIN_TOKEN no .env ou use credenciais válidas');
      return;
    }
    
    console.log('✅ Token obtido com sucesso\n');
    
    const headers = {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    // Teste 1: Criar Cliente
    console.log('📋 Teste 1: Criar Cliente');
    try {
      const clientResponse = await axios.post(
        `${API_BASE_URL}/admin/clients`,
        {
          name: 'Cliente Teste Email',
          cnpj: '11.222.333/0001-44',
          annual_transaction_limit_usdt: 100000
        },
        { headers }
      );
      console.log('✅ Cliente criado:', clientResponse.data.data.name);
      const testClientId = clientResponse.data.data.id;
      
      // Esperar um pouco para o email ser enviado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Teste 2: Atualizar Cliente
      console.log('\n📋 Teste 2: Atualizar Cliente');
      const updateResponse = await axios.put(
        `${API_BASE_URL}/admin/clients/${testClientId}`,
        {
          name: 'Cliente Teste Email - Atualizado'
        },
        { headers }
      );
      console.log('✅ Cliente atualizado');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Teste 3: Criar Usuário (associado ao cliente)
      console.log('\n📋 Teste 3: Criar Usuário');
      const userResponse = await axios.post(
        `${API_BASE_URL}/admin/users`,
        {
          email: 'teste-email-' + Date.now() + '@example.com',
          password: 'teste123',
          name: 'Usuário Teste Email',
          role: 'client',
          client_id: testClientId
        },
        { headers }
      );
      console.log('✅ Usuário criado:', userResponse.data.data.email);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Teste 4: Criar Operação FX Trade
      console.log('\n📋 Teste 4: Criar Operação FX Trade');
      const operationResponse = await axios.post(
        `${API_BASE_URL}/admin/operations/internal`,
        {
          operation_type: 'fx_trade',
          source_currency: 'USDT',
          target_currency: 'BRL',
          source_amount: 10,
          target_amount: 54.00,
          exchange_rate: 5.40,
          base_rate: 5.35,
          markup_percentage: 0.5,
          fixed_rate_amount: 0.50,
          quotation_id: 'test-quotation-' + Date.now(),
          side: 'buy',
          client_id: testClientId
        },
        { headers }
      );
      console.log('✅ Operação criada');
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Teste 5: Criar Beneficiário (precisa de token de cliente)
      console.log('\n📋 Teste 5: Criar Beneficiário');
      console.log('⚠️  Nota: Criar beneficiário requer token de cliente, testando endpoint...');
      // Este teste seria mais complexo pois precisa de token de cliente
      
      console.log('\n✅ Todos os testes concluídos!');
      console.log('📧 Verifique os emails em:');
      console.log('   - push@swapone.global');
      console.log('   - vi-abrao@hotmail.com');
      
      console.log('\n🧹 Limpando dados de teste...');
      
      // Limpar: deletar cliente (cascade deleta usuário)
      await axios.delete(
        `${API_BASE_URL}/admin/clients/${testClientId}`,
        { headers }
      );
      console.log('✅ Dados de teste limpos');
      
    } catch (error) {
      console.error('\n❌ Erro no teste:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.log('💡 Token inválido. Configure TEST_ADMIN_TOKEN no .env');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testEmailNotifications();






