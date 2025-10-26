const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');
const operationsService = require('../services/operationsService');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getClientNameById(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();
    
    if (error || !data) {
      return 'Cliente Desconhecido';
    }
    
    return data.name;
  } catch (error) {
    console.error('Error fetching client name:', error);
    return 'Cliente Desconhecido';
  }
}

router.get('/', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const clientId = req.user.clientId || req.user.client_id;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        error: 'Missing client ID',
        message: 'Client ID is required'
      });
    }

    const operationsResult = await operationsService.getClientOperations(clientId, 999);
    
    let allTransactions = [];
    if (operationsResult.success && operationsResult.data && operationsResult.data.length > 0) {
      allTransactions = await Promise.all(operationsResult.data.map(async op => {
        let displayData = {
          id: op.id,
          status: op.status,
          beneficiary_name: op.beneficiary_name || 'Operation',
          created_at: op.created_at,
          operation_type: op.operation_type
        };

        if (op.operation_type === 'fx_trade') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.final_quotation = op.final_rate;
          displayData.base_rate = op.base_rate;
          
          const determinedSide = op.side || (op.target_amount && op.source_amount ? 'buy' : 'unknown');
          displayData.side = op.side || determinedSide;
        } else if (op.operation_type === 'buy' || op.operation_type === 'sell') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.final_quotation = op.final_rate;
        } else if (op.operation_type === 'conversion') {
          displayData.from_amount = op.source_amount;
          displayData.from_currency = op.source_currency;
          displayData.to_amount = op.target_amount;
          displayData.to_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.base_rate = op.base_rate;
          displayData.markup_percentage = op.markup_percentage;
        } else if (op.operation_type === 'transfer') {
          const isReceivedTransfer = op.destination_client_id === clientId;
          
          if (isReceivedTransfer) {
            const senderClientName = await getClientNameById(op.client_id);
            
            displayData.amount = op.source_amount;
            displayData.currency = op.source_currency;
            displayData.target_amount = op.target_amount;
            displayData.target_currency = op.target_currency;
            displayData.transfer_method = op.transfer_method;
            displayData.payment_reference = op.payment_reference;
            displayData.fee_amount = op.fee_amount;
            displayData.notes = `Transfer by ${senderClientName || 'cliente'}`;
            displayData.beneficiary_account = op.internal_account_number;
            displayData.operation_type = 'transfer_received';
            displayData.transfer_by = senderClientName || 'Cliente';
            displayData.transfer_from_account = op.internal_account_number;
          } else {
            displayData.amount = op.source_amount;
            displayData.currency = op.source_currency;
            displayData.target_amount = op.target_amount;
            displayData.target_currency = op.target_currency;
            displayData.transfer_method = op.transfer_method;
            displayData.payment_reference = op.payment_reference;
            displayData.fee_amount = op.fee_amount;
            displayData.notes = op.notes;
            displayData.beneficiary_name = op.beneficiary_name;
          }
        } else if (op.operation_type === 'external_deposit' || op.operation_type === 'deposit') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.fee_amount = op.fee_amount;
          displayData.notes = op.notes;
        } else if (op.operation_type === 'withdrawal') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.fee_amount = op.fee_amount;
          displayData.notes = op.notes;
        }

        return displayData;
      }));
    }

    res.json({
      success: true,
      data: allTransactions,
      count: allTransactions.length
    });

  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to fetch transactions'
    });
  }
});

module.exports = router;

