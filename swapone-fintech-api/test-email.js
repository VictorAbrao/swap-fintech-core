#!/usr/bin/env node

require('dotenv').config();
const emailService = require('./src/services/emailService');

async function testEmailConfiguration() {
  console.log('🧪 Testando configuração de email...\n');
  
  console.log('📧 Configurações atuais:');
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? 'Configurado' : 'Não configurado'}`);
  console.log(`   FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  console.log(`   Modo Simulação: ${emailService.simulateMode ? 'SIM' : 'NÃO'}\n`);
  
  if (emailService.simulateMode) {
    console.log('⚠️  Sistema em modo de simulação!');
    console.log('   Para enviar emails reais, configure EMAIL_PASS no .env\n');
  }
  
  console.log('📧 Testando envio de email para vi-abrao@hotmail.com...\n');
  
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
      console.log('\n🎭 Email simulado - configure EMAIL_PASS para envio real');
    } else {
      console.log('\n❌ Falha no envio do email');
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

testEmailConfiguration();
