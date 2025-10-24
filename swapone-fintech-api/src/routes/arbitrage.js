const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * @swagger
 * /api/arbitrage/rates:
 *   get:
 *     summary: Obter taxas de arbitragem
 *     tags: [Arbitrage]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Taxas de arbitragem obtidas com sucesso
 */
router.get('/rates', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const { data: rates, error } = await supabase
      .from('arbitrage_rates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch arbitrage rates');
    }

    res.json({
      success: true,
      data: rates
    });

  } catch (error) {
    console.error('Get arbitrage rates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch arbitrage rates'
    });
  }
});

module.exports = router;
