const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');
const operationsService = require('../services/operationsService');
const walletsService = require('../services/walletsService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * @swagger
 * /api/transfers:
 *   post:
 *     summary: Criar nova transferência
 *     tags: [Transfers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - beneficiary_id
 *               - amount
 *               - currency
 *               - payment_reference
 *             properties:
 *               beneficiary_id:
 *                 type: string
 *                 description: ID do beneficiário
 *               amount:
 *                 type: number
 *                 description: Valor da transferência
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, GBP, USDT, USDC, BRL]
 *                 description: Moeda da transferência (USD, EUR, GBP, USDT, USDC, BRL)
 *               payment_reference:
 *                 type: string
 *                 description: Referência do pagamento
 *               notes:
 *                 type: string
 *                 description: Observações (opcional)
 *               attachment_url_1:
 *                 type: string
 *                 description: URL do primeiro anexo (opcional)
 *               attachment_url_2:
 *                 type: string
 *                 description: URL do segundo anexo (opcional)
 *     responses:
 *       201:
 *         description: Transferência criada com sucesso
 *       400:
 *         description: Dados inválidos ou saldo insuficiente
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      beneficiary_id,
      amount,
      currency,
      payment_reference,
      notes,
      attachment_url_1,
      attachment_url_2
    } = req.body;
    
    // Validação básica
    if (!beneficiary_id || !amount || !currency || !payment_reference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Valor deve ser maior que zero'
      });
    }
    
    // Validar moeda permitida
    const allowedCurrencies = ['USD', 'EUR', 'GBP', 'USDT', 'USDC', 'BRL'];
    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency',
        message: 'Moeda não permitida. Use: USD, EUR, GBP, USDT, USDC ou BRL'
      });
    }
    
    // Buscar client_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id, user_name')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile not found',
        message: 'Perfil do usuário não encontrado'
      });
    }
    
    const clientId = profile.client_id;
    const clientName = profile.user_name || req.user.email || 'Cliente';
    
    // Buscar dados do beneficiário
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('id', beneficiary_id)
      .eq('client_id', clientId)
      .single();
    
    if (beneficiaryError || !beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found',
        message: 'Beneficiário não encontrado'
      });
    }
    
    // Verificar saldo disponível
    const balanceResult = await walletsService.getWalletBalance(clientId, currency);
    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check balance',
        message: 'Erro ao verificar saldo'
      });
    }
    
    const availableBalance = balanceResult.data || 0;
    if (availableBalance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        message: `Saldo insuficiente. Disponível: ${availableBalance} ${currency}, Necessário: ${amount} ${currency}`
      });
    }
    
    // Verificar se é transferência interna
    const isInternalTransfer = beneficiary.transfer_method === 'INTERNAL';
    let destinationClientId = null;
    
    if (isInternalTransfer) {
      // Para transferências internas, buscar o cliente de destino pelo número da conta
      const { data: destinationClient, error: destError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('account_number', beneficiary.internal_account_number)
        .eq('active', true)
        .single();
      
      if (destError || !destinationClient) {
        return res.status(400).json({
          success: false,
          error: 'Destination client not found',
          message: 'Cliente de destino não encontrado ou inativo'
        });
      }
      
      destinationClientId = destinationClient.id;
      
      // Verificar se não está tentando transferir para si mesmo
      if (destinationClientId === clientId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid destination',
          message: 'Não é possível transferir para sua própria conta'
        });
      }
    }

    // Preparar dados da operação
    const operationData = {
      user_id: userId,
      client_id: clientId,
      operation_type: 'transfer',
      source_currency: currency,
      target_currency: currency, // Para transferências, origem e destino são a mesma moeda
      source_amount: amount,
      target_amount: amount,
      exchange_rate: 1.0, // Taxa 1:1 para transferências
      base_rate: 1.0,
      final_rate: 1.0,
      markup_percentage: 0.0,
      fee_amount: 0.0,
      status: isInternalTransfer ? 'executed' : 'pending', // Transferências internas são executadas imediatamente
      quotation_id: null,
      reference_id: null,
      beneficiary_name: beneficiary.beneficiary_name,
      beneficiary_account: beneficiary.internal_account_number || beneficiary.beneficiary_account_number || beneficiary.beneficiary_account_number_ach,
      beneficiary_bank_name: beneficiary.beneficiary_bank_name,
      beneficiary_bank_address: beneficiary.beneficiary_bank_address,
      beneficiary_iban: beneficiary.beneficiary_iban,
      beneficiary_swift_bic: beneficiary.beneficiary_swift_bic,
      beneficiary_routing_number: beneficiary.beneficiary_routing_number,
      beneficiary_account_type: beneficiary.beneficiary_account_type,
      transfer_method: beneficiary.transfer_method,
      intermediary_bank_swift: beneficiary.intermediary_bank_swift,
      payment_reference: payment_reference,
      notes: notes || (isInternalTransfer ? `Transferência interna para conta ${beneficiary.internal_account_number}` : null),
      attachment_url_1: attachment_url_1 || null,
      attachment_url_2: attachment_url_2 || null,
      executed_at: isInternalTransfer ? new Date().toISOString() : null
    };
    
    // Criar operação no histórico
    const operationResult = await operationsService.createOperation(operationData);
    
    if (!operationResult.success) {
      console.error('Error creating transfer operation:', operationResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create operation',
        message: 'Erro ao criar operação de transferência'
      });
    }
    
    // Atualizar saldos das carteiras
    const walletResults = {
      source: null,
      destination: null
    };
    
    // Sempre debitar da carteira de origem
    walletResults.source = await walletsService.updateWalletBalance(
      clientId,
      currency,
      amount,
      'subtract'
    );
    
    if (!walletResults.source.success) {
      console.error('Error updating source wallet:', walletResults.source.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update source wallet',
        message: 'Erro ao atualizar carteira de origem'
      });
    }
    
    // Para transferências internas, creditar na carteira de destino
    if (isInternalTransfer && destinationClientId) {
      walletResults.destination = await walletsService.updateWalletBalance(
        destinationClientId,
        currency,
        amount,
        'add'
      );
      
      if (!walletResults.destination.success) {
        console.error('Error updating destination wallet:', walletResults.destination.error);
        // Reverter a operação de origem se falhar a de destino
        await walletsService.updateWalletBalance(
          clientId,
          currency,
          amount,
          'add'
        );
        
        return res.status(500).json({
          success: false,
          error: 'Failed to update destination wallet',
          message: 'Erro ao atualizar carteira de destino'
        });
      }
      
      // Criar operação adicional no histórico do cliente de destino
      try {
        const destinationOperationData = {
          user_id: userId, // Mantém o usuário que fez a transferência
          client_id: destinationClientId, // Cliente de destino
          operation_type: 'internal_deposit', // Novo tipo para depósitos internos
          source_currency: currency,
          target_currency: currency,
          source_amount: amount, // Valor positivo para mostrar como depósito
          target_amount: amount,
          exchange_rate: 1.0,
          base_rate: 1.0,
          final_rate: 1.0,
          markup_percentage: 0.0,
          fee_amount: 0.0,
          status: 'executed',
          quotation_id: null,
          reference_id: operationResult.data.id, // Referência à operação original
          beneficiary_name: beneficiary.beneficiary_name,
          beneficiary_account: beneficiary.internal_account_number,
          beneficiary_bank_name: null,
          beneficiary_bank_address: null,
          beneficiary_iban: null,
          beneficiary_swift_bic: null,
          beneficiary_routing_number: null,
          beneficiary_account_type: null,
          transfer_method: 'INTERNAL',
          intermediary_bank_swift: null,
          payment_reference: payment_reference,
          notes: `Depósito interno recebido de conta ${clientId}`,
          attachment_url_1: null,
          attachment_url_2: null,
          executed_at: new Date().toISOString()
        };
        
        const destinationOperationResult = await operationsService.createOperation(destinationOperationData);
        
        if (destinationOperationResult.success) {
          console.log(`✅ Operação de depósito criada para cliente destino: ${destinationOperationResult.data.id}`);
        } else {
          console.error('⚠️ Erro ao criar operação de depósito para cliente destino:', destinationOperationResult.error);
          // Não falha a transferência por isso, apenas loga o erro
        }
      } catch (depositError) {
        console.error('⚠️ Erro ao criar operação de depósito:', depositError.message);
        // Não falha a transferência por isso, apenas loga o erro
      }
      
      console.log(`✅ Transferência interna executada: ${amount} ${currency} de ${clientId} para ${destinationClientId}`);
    }
    
    res.status(201).json({
      success: true,
      data: {
        operation_id: operationResult.data.id,
        beneficiary: beneficiary.beneficiary_name,
        amount: amount,
        currency: currency,
        status: isInternalTransfer ? 'executed' : 'pending',
        transfer_type: isInternalTransfer ? 'internal' : 'external',
        destination_client: isInternalTransfer ? destinationClientId : null,
        wallet_updated: {
          source: walletResults.source.success,
          destination: walletResults.destination?.success || null
        }
      },
      message: isInternalTransfer ? 'Transferência interna executada com sucesso' : 'Transferência criada com sucesso'
    });
    
  } catch (error) {
    console.error('Transfer creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
