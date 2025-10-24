const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');
const operationsService = require('../services/operationsService');
const walletsService = require('../services/walletsService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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
 *                 enum: [USD, EUR, GBP, USDT]
 *                 description: Moeda da transferência (USD, EUR, GBP, USDT)
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
    const allowedCurrencies = ['USD', 'EUR', 'GBP', 'USDT'];
    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency',
        message: 'Moeda não permitida. Use: USD, EUR, GBP ou USDT'
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
      status: 'pending', // Transferências começam como pending
      quotation_id: null,
      reference_id: null,
      beneficiary_name: beneficiary.beneficiary_name,
      beneficiary_account: beneficiary.beneficiary_account_number || beneficiary.beneficiary_account_number_ach,
      beneficiary_bank_name: beneficiary.beneficiary_bank_name,
      beneficiary_bank_address: beneficiary.beneficiary_bank_address,
      beneficiary_iban: beneficiary.beneficiary_iban,
      beneficiary_swift_bic: beneficiary.beneficiary_swift_bic,
      beneficiary_routing_number: beneficiary.beneficiary_routing_number,
      beneficiary_account_type: beneficiary.beneficiary_account_type,
      transfer_method: beneficiary.transfer_method,
      intermediary_bank_swift: beneficiary.intermediary_bank_swift,
      payment_reference: payment_reference,
      notes: notes || null,
      attachment_url_1: attachment_url_1 || null,
      attachment_url_2: attachment_url_2 || null,
      executed_at: null
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
    
    // Atualizar saldo da carteira (subtrair valor)
    const walletResult = await walletsService.updateWalletBalance(
      clientId,
      currency,
      amount,
      'subtract'
    );
    
    if (!walletResult.success) {
      console.error('Error updating wallet:', walletResult.error);
      // Note: A operação já foi criada, mas o saldo não foi atualizado
      // Em um sistema real, você poderia implementar transações ou rollback
    }
    
    res.status(201).json({
      success: true,
      data: {
        operation_id: operationResult.data.id,
        beneficiary: beneficiary.beneficiary_name,
        amount: amount,
        currency: currency,
        status: 'pending',
        wallet_updated: walletResult.success
      },
      message: 'Transferência criada com sucesso'
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
