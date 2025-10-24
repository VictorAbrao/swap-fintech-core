const express = require('express');
const router = express.Router();
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');
const walletsService = require('../services/walletsService');

/**
 * @swagger
 * /api/wallets/balance/{currency}:
 *   get:
 *     summary: Obter saldo da carteira por moeda
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: currency
 *         required: true
 *         schema:
 *           type: string
 *           enum: [USD, EUR, GBP, USDT]
 *         description: Moeda da carteira
 *     responses:
 *       200:
 *         description: Saldo da carteira
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: number
 *                   description: Saldo disponível
 *                 currency:
 *                   type: string
 *       400:
 *         description: Moeda inválida
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/balance/:currency', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const { currency } = req.params;
    const clientId = req.user.clientId;
    
    // Validar moeda permitida
    const allowedCurrencies = ['USD', 'EUR', 'GBP', 'USDT'];
    if (!allowedCurrencies.includes(currency.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency',
        message: 'Moeda não permitida. Use: USD, EUR, GBP ou USDT'
      });
    }
    
    // Buscar saldo da carteira
    const balanceResult = await walletsService.getWalletBalance(clientId, currency.toUpperCase());
    
    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch balance',
        message: 'Erro ao buscar saldo da carteira'
      });
    }
    
    res.json({
      success: true,
      data: balanceResult.data,
      currency: currency.toUpperCase()
    });
    
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

