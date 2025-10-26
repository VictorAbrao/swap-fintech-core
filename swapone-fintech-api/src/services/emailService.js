const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configuração do Outlook SMTP com timeout
    this.transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'victor.abrao@swapcambio.com',
        pass: process.env.EMAIL_PASS || 'Vhl@0512'
      },
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 5000,    // 5 segundos
      socketTimeout: 10000      // 10 segundos
    });
    
    // Flag para simular envio quando credenciais não estão configuradas
    this.simulateMode = !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your-app-password-here';
    
    // Verificar conectividade na inicialização
    this.verifyConnection();
  }
  
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Conexão SMTP verificada com sucesso');
      this.simulateMode = false;
    } catch (error) {
      console.warn('⚠️ Falha na verificação SMTP, ativando modo simulação:', error.message);
      this.simulateMode = true;
    }
  }
  
  /**
   * Salvar dados do email em arquivo para processamento posterior
   */
  saveEmailToFile(to, emailData) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const emailLog = {
        timestamp: new Date().toISOString(),
        to: to,
        type: 'user_creation',
        data: emailData
      };
      
      const logFile = path.join(__dirname, '../../logs/pending-emails.json');
      const logDir = path.dirname(logFile);
      
      // Criar diretório se não existir
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      // Ler emails pendentes existentes
      let pendingEmails = [];
      if (fs.existsSync(logFile)) {
        try {
          pendingEmails = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        } catch (e) {
          pendingEmails = [];
        }
      }
      
      // Adicionar novo email
      pendingEmails.push(emailLog);
      
      // Salvar arquivo
      fs.writeFileSync(logFile, JSON.stringify(pendingEmails, null, 2));
      
      console.log(`📁 Email salvo em: ${logFile}`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar email:', error.message);
    }
  }

  /**
   * Enviar email de notificação de conversão
   * @param {string} to - Email destinatário
   * @param {Object} conversionData - Dados da conversão
   */
  async sendConversionNotification(to, conversionData) {
    try {
      const {
        clientName,
        fromCurrency,
        toCurrency,
        fromAmount,
        toAmount,
        exchangeRate,
        markupPercentage,
        spreadPercentage,
        timestamp
      } = conversionData;

      const subject = `Nova Conversão Executada - ${clientName}`;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nova Conversão Executada</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
            .conversion-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; }
            .detail-value { color: #007bff; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔄 Nova Conversão Executada</h1>
              <p>SwapOne Fintech</p>
            </div>
            
            <div class="content">
              <h2>Detalhes da Conversão</h2>
              
              <div class="conversion-details">
                <div class="detail-row">
                  <span class="detail-label">Cliente:</span>
                  <span class="detail-value">${clientName}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Conversão:</span>
                  <span class="detail-value">${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Taxa de Câmbio:</span>
                  <span class="detail-value">${exchangeRate}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Markup Aplicado:</span>
                  <span class="detail-value">${markupPercentage}%</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Spread Aplicado:</span>
                  <span class="detail-value">${spreadPercentage}%</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Data/Hora:</span>
                  <span class="detail-value">${timestamp}</span>
                </div>
              </div>
              
              <p><strong>Status:</strong> Conversão executada com sucesso</p>
            </div>
            
            <div class="footer">
              <p>Este é um email automático do sistema SwapOne Fintech.</p>
              <p>Para dúvidas, entre em contato com a equipe de suporte.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER || 'swapone.fintech@gmail.com',
        to: to,
        subject: subject,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email enviado com sucesso:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar email de criação de usuário
   * @param {string} to - Email destinatário
   * @param {Object} userData - Dados do usuário criado
   */
  async sendUserCreationEmail(to, userData) {
    try {
      const {
        userName,
        email,
        password,
        role,
        clientName,
        loginUrl = 'https://app.swapone.global:5001/login'
      } = userData;

      const subject = `Bem-vindo ao SwapOne Fintech - ${userName}`;
      
      // Se estiver em modo de simulação, apenas logar o email
      if (this.simulateMode) {
        console.log('📧 [SIMULAÇÃO] Email de criação de usuário:');
        console.log(`   Para: ${to}`);
        console.log(`   Assunto: ${subject}`);
        console.log(`   Nome: ${userName}`);
        console.log(`   Senha: ${password}`);
        console.log(`   Role: ${role}`);
        console.log(`   Cliente: ${clientName || 'N/A'}`);
        console.log(`   Link: ${loginUrl}`);
        console.log('   ⚠️  SMTP desabilitado - email simulado');
        
        // Salvar dados do email em arquivo para processamento posterior
        this.saveEmailToFile(to, {
          subject,
          userName,
          email: to,
          password,
          role,
          clientName,
          loginUrl
        });
        
        return {
          success: true,
          messageId: 'simulated-' + Date.now(),
          simulated: true
        };
      }
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Bem-vindo ao SwapOne Fintech</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px; }
            .user-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; }
            .detail-value { color: #007bff; }
            .login-button { 
              display: inline-block; 
              background: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 5px; 
              margin: 15px 0;
              font-weight: bold;
            }
            .credentials { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 15px; 
              border-radius: 5px; 
              margin: 15px 0;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bem-vindo ao SwapOne Fintech!</h1>
              <p>Sua conta foi criada com sucesso</p>
            </div>
            
            <div class="content">
              <h2>Olá, ${userName}!</h2>
              
              <p>Sua conta foi criada com sucesso no sistema SwapOne Fintech. Abaixo estão suas credenciais de acesso:</p>
              
              <div class="credentials">
                <h3>🔐 Suas Credenciais de Acesso</h3>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${email}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Senha:</span>
                  <span class="detail-value">${password}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Tipo de Usuário:</span>
                  <span class="detail-value">${role === 'client' ? 'Cliente' : role === 'ops' ? 'Operador' : 'Administrador'}</span>
                </div>
                ${clientName ? `
                <div class="detail-row">
                  <span class="detail-label">Cliente:</span>
                  <span class="detail-value">${clientName}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="user-details">
                <h3>🚀 Próximos Passos</h3>
                <ol>
                  <li>Clique no botão abaixo para acessar o sistema</li>
                  <li>Faça login com suas credenciais</li>
                  <li>Altere sua senha na primeira sessão (recomendado)</li>
                  <li>Explore as funcionalidades disponíveis</li>
                </ol>
                
                <div style="text-align: center;">
                  <a href="${loginUrl}" class="login-button">🔗 Acessar Sistema</a>
                </div>
              </div>
              
              <div class="credentials">
                <p class="warning">⚠️ Importante:</p>
                <ul>
                  <li>Mantenha suas credenciais em local seguro</li>
                  <li>Recomendamos alterar a senha no primeiro acesso</li>
                  <li>Em caso de dúvidas, entre em contato com o suporte</li>
                </ul>
              </div>
            </div>
            
            <div class="footer">
              <p>Este é um email automático do sistema SwapOne Fintech.</p>
              <p>Para dúvidas, entre em contato com a equipe de suporte.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER || 'swapone.fintech@gmail.com',
        to: to,
        subject: subject,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email de criação de usuário enviado com sucesso:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email de criação de usuário:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar email de teste
   */
  async sendTestEmail(to) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'swapone.fintech@gmail.com',
        to: to,
        subject: 'Teste - SwapOne Fintech',
        html: '<h1>Teste de Email</h1><p>Este é um email de teste do sistema SwapOne Fintech.</p>'
      };

      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('❌ Erro ao enviar email de teste:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar notificação para o board sobre operações de transações
   */
  async sendTransactionNotification(action, transactionData, userInfo) {
    try {
      const actionTexts = {
        'created': 'Nova Transação Criada',
        'updated': 'Transação Atualizada',
        'deleted': 'Transação Deletada'
      };

      // Lista de destinatários (board + admin)
      const recipients = [
        process.env.BOARD_EMAIL || 'push@swapone.global',
        'vi-abrao@hotmail.com'
      ].filter(Boolean).join(', ');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'comunicacao@swapone.global',
        to: recipients,
        subject: `[SwapOne] ${actionTexts[action]} - ${transactionData.operation_type?.toUpperCase() || 'FX Trade'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">📊 ${actionTexts[action]}</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Detalhes da Transação</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.id}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Tipo:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.operation_type || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Moeda Origem:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.source_currency || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Moeda Destino:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.target_currency || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Valor Origem:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.source_amount || 'N/A'} ${transactionData.source_currency || ''}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Valor Destino:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.target_amount || 'N/A'} ${transactionData.target_currency || ''}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Taxa de Câmbio:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.exchange_rate || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Markup:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.markup_percentage || 0}%</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Taxa Fixa:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.fixed_rate_amount || 0}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${transactionData.status || 'N/A'}</td></tr>
                <tr><td style="padding: 8px;"><strong>Data:</strong></td><td style="padding: 8px;">${new Date(transactionData.created_at || transactionData.updated_at).toLocaleString('pt-BR')}</td></tr>
              </table>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Usuário Responsável</h3>
              <p><strong>Nome:</strong> ${userInfo.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${userInfo.email || 'N/A'}</p>
              <p><strong>Role:</strong> ${userInfo.role || 'N/A'}</p>
              <p><strong>Cliente:</strong> ${userInfo.clientName || 'N/A'}</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Ação:</strong> ${actionTexts[action]}</p>
              <p style="margin: 5px 0 0 0; color: #92400e;"><strong>⏰ Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Notificação de transação ${action} enviada para: ${recipients}`);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar notificação de transação ${action}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar notificação para o board sobre operações de clientes
   */
  async sendClientNotification(action, clientData, userInfo) {
    try {
      const actionTexts = {
        'created': 'Novo Cliente Criado',
        'updated': 'Cliente Atualizado',
        'deleted': 'Cliente Deletado'
      };

      // Lista de destinatários (board + admin)
      const recipients = [
        process.env.BOARD_EMAIL || 'push@swapone.global',
        'vi-abrao@hotmail.com'
      ].filter(Boolean).join(', ');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'comunicacao@swapone.global',
        to: recipients,
        subject: `[SwapOne] ${actionTexts[action]} - ${clientData.name || clientData.company_name || 'Cliente'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🏢 ${actionTexts[action]}</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Detalhes do Cliente</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientData.id}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nome:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientData.name || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Empresa:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientData.company_name || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>CNPJ:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientData.cnpj || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientData.email || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Telefone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientData.phone || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${clientData.status || 'N/A'}</td></tr>
                <tr><td style="padding: 8px;"><strong>Data:</strong></td><td style="padding: 8px;">${new Date(clientData.created_at || clientData.updated_at).toLocaleString('pt-BR')}</td></tr>
              </table>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Usuário Responsável</h3>
              <p><strong>Nome:</strong> ${userInfo.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${userInfo.email || 'N/A'}</p>
              <p><strong>Role:</strong> ${userInfo.role || 'N/A'}</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Ação:</strong> ${actionTexts[action]}</p>
              <p style="margin: 5px 0 0 0; color: #92400e;"><strong>⏰ Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Notificação de cliente ${action} enviada para: ${recipients}`);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar notificação de cliente ${action}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar notificação para o board sobre operações de usuários
   */
  async sendUserNotification(action, userData, clientData, adminUserInfo) {
    try {
      const actionTexts = {
        'created': 'Novo Usuário Criado',
        'updated': 'Usuário Atualizado',
        'deleted': 'Usuário Deletado'
      };

      // Lista de destinatários (board + admin)
      const recipients = [
        process.env.BOARD_EMAIL || 'push@swapone.global',
        'vi-abrao@hotmail.com'
      ].filter(Boolean).join(', ');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'comunicacao@swapone.global',
        to: recipients,
        subject: `[SwapOne] ${actionTexts[action]} - ${userData.email}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">👤 ${actionTexts[action]}</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Detalhes do Usuário</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userData.id}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nome:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userData.name || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userData.email || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Role:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userData.role || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>2FA:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userData.twofa_enabled ? 'Ativado' : 'Desativado'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userData.status || 'Ativo'}</td></tr>
                <tr><td style="padding: 8px;"><strong>Data:</strong></td><td style="padding: 8px;">${new Date(userData.created_at || userData.updated_at).toLocaleString('pt-BR')}</td></tr>
              </table>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Cliente Associado</h3>
              <p><strong>Nome:</strong> ${clientData?.name || clientData?.company_name || 'N/A'}</p>
              <p><strong>ID:</strong> ${clientData?.id || 'N/A'}</p>
              <p><strong>CNPJ:</strong> ${clientData?.cnpj || 'N/A'}</p>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Administrador Responsável</h3>
              <p><strong>Nome:</strong> ${adminUserInfo.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${adminUserInfo.email || 'N/A'}</p>
              <p><strong>Role:</strong> ${adminUserInfo.role || 'N/A'}</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Ação:</strong> ${actionTexts[action]}</p>
              <p style="margin: 5px 0 0 0; color: #92400e;"><strong>⏰ Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Notificação de usuário ${action} enviada para: ${recipients}`);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar notificação de usuário ${action}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Enviar notificação para o board sobre operações de beneficiários
   */
  async sendBeneficiaryNotification(action, beneficiaryData, userInfo) {
    try {
      const actionTexts = {
        'created': 'Novo Beneficiário Criado',
        'updated': 'Beneficiário Atualizado',
        'deleted': 'Beneficiário Deletado'
      };

      // Lista de destinatários (board + admin)
      const recipients = [
        process.env.BOARD_EMAIL || 'push@swapone.global',
        'vi-abrao@hotmail.com'
      ].filter(Boolean).join(', ');

      const mailOptions = {
        from: process.env.EMAIL_USER || 'comunicacao@swapone.global',
        to: recipients,
        subject: `[SwapOne] ${actionTexts[action]} - ${beneficiaryData.beneficiary_name || 'Beneficiário'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">👥 ${actionTexts[action]}</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Detalhes do Beneficiário</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${beneficiaryData.id}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nome:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${beneficiaryData.beneficiary_name || 'N/A'}</td></tr>
                <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Método:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${beneficiaryData.transfer_method || 'N/A'}</td></tr>
                ${beneficiaryData.beneficiary_iban ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>IBAN:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${beneficiaryData.beneficiary_iban}</td></tr>` : ''}
                ${beneficiaryData.beneficiary_account_number ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Conta:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${beneficiaryData.beneficiary_account_number}</td></tr>` : ''}
                ${beneficiaryData.beneficiary_bank_name ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Banco:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${beneficiaryData.beneficiary_bank_name}</td></tr>` : ''}
                <tr><td style="padding: 8px;"><strong>Data:</strong></td><td style="padding: 8px;">${new Date(beneficiaryData.created_at || beneficiaryData.updated_at).toLocaleString('pt-BR')}</td></tr>
              </table>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">Usuário Responsável</h3>
              <p><strong>Nome:</strong> ${userInfo.name || 'N/A'}</p>
              <p><strong>Email:</strong> ${userInfo.email || 'N/A'}</p>
              <p><strong>Role:</strong> ${userInfo.role || 'N/A'}</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;"><strong>⚠️ Ação:</strong> ${actionTexts[action]}</p>
              <p style="margin: 5px 0 0 0; color: #92400e;"><strong>⏰ Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Notificação de beneficiário ${action} enviada para: ${recipients}`);
      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error(`❌ Erro ao enviar notificação de beneficiário ${action}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();
