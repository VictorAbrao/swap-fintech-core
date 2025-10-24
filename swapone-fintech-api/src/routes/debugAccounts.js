const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint para debug - verificar carteiras por client_id
router.get('/debug-accounts', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔍 Debug accounts for user ${userId}, client ${clientId}`);

    // Buscar carteiras por client_id
    const { data: walletsByClientId, error: walletsByClientIdError } = await supabase
      .from('wallets')
      .select('*')
      .eq('client_id', clientId);

    // Buscar carteiras por user_id (método antigo)
    const { data: walletsByUserId, error: walletsByUserIdError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    // Buscar todas as carteiras para debug
    const { data: allWallets, error: allWalletsError } = await supabase
      .from('wallets')
      .select('*')
      .limit(10);

    res.json({
      success: true,
      data: {
        userId,
        clientId,
        walletsByClientId: {
          success: !walletsByClientIdError,
          count: walletsByClientId?.length || 0,
          data: walletsByClientId,
          error: walletsByClientIdError?.message
        },
        walletsByUserId: {
          success: !walletsByUserIdError,
          count: walletsByUserId?.length || 0,
          data: walletsByUserId,
          error: walletsByUserIdError?.message
        },
        allWallets: {
          success: !allWalletsError,
          count: allWallets?.length || 0,
          data: allWallets,
          error: allWalletsError?.message
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug accounts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to debug accounts'
    });
  }
});

module.exports = router;
