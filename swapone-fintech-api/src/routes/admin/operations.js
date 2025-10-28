const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const operationsService = require('../../services/operationsService');
const walletsService = require('../../services/walletsService');
const clientLimitsService = require('../../services/clientLimitsService');
const emailService = require('../../services/emailService');

// Função para converter ID antigo em UUID válido
const convertToValidUUID = (id) => {
  // Se já é um UUID válido, retornar como está
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id;
  }
  
  // Se é um ID no formato antigo, converter para UUID
  if (id.startsWith('fx-trade-')) {
    // Gerar um UUID válido baseado no timestamp e conteúdo do ID antigo
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substr(2, 9);
    const hash = require('crypto').createHash('md5').update(id + timestamp + randomPart).digest('hex');
    
    // Formatar como UUID v4
    return `${hash.substr(0, 8)}-${hash.substr(8, 4)}-4${hash.substr(13, 3)}-${hash.substr(16, 4)}-${hash.substr(20, 12)}`;
  }
  
  // Para outros formatos, gerar UUID aleatório
  return require('crypto').randomUUID();
};

/**
 * @swagger
 * /api/admin/operations/internal:
 *   post:
 *     summary: Criar operação interna (FX Trade)
 *     tags: [Admin - Operations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operation_type
 *               - source_currency
 *               - target_currency
 *               - source_amount
 *               - target_amount
 *               - exchange_rate
 *             properties:
 *               operation_type:
 *                 type: string
 *                 example: "fx_trade"
 *               source_currency:
 *                 type: string
 *                 example: "USDT"
 *               target_currency:
 *                 type: string
 *                 example: "BRL"
 *               source_amount:
 *                 type: number
 *                 example: 1000
 *               target_amount:
 *                 type: number
 *                 example: 5200
 *               exchange_rate:
 *                 type: number
 *                 description: Taxa de câmbio COM markup
 *                 example: 5.412
 *               base_rate:
 *                 type: number
 *                 description: Taxa original do Braza Bank
 *                 example: 5.400
 *               markup_percentage:
 *                 type: number
 *                 description: Percentual de markup aplicado
 *                 example: 0.22
 *               fixed_rate_amount:
 *                 type: number
 *                 description: Taxa fixa aplicada (valor adicional em moeda de destino)
 *                 example: 10
 *               quotation_id:
 *                 type: string
 *                 example: "fx-trade-1234567890-abc123"
 *               side:
 *                 type: string
 *                 enum: [buy, sell]
 *                 example: "buy"
 *     responses:
 *       200:
 *         description: Operação interna criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/internal', authenticateToken, async (req, res) => {
  try {
    const {
      operation_type,
      source_currency,
      target_currency,
      source_amount,
      target_amount,
      exchange_rate,
      base_rate,
      markup_percentage,
      fixed_rate_amount,
      quotation_id,
      side,
      braza_order_id,
      client_id
    } = req.body;

    console.log('🔍 Debug operation payload received:', {
      operation_type,
      source_currency,
      target_currency,
      source_amount,
      target_amount,
      exchange_rate,
      base_rate,
      markup_percentage,
      fixed_rate_amount,
      braza_order_id,
      quotation_id,
      side,
      client_id_from_body: client_id
    });

    // Validação
    if (!operation_type || !source_currency || !target_currency || 
        source_amount === undefined || target_amount === undefined || 
        exchange_rate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'operation_type, source_currency, target_currency, source_amount, target_amount, and exchange_rate are required'
      });
    }

    if (source_amount <= 0 || target_amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amounts',
        message: 'source_amount and target_amount must be greater than 0'
      });
    }

    // Obter informações do usuário
    const userId = req.user.userId;
    // Se client_id foi enviado no body (admin operando em nome de cliente), usar ele
    // Caso contrário, usar o client_id do usuário logado
    const clientId = client_id || req.user.clientId;

    console.log('🔍 Debug client ID selection:', {
      client_id_from_body: client_id,
      client_id_from_user: req.user.clientId,
      final_client_id: clientId
    });

    if (!userId || !clientId) {
      return res.status(400).json({
        success: false,
        error: 'User information missing',
        message: 'User ID and Client ID are required'
      });
    }

    // Verificar limite anual do cliente
    console.log(`🔍 Checking annual limit for FX Trade operation`);
    console.log(`   source_amount: ${source_amount} ${source_currency}`);
    console.log(`   exchange_rate: ${exchange_rate}`);
    console.log(`   Expected BRL: ${parseFloat(source_amount) * parseFloat(exchange_rate)}`);
    
    const amountBrl = await clientLimitsService.convertToBrlForLimit(
      parseFloat(source_amount), 
      source_currency, 
      target_currency,
      parseFloat(exchange_rate) // Usar a taxa de câmbio real da operação
    );
    
    console.log(`   Calculated amountBrl: ${amountBrl} BRL`);
    
    const limitCheck = await clientLimitsService.checkAnnualLimit(clientId, amountBrl);
    
    if (!limitCheck.success) {
      return res.status(500).json({
        success: false,
        error: 'Limit check failed',
        message: limitCheck.message
      });
    }
    
    if (!limitCheck.canProceed) {
      return res.status(403).json({
        success: false,
        error: 'Annual limit exceeded',
        message: limitCheck.message,
        limitInfo: limitCheck.limitInfo
      });
    }

    console.log(`✅ Annual limit check passed: ${limitCheck.limitInfo.available} BRL available`);

    // Converter quotation_id para UUID válido se necessário
    const validQuotationId = convertToValidUUID(quotation_id || `fx-trade-${Date.now()}`);

    // Criar operação no histórico
    const operationData = {
      user_id: userId,
      client_id: clientId,
      quotation_id: validQuotationId,
      operation_type: operation_type,
      source_currency: source_currency,
      target_currency: target_currency,
      source_amount: parseFloat(source_amount),
      target_amount: parseFloat(target_amount),
      exchange_rate: parseFloat(exchange_rate), // Taxa COM markup
      base_rate: base_rate ? parseFloat(base_rate) : null, // Taxa ORIGINAL do Braza
      final_rate: parseFloat(exchange_rate), // Taxa final COM markup
      markup_percentage: parseFloat(markup_percentage) || 0, // Markup calculado
      fixed_rate_amount: parseFloat(fixed_rate_amount) || 0, // Taxa fixa aplicada
      fee_amount: 0,
      status: 'executed',
      reference_id: null,
      braza_order_id: braza_order_id || null, // UUID do Braza Bank para execução posterior
      notes: `FX Trade ${side} operation`
    };

    console.log('🔍 Debug operationData antes de salvar:', {
      fixed_rate_amount: operationData.fixed_rate_amount,
      fixed_rate_amount_type: typeof operationData.fixed_rate_amount,
      fixed_rate_amount_raw: fixed_rate_amount,
      fixed_rate_amount_raw_type: typeof fixed_rate_amount
    });


    const operationResult = await operationsService.createOperation(operationData);

    if (!operationResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create operation',
        message: operationResult.error
      });
    }

    // Enviar notificação para o board sobre nova transação
    try {
      const userInfo = {
        name: req.user.name || 'Administrador',
        email: req.user.email,
        role: req.user.role,
        clientName: 'Admin'
      };
      
      await emailService.sendTransactionNotification('created', {
        ...operationData,
        id: operationResult.data.id,
        created_at: new Date().toISOString()
      }, userInfo);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar notificação de transação:', emailError.message);
      // Não falha a operação por erro de email
    }

    // Atualizar saldos das carteiras
    try {
      if (side === 'buy') {
        // Compra: adicionar moeda origem (USDT), subtrair moeda destino (BRL)
        const addResult = await walletsService.updateWalletBalance(
          clientId,
          source_currency,
          source_amount,
          'add'
        );
        
        const subtractResult = await walletsService.updateWalletBalance(
          clientId,
          target_currency,
          target_amount,
          'subtract'
        );

        if (!addResult.success || !subtractResult.success) {
          console.error('⚠️ Wallet update failed:', { addResult, subtractResult });
        } else {
          console.log(`💰 FX Trade wallets updated: ${source_currency} +${source_amount}, ${target_currency} -${target_amount}`);
        }
      } else {
        // Venda: subtrair moeda origem (USDT), adicionar moeda destino (BRL)
        const subtractResult = await walletsService.updateWalletBalance(
          clientId,
          source_currency,
          source_amount,
          'subtract'
        );
        
        const addResult = await walletsService.updateWalletBalance(
          clientId,
          target_currency,
          target_amount,
          'add'
        );

        if (!subtractResult.success || !addResult.success) {
          console.error('⚠️ Wallet update failed:', { subtractResult, addResult });
        } else {
          console.log(`💰 FX Trade wallets updated: ${source_currency} -${source_amount}, ${target_currency} +${target_amount}`);
        }
      }

      // Atualizar uso anual do cliente
      console.log(`📈 Updating annual usage for client ${clientId}`);
      console.log(`   amountBrl to add: ${amountBrl} BRL`);
      const usageUpdate = await clientLimitsService.updateAnnualUsage(clientId, amountBrl);
      
      if (!usageUpdate.success) {
        console.error('⚠️ Failed to update annual usage:', usageUpdate.error);
        // Não falhar a operação se a atualização do uso falhar
      } else {
        console.log(`✅ Annual usage updated: ${usageUpdate.data.current_annual_usage_usdt} BRL`);
      }

    } catch (walletError) {
      console.error('⚠️ Wallet update failed:', walletError);
      // Não falhar a operação se a atualização da carteira falhar
    }

    // Executar automaticamente a ordem no Braza Bank se braza_order_id estiver presente
    let brazaExecuteResult = null;
    if (braza_order_id && operationResult.success) {
      try {
        console.log(`🚀 Auto-executing Braza order for operation ${operationResult.data.id}: ${braza_order_id}`);
        
        const brazaBankService = require('../../services/brazaBankService');
        brazaExecuteResult = await brazaBankService.executeOrder(
          braza_order_id,
          userId,
          clientId,
          `auto-execute-${Date.now()}`
        );

        if (brazaExecuteResult.success) {
          console.log(`✅ Braza order auto-executed successfully: ${braza_order_id}`);
          
          // Buscar detalhes da ordem executada para obter o ID numérico
          try {
            console.log(`🔍 Getting order details for ${braza_order_id}`);
            const orderDetailsResult = await brazaBankService.getOrderById(
              braza_order_id,
              userId,
              clientId,
              `get-order-${Date.now()}`
            );

            if (orderDetailsResult.success && orderDetailsResult.data?.id) {
              const brazaOrderIdNumber = orderDetailsResult.data.id;
              console.log(`📊 Braza order ID number: ${brazaOrderIdNumber}`);
              
              // Atualizar operação com o ID numérico do Braza Bank
              await operationsService.updateOperationIdBrazaOrder(
                operationResult.data.id,
                brazaOrderIdNumber
              );

              // Executar brokerage após obter o ID numérico
              try {
                console.log(`🏦 Executing brokerage for order ${brazaOrderIdNumber}`);
                
                const finalQuotation = base_rate;
                
                console.log(`📊 Using base_rate (from Braza Bank) for brokerage: ${finalQuotation}`);
                
                if (!finalQuotation || finalQuotation === null) {
                  throw new Error('No valid rate found for brokerage');
                }
                
                const brokerageResult = await brazaBankService.executeBrokerage(
                  brazaOrderIdNumber,
                  finalQuotation,
                  userId,
                  clientId,
                  `brokerage-${Date.now()}`,
                  source_currency
                );

                if (brokerageResult.success) {
                  console.log(`✅ Brokerage executed successfully for order: ${brazaOrderIdNumber}`);
                } else {
                  console.warn(`⚠️ Brokerage failed for order ${brazaOrderIdNumber}: ${brokerageResult.error}`);
                }
              } catch (brokerageError) {
                console.error('❌ Error executing brokerage:', brokerageError);
              }
            } else {
              console.warn(`⚠️ Failed to get order details: ${orderDetailsResult.error}`);
            }
          } catch (orderDetailsError) {
            console.error('❌ Error getting order details:', orderDetailsError);
          }
          
          await operationsService.updateOperationStatus(operationResult.data.id, 'executed', {
            braza_executed_at: new Date().toISOString(),
            braza_execution_result: brazaExecuteResult.data
          });
        } else {
          console.warn(`⚠️ Braza order auto-execution failed: ${brazaExecuteResult.error}`);
        }
      } catch (executeError) {
        console.error('❌ Auto-execute Braza order error:', executeError);
      }
    }

    res.json({
      success: true,
      data: operationResult.data,
      message: 'FX Trade operation executed successfully',
      braza_execution: brazaExecuteResult ? {
        executed: brazaExecuteResult.success,
        result: brazaExecuteResult.data || brazaExecuteResult.error
      } : null
    });

  } catch (error) {
    console.error('Create internal operation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
