const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/check-wallets', async (req, res) => {
  try {
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .order('client_id, currency');

    if (error) {
      console.error('Error fetching wallets:', error);
      throw new Error('Failed to fetch wallet data');
    }

    const summary = {
      totalWallets: wallets?.length || 0,
      byClient: {},
      wallets: wallets || []
    };

    wallets?.forEach(wallet => {
      const clientId = wallet.client_id || 'no-client';
      if (!summary.byClient[clientId]) {
        summary.byClient[clientId] = {
          count: 0,
          currencies: []
        };
      }
      summary.byClient[clientId].count++;
      summary.byClient[clientId].currencies.push(wallet.currency);
    });

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('❌ Check wallets error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to check wallets'
    });
  }
});

module.exports = router;

