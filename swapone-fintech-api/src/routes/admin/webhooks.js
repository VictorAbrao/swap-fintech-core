const express = require('express');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const { webhookService } = require('../public/webhook');

const router = express.Router();

/**
 * @swagger
 * /api/admin/webhooks:
 *   get:
 *     summary: Obter todas as notificações de webhook recebidas
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await webhookService.getAllNotifications();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      count: result.data.length,
      data: result.data
    });
  } catch (error) {
    console.error('Get webhooks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get webhooks'
    });
  }
});

/**
 * @swagger
 * /api/admin/webhooks/clear:
 *   delete:
 *     summary: Limpar todas as notificações de webhook
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notificações limpas com sucesso
 */
router.delete('/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await webhookService.clearAllNotifications();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: result.error
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Clear webhooks error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear webhooks'
    });
  }
});

/**
 * @swagger
 * /api/admin/webhooks/{id}:
 *   delete:
 *     summary: Deletar uma notificação específica
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificação deletada com sucesso
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await webhookService.deleteNotification(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete webhook'
    });
  }
});

module.exports = router;

