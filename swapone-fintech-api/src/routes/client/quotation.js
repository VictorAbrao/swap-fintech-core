const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const brazaBankService = require('../../services/brazaBankService');
const clientMarkupsService = require('../../services/clientMarkupsService');

const router = express.Router();

router.post('/quote', authenticateToken, async (req, res) => {
  try {
    const { currency, amount, side } = req.body;
    const clientId = req.user.clientId || req.user.client_id;

    if (!clientId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Client ID not found in token'
      });
    }

    if (!currency || !amount || !side) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'currency, amount, and side are required'
      });
    }

    const validCurrencies = ['USD', 'EUR', 'GBP', 'BRL', 'USDT', 'USDC'];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency',
        message: `Currency must be one of: ${validCurrencies.join(', ')}`
      });
    }

    if (['buy', 'sell'].indexOf(side) === -1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid side',
        message: 'side must be "buy" or "sell"'
      });
    }

    const fromCurrency = currency;
    const toCurrency = 'BRL';

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

    res.json({
      success: true,
      data: {
        quotation_id: previewResult.data.quotation_id,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        amount: parseFloat(amount),
        side: side,
        rate: finalRate.toFixed(4),
        total: totalBRL.toFixed(2),
        valid_until: previewResult.data.valid_until || new Date(Date.now() + 30000).toISOString()
      }
    });

  } catch (error) {
    console.error('FX Quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to process quotation'
    });
  }
});

module.exports = router;



