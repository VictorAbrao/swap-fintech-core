const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');
const walletsService = require('../services/walletsService');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint para debug - verificar carteiras do usuário
router.get('/debug-wallets', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔍 Debug wallets for user ${userId}, client ${clientId}`);

    // Usar o walletsService (que funciona no dashboard)
    const walletsResult = await walletsService.getUserWallets(userId);
    
    // Também tentar busca direta
    const { data: directWallets, error: directError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);

    res.json({
      success: true,
      data: {
        userId,
        clientId,
        walletsServiceResult: walletsResult,
        directSupabaseResult: {
          success: !directError,
          data: directWallets,
          error: directError?.message
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug wallets error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to debug wallets'
    });
  }
});

module.exports = router;
