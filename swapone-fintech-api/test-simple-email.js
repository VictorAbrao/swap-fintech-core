require('dotenv').config();

async function testSimpleEmail() {
  console.log('🧪 Teste Simples de Email Service\n');
  
  const emailService = require('./src/services/emailService');
  
  // Teste 1: Verificar configuração
  console.log('📧 Configuração de Email:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || 'não configurado');
  console.log('   BOARD_EMAIL:', process.env.BOARD_EMAIL || 'não configurado');
  console.log('   Simulação:', emailService.simulateMode ? 'SIM' : 'NÃO');
  
  // Teste 2: Criar notificação de teste
  console.log('\n📋 Teste de Notificação de Transação (Criar)');
  const transactionData = {
    id: 'test-123-456',
    operation_type: 'fx_trade',
    source_currency: 'USDT',
    target_currency: 'BRL',
    source_amount: 10,
    target_amount: 54.00,
    exchange_rate: 5.40,
    base_rate: 5.35,
    markup_percentage: 0.5,
    fixed_rate_amount: 0.50,
    status: 'completed',
    created_at: new Date().toISOString()
  };
  
  const userInfo = {
    name: 'Teste User',
    email: 'test@example.com',
    role: 'client',
    clientName: 'Cliente Teste'
  };
  
  // Enviar notificação
  const result = await emailService.sendTransactionNotification('created', transactionData, userInfo);
  
  if (result.success) {
    console.log('✅ Notificação enviada com sucesso!');
    console.log('   Message ID:', result.messageId);
    console.log('\n📧 Email enviado para:');
    console.log('   - push@swapone.global');
    console.log('   - vi-abrao@hotmail.com');
  } else {
    console.log('❌ Erro ao enviar notificação:', result.error);
  }
  
  console.log('\n📋 Teste de Notificação de Cliente (Criar)');
  const clientData = {
    id: 'client-test-123',
    name: 'Cliente Teste Email',
    company_name: 'Cliente Teste Email Ltda',
    cnpj: '11.222.333/0001-44',
    email: 'cliente@example.com',
    phone: '+5511999999999',
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  const result2 = await emailService.sendClientNotification('created', clientData, userInfo);
  
  if (result2.success) {
    console.log('✅ Notificação de cliente enviada!');
    console.log('   Message ID:', result2.messageId);
  } else {
    console.log('❌ Erro:', result2.error);
  }
  
  console.log('\n📋 Teste de Notificação de Usuário (Criar)');
  const userData = {
    id: 'user-test-456',
    name: 'Usuário Teste',
    email: 'usuario.teste@example.com',
    role: 'client',
    twofa_enabled: false,
    status: 'active',
    created_at: new Date().toISOString()
  };
  
  const clientInfo = {
    id: 'client-123',
    name: 'Cliente Associado',
    company_name: 'Cliente Teste Ltda',
    cnpj: '12.345.678/0001-90'
  };
  
  const adminInfo = {
    name: 'Admin Teste',
    email: 'admin@swapone.global',
    role: 'admin'
  };
  
  const result3 = await emailService.sendUserNotification('created', userData, clientInfo, adminInfo);
  
  if (result3.success) {
    console.log('✅ Notificação de usuário enviada!');
    console.log('   Message ID:', result3.messageId);
  } else {
    console.log('❌ Erro:', result3.error);
  }
  
  console.log('\n📋 Teste de Notificação de Beneficiário (Criar)');
  const beneficiaryData = {
    id: 'beneficiary-test-789',
    beneficiary_name: 'Beneficiário Teste',
    transfer_method: 'SEPA',
    beneficiary_iban: 'DE89 3704 0044 0532 0130 00',
    beneficiary_bank_name: 'Deutsche Bank',
    created_at: new Date().toISOString()
  };
  
  const result4 = await emailService.sendBeneficiaryNotification('created', beneficiaryData, userInfo);
  
  if (result4.success) {
    console.log('✅ Notificação de beneficiário enviada!');
    console.log('   Message ID:', result4.messageId);
  } else {
    console.log('❌ Erro:', result4.error);
  }
  
  console.log('\n✅ Todos os testes concluídos!');
}

testSimpleEmail();

















