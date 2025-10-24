#!/usr/bin/env node

require('dotenv').config();
const emailService = require('./src/services/emailService');

async function quickEmailTest() {
  console.log('🧪 Teste rápido de email...\n');
  
  console.log('📧 Configurações:');
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? 'Configurado' : 'Não configurado'}`);
  console.log(`   Modo Simulação: ${emailService.simulateMode ? 'SIM' : 'NÃO'}\n`);
  
  if (emailService.simulateMode) {
    console.log('🎭 Sistema em modo simulação - emails serão logados no console');
  } else {
    console.log('📧 Sistema configurado para envio real de emails');
  }
  
  console.log('\n📧 Testando criação de usuário com email...\n');
  
  try {
    const result = await emailService.sendUserCreationEmail('vi-abrao@hotmail.com', {
      userName: 'Vitor Abrão',
      email: 'vi-abrao@hotmail.com',
      password: 'senha123',
      role: 'client',
      clientName: 'Cliente Vitor',
      loginUrl: 'https://app.swapone.global:5001/login'
    });
    
    console.log('\n📊 Resultado:');
    console.log(`   Sucesso: ${result.success}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Simulado: ${result.simulated || false}`);
    
    if (result.success && !result.simulated) {
      console.log('\n✅ Email enviado com sucesso!');
      console.log('   Verifique a caixa de entrada de vi-abrao@hotmail.com');
    } else if (result.simulated) {
      console.log('\n🎭 Email simulado - verifique os logs acima');
    } else {
      console.log('\n❌ Falha no envio do email');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

// Timeout de 15 segundos para evitar travamento
const timeout = setTimeout(() => {
  console.log('\n⏰ Timeout - teste cancelado após 15 segundos');
  process.exit(1);
}, 15000);

quickEmailTest().finally(() => {
  clearTimeout(timeout);
});
