const express = require('express');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const markupService = require('../../services/markupService');

const router = express.Router();

/**
 * @swagger
 * /api/admin/markup:
 *   get:
 *     summary: Obter taxas de markup configuradas
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Taxas obtidas com sucesso
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const markups = markupService.getAllMarkups();
    
    res.json({
      success: true,
      data: markups
    });
  } catch (error) {
    console.error('Get markup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get markup'
    });
  }
});

/**
 * @swagger
 * /api/admin/markup:
 *   put:
 *     summary: Atualizar taxa de markup
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *                 example: "USDT"
 *               markup:
 *                 type: number
 *                 example: 0.5
 *     responses:
 *       200:
 *         description: Markup atualizado com sucesso
 */
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currency, markup } = req.body;

    if (!currency || markup === undefined) {
      return res.status(400).json({
        error: 'Missing parameters',
        message: 'currency and markup are required'
      });
    }

    const result = markupService.setMarkup(currency, parseFloat(markup));
    
    res.json(result);
  } catch (error) {
    console.error('Update markup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update markup'
    });
  }
});

module.exports = router;


