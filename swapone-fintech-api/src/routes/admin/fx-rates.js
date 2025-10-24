const express = require('express');
const router = express.Router();
const fxRatesService = require('../../services/fxRatesService');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

/**
 * @swagger
 * /api/admin/fx-rates:
 *   get:
 *     summary: Listar todas as taxas FX Trade
 *     tags: [Admin - FX Rates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de taxas FX
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       from_currency:
 *                         type: string
 *                       to_currency:
 *                         type: string
 *                       rate:
 *                         type: number
 *                       spread_bps:
 *                         type: number
 *                       active:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                       updated_at:
 *                         type: string
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - apenas administradores
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await fxRatesService.getAllRates();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch FX rates',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get FX rates error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/fx-rates:
 *   post:
 *     summary: Criar ou atualizar taxa FX Trade
 *     tags: [Admin - FX Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_currency
 *               - to_currency
 *               - rate
 *             properties:
 *               from_currency:
 *                 type: string
 *                 example: "USD"
 *               to_currency:
 *                 type: string
 *                 example: "BRL"
 *               rate:
 *                 type: number
 *                 example: 5.20
 *               spread_bps:
 *                 type: number
 *                 example: 50
 *               active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Taxa FX criada/atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - apenas administradores
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { from_currency, to_currency, rate, spread_bps, active, fixed_rate_amount } = req.body;

    // Validação
    if (!from_currency || !to_currency || rate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'from_currency, to_currency, and rate are required'
      });
    }

    if (from_currency === to_currency) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency pair',
        message: 'from_currency and to_currency must be different'
      });
    }

    const result = await fxRatesService.upsertRate({
      from_currency: from_currency.toUpperCase(),
      to_currency: to_currency.toUpperCase(),
      rate,
      spread_bps,
      active,
      fixed_rate_amount
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to save FX rate',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'FX rate saved successfully'
    });
  } catch (error) {
    console.error('Create/Update FX rate error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/fx-rates/{fromCurrency}/{toCurrency}:
 *   put:
 *     summary: Atualizar taxa FX Trade
 *     tags: [Admin - FX Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fromCurrency
 *         required: true
 *         schema:
 *           type: string
 *         example: "USD"
 *       - in: path
 *         name: toCurrency
 *         required: true
 *         schema:
 *           type: string
 *         example: "BRL"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rate:
 *                 type: number
 *                 example: 5.20
 *               spread_bps:
 *                 type: number
 *                 example: 50
 *               active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Taxa FX atualizada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - apenas administradores
 *       404:
 *         description: Taxa FX não encontrada
 */
router.put('/:fromCurrency/:toCurrency', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.params;
    const { rate, spread_bps, active, fixed_rate_amount } = req.body;

    // Validação
    if (rate === undefined && spread_bps === undefined && active === undefined && fixed_rate_amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        message: 'At least one field (rate, spread_bps, active, or fixed_rate_amount) must be provided'
      });
    }

    const updateData = {};
    if (rate !== undefined) updateData.rate = parseFloat(rate);
    if (spread_bps !== undefined) updateData.spread_bps = parseInt(spread_bps);
    if (active !== undefined) updateData.active = Boolean(active);
    if (fixed_rate_amount !== undefined) updateData.fixed_rate_amount = parseFloat(fixed_rate_amount);

    const result = await fxRatesService.updateRate(
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase(),
      updateData
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'FX rate not found',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: `FX rate ${fromCurrency}/${toCurrency} updated successfully`
    });
  } catch (error) {
    console.error('Update FX rate error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/fx-rates/{fromCurrency}/{toCurrency}:
 *   delete:
 *     summary: Desativar taxa FX Trade
 *     tags: [Admin - FX Rates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fromCurrency
 *         required: true
 *         schema:
 *           type: string
 *         example: "USD"
 *       - in: path
 *         name: toCurrency
 *         required: true
 *         schema:
 *           type: string
 *         example: "BRL"
 *     responses:
 *       200:
 *         description: Taxa FX desativada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - apenas administradores
 *       404:
 *         description: Taxa FX não encontrada
 */
router.delete('/:fromCurrency/:toCurrency', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.params;

    const result = await fxRatesService.deactivateRate(
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase()
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'FX rate not found',
        message: result.error
      });
    }

    res.json({
      success: true,
      message: `FX rate ${fromCurrency}/${toCurrency} deactivated successfully`
    });
  } catch (error) {
    console.error('Deactivate FX rate error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/fx-rates/calculate:
 *   post:
 *     summary: Calcular conversão usando taxas FX Trade
 *     tags: [Admin - FX Rates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from_currency
 *               - to_currency
 *               - amount
 *             properties:
 *               from_currency:
 *                 type: string
 *                 example: "USD"
 *               to_currency:
 *                 type: string
 *                 example: "BRL"
 *               amount:
 *                 type: number
 *                 example: 1000
 *               operation:
 *                 type: string
 *                 enum: [buy, sell]
 *                 example: "buy"
 *     responses:
 *       200:
 *         description: Cálculo realizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado - apenas administradores
 *       404:
 *         description: Taxa FX não encontrada
 */
router.post('/calculate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { from_currency, to_currency, amount, operation = 'buy' } = req.body;

    // Validação
    if (!from_currency || !to_currency || amount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'from_currency, to_currency, and amount are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      });
    }

    const result = await fxRatesService.calculateConversion(
      from_currency.toUpperCase(),
      to_currency.toUpperCase(),
      amount,
      operation
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'FX rate not found',
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Calculate FX conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
