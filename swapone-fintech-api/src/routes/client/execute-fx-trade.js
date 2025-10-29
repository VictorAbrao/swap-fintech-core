const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const brazaBankService = require('../../services/brazaBankService');
const clientMarkupsService = require('../../services/clientMarkupsService');
const operationsService = require('../../services/operationsService');
const walletsService = require('../../services/walletsService');
const emailService = require('../../services/emailService');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { quotation_id, currency, amount, side, final_rate, total } = req.body;
    const clientId = req.user.clientId || req.user.client_id;

    if (!clientId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Client ID not found in token'
      });
    }

    if (!quotation_id || !currency || !amount || !side) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'quotation_id, currency, amount, and side are required'
      });
    }

    const fromCurrency = currency;
    const toCurrency = 'BRL';

    const walletBalance = await walletsService.getWalletBalance(clientId, fromCurrency);
    
    if (side === 'sell' && parseFloat(walletBalance) < parseFloat(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        message: `Insufficient ${fromCurrency} balance`
      });
    }

    const { markup_percentage, fixed_rate_amount } = await clientMarkupsService.getClientMarkup(
      clientId,
      fromCurrency,
      toCurrency
    );

    const previewResult = await brazaBankService.getPreviewQuotation(fromCurrency, amount, side);
    
    if (!previewResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to get quotation',
        message: previewResult.error || 'Error getting quotation from provider'
      });
    }

    const baseRate = parseFloat(previewResult.data.rate);
    const markupAmount = (baseRate * markup_percentage) / 100;
    const finalRate = baseRate + markupAmount + fixed_rate_amount;
    const totalBRL = amount * finalRate;

    if (side === 'buy') {
      // Compra: adicionar USDT/USDC e subtrair BRL
      await walletsService.updateWalletBalance(clientId, fromCurrency, amount, 'add');
      await walletsService.updateWalletBalance(clientId, toCurrency, totalBRL, 'subtract');
    } else {
      // Venda: subtrair USDT/USDC e adicionar BRL
      await walletsService.updateWalletBalance(clientId, fromCurrency, amount, 'subtract');
      await walletsService.updateWalletBalance(clientId, toCurrency, totalBRL, 'add');
    }

    const operationData = {
      client_id: clientId,
      user_id: req.user.userId,
      operation_type: 'fx_trade',
      source_currency: fromCurrency,
      target_currency: toCurrency,
      source_amount: side === 'sell' ? amount : 0,
      target_amount: totalBRL,
      exchange_rate: finalRate,
      base_rate: baseRate,
      final_rate: finalRate,
      markup_percentage: markup_percentage,
      fixed_rate_amount: fixed_rate_amount,
      status: 'executed',
      quotation_id: quotation_id,
      side: side
    };

    const { data: operation, error: opError } = await supabase
      .from('operations_history')
      .insert([operationData])
      .select()
      .single();

    if (opError) {
      console.error('Error creating operation:', opError);
      
      // Reverter as mudanças das carteiras em caso de erro
      if (side === 'buy') {
        // Reverter compra: subtrair USDT/USDC e adicionar BRL
        await walletsService.updateWalletBalance(clientId, fromCurrency, amount, 'subtract');
        await walletsService.updateWalletBalance(clientId, toCurrency, totalBRL, 'add');
      } else {
        // Reverter venda: adicionar USDT/USDC e subtrair BRL
        await walletsService.updateWalletBalance(clientId, fromCurrency, amount, 'add');
        await walletsService.updateWalletBalance(clientId, toCurrency, totalBRL, 'subtract');
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to create operation',
        message: opError.message
      });
    }

    const { data: client } = await supabase
      .from('clients')
      .select('name, account_number')
      .eq('id', clientId)
      .single();

    await emailService.sendOperationConfirmation({
      clientEmail: req.user.email,
      clientName: client?.name || 'Cliente',
      operationType: 'FX Trade',
      amount: amount,
      currency: fromCurrency,
      rate: finalRate.toFixed(4),
      totalBRL: totalBRL.toFixed(2),
      side: side
    });

    res.json({
      success: true,
      data: {
        operation_id: operation.id,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount: parseFloat(amount),
        total: totalBRL.toFixed(2),
        rate: finalRate.toFixed(4),
        status: 'executed'
      },
      message: 'FX Trade executed successfully'
    });

  } catch (error) {
    console.error('Execute FX Trade error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to execute FX Trade'
    });
  }
});

module.exports = router;



