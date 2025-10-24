const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint para recalcular saldo BRL baseado nas operações
router.post('/recalculate-brl-balance', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔄 Recalculating BRL balance for user ${userId}, client ${clientId}`);

    // Buscar todas as operações executadas do cliente
    const { data: operations, error: operationsError } = await supabase
      .from('operations_history')
      .select('operation_type, brl_amount')
      .eq('client_id', clientId)
      .eq('status', 'executed');

    if (operationsError) {
      console.error('Error fetching operations:', operationsError);
      throw new Error('Failed to fetch operations');
    }

    console.log(`📊 Found ${operations.length} operations`);

    // Calcular saldo BRL
    let brlBalance = 0;
    operations.forEach(op => {
      if (op.brl_amount > 0) {
        if (op.operation_type === 'buy') {
          brlBalance -= op.brl_amount;
          console.log(`💰 Buy operation: -${op.brl_amount} BRL (total: ${brlBalance})`);
        } else if (op.operation_type === 'sell') {
          brlBalance += op.brl_amount;
          console.log(`💰 Sell operation: +${op.brl_amount} BRL (total: ${brlBalance})`);
        }
      }
    });

    console.log(`💵 Final BRL balance: ${brlBalance}`);

    // Atualizar carteira BRL do usuário
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .update({ 
        balance: brlBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('currency', 'BRL')
      .select()
      .single();

    if (walletError) {
      console.error('Error updating wallet:', walletError);
      throw new Error('Failed to update wallet');
    }

    console.log(`✅ BRL wallet updated: ${brlBalance}`);

    res.json({
      success: true,
      data: {
        userId,
        clientId,
        operationsCount: operations.length,
        calculatedBrlBalance: brlBalance,
        walletUpdated: wallet
      }
    });

  } catch (error) {
    console.error('❌ Recalculate BRL balance error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to recalculate BRL balance'
    });
  }
});

// Endpoint para verificar saldo BRL atual
router.get('/check-brl-balance', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    // Buscar carteira BRL atual
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, updated_at')
      .eq('user_id', userId)
      .eq('currency', 'BRL')
      .single();

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      throw new Error('Failed to fetch wallet');
    }

    // Buscar operações para calcular saldo esperado
    const { data: operations, error: operationsError } = await supabase
      .from('operations_history')
      .select('operation_type, brl_amount, created_at')
      .eq('client_id', clientId)
      .eq('status', 'executed')
      .order('created_at', { ascending: true });

    if (operationsError) {
      console.error('Error fetching operations:', operationsError);
      throw new Error('Failed to fetch operations');
    }

    // Calcular saldo esperado
    let expectedBalance = 0;
    operations.forEach(op => {
      if (op.brl_amount > 0) {
        if (op.operation_type === 'buy') {
          expectedBalance -= op.brl_amount;
        } else if (op.operation_type === 'sell') {
          expectedBalance += op.brl_amount;
        }
      }
    });

    res.json({
      success: true,
      data: {
        userId,
        clientId,
        currentWalletBalance: wallet.balance,
        expectedBalance,
        balanceMatches: wallet.balance === expectedBalance,
        operationsCount: operations.length,
        operations: operations.map(op => ({
          type: op.operation_type,
          brlAmount: op.brl_amount,
          impact: op.operation_type === 'buy' ? -op.brl_amount : op.brl_amount,
          createdAt: op.created_at
        })),
        walletUpdatedAt: wallet.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Check BRL balance error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to check BRL balance'
    });
  }
});

module.exports = router;
