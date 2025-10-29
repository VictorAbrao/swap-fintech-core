const nodemailer = require('nodemailer');

async function quickEmailTest() {
  console.log('🧪 Teste rápido de email...\n');
  
  // Tentar configuração alternativa com timeout menor
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    auth: {
      user: 'comunicacao@swapone.global',
      pass: 'X(332670207541um'
    },
    connectionTimeout: 10000, // 10 segundos
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  try {
    console.log('🔍 Testando conexão rápida...');
    await transporter.verify();
    console.log('✅ Conexão OK! Enviando email...');
    
    const result = await transporter.sendMail({
      from: 'comunicacao@swapone.global',
      to: 'vi-abrao@hotmail.com',
      subject: 'Teste Rápido - SwapOne',
      html: '<h1>Teste de Email</h1><p>Email enviado com sucesso!</p>'
    });
    
    console.log('✅ Email enviado! Message ID:', result.messageId);
  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.log('💡 Credenciais podem estar incorretas ou conta com 2FA');
  }
}

quickEmailTest();



