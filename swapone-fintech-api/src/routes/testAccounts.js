const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint temporário para testar accounts
router.get('/test-accounts', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔍 Test accounts for user ${userId}, client ${clientId}`);

    // Buscar carteiras por client_id E user_id
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching wallets:', error);
      throw new Error('Failed to fetch wallet data');
    }

    console.log(`📊 Found ${wallets?.length || 0} wallets`);

    // Obter taxas de câmbio para conversão USD
    const exchangeRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      BRL: 0.19,
      USDC: 1.0,
      USDT: 1.0
    };

    // Converter carteiras para formato de contas
    const accounts = wallets?.map(wallet => ({
      id: `account-${wallet.currency.toLowerCase()}`,
      currency: wallet.currency,
      balance: wallet.balance,
      balanceUSD: Math.round(wallet.balance * (exchangeRates[wallet.currency] || 1) * 100) / 100,
      wallet_address: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 
        `0x${Math.random().toString(16).substr(2, 40)}` : null,
      network: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 'Ethereum' : null,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at
    })) || [];

    console.log(`✅ Returning ${accounts.length} accounts`);

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    console.error('❌ Test accounts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch accounts'
    });
  }
});

module.exports = router;
