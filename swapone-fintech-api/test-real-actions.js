require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const API_BASE_URL = 'http://127.0.0.1:5002/api';

async function testRealActions() {
  console.log('🧪 Testando Ações Reais no Sistema\n');
  
  try {
    // Obter token de admin
    console.log('🔐 Obtendo token de admin...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@swapone.global',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success || !loginResponse.data.token) {
      console.error('❌ Falha no login. Verificando configuração...');
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtido com sucesso\n');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 1. CRIAR CLIENTE
    console.log('📋 TESTE 1: Criar Cliente');
    const createClientResponse = await axios.post(
      `${API_BASE_URL}/admin/clients`,
      {
        name: 'Cliente Teste Email - ' + Date.now(),
        cnpj: '12.345.678/0001-' + Math.floor(Math.random() * 100).toString().padStart(2, '0'),
        annual_transaction_limit_usdt: 50000
      },
      { headers }
    );
    
    const testClientId = createClientResponse.data.data.id;
    console.log('✅ Cliente criado:', createClientResponse.data.data.name);
    console.log('📧 Email enviado para: push@swapone.global, vi-abrao@hotmail.com\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. EDITAR CLIENTE
    console.log('📋 TESTE 2: Editar Cliente');
    await axios.put(
      `${API_BASE_URL}/admin/clients/${testClientId}`,
      {
        name: createClientResponse.data.data.name + ' - EDITADO'
      },
      { headers }
    );
    console.log('✅ Cliente editado');
    console.log('📧 Email enviado para: push@swapone.global, vi-abrao@hotmail.com\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. CRIAR USUÁRIO
    console.log('📋 TESTE 3: Criar Usuário');
    const userEmail = 'teste-user-' + Date.now() + '@example.com';
    const createUserResponse = await axios.post(
      `${API_BASE_URL}/admin/users`,
      {
        email: userEmail,
        password: 'teste123',
        name: 'Usuário Teste Email',
        role: 'client',
        client_id: testClientId
      },
      { headers }
    );
    console.log('✅ Usuário criado:', userEmail);
    console.log('📧 Email enviado para: push@swapone.global, vi-abrao@hotmail.com\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. CRIAR OPERAÇÃO
    console.log('📋 TESTE 4: Criar Operação FX Trade');
    await axios.post(
      `${API_BASE_URL}/admin/operations/internal`,
      {
        operation_type: 'fx_trade',
        source_currency: 'USDT',
        target_currency: 'BRL',
        source_amount: 50,  // Valor baixo para teste
        target_amount: 270.00,
        exchange_rate: 5.40,
        base_rate: 5.35,
        markup_percentage: 0.5,
        fixed_rate_amount: 0.25,
        quotation_id: 'test-quotation-' + Date.now(),
        side: 'buy',
        client_id: testClientId
      },
      { headers }
    );
    console.log('✅ Operação criada (50 USDT → 270 BRL)');
    console.log('📧 Email enviado para: push@swapone.global, vi-abrao@hotmail.com\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 5. DELETAR USUÁRIO
    console.log('📋 TESTE 5: Deletar Usuário');
    await axios.delete(
      `${API_BASE_URL}/admin/clients/${testClientId}/users/${createUserResponse.data.data.id}`,
      { headers }
    );
    console.log('✅ Usuário deletado');
    console.log('📧 Email enviado para: push@swapone.global, vi-abrao@hotmail.com\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. DELETAR CLIENTE (cascade deleta tudo)
    console.log('📋 TESTE 6: Deletar Cliente');
    await axios.delete(
      `${API_BASE_URL}/admin/clients/${testClientId}`,
      { headers }
    );
    console.log('✅ Cliente deletado (cascade deleta usuários, operações, etc)');
    console.log('📧 Email enviado para: push@swapone.global, vi-abrao@hotmail.com\n');
    
    console.log('═══════════════════════════════════════════');
    console.log('✅ TODOS OS TESTES CONCLUÍDOS!');
    console.log('═══════════════════════════════════════════');
    console.log('\n📧 Verifique os emails em:');
    console.log('   • push@swapone.global');
    console.log('   • vi-abrao@hotmail.com');
    console.log('\n📋 Emails enviados:');
    console.log('   1. Cliente criado');
    console.log('   2. Cliente editado');
    console.log('   3. Usuário criado');
    console.log('   4. Operação criada');
    console.log('   5. Usuário deletado');
    console.log('   6. Cliente deletado');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('💡 Token inválido. Use credenciais corretas.');
    }
  }
}

testRealActions();

