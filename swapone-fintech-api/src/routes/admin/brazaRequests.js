const express = require('express');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const brazaRequestsService = require('../../services/brazaRequestsService');

const router = express.Router();

/**
 * @swagger
 * /api/admin/braza-requests:
 *   get:
 *     summary: Obter todas as requests feitas para o Braza Bank
 *     tags: [Admin - Braza Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Limite de registros a retornar
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo de request
 *     responses:
 *       200:
 *         description: Lista de requests do Braza Bank
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 1000, type } = req.query;
    
    let result;
    if (type) {
      result = await brazaRequestsService.getRequestsByType(type, parseInt(limit));
    } else {
      result = await brazaRequestsService.getAllRequests(parseInt(limit));
    }
    
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
    console.error('Get Braza requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get Braza requests'
    });
  }
});

/**
 * @swagger
 * /api/admin/braza-requests/clear:
 *   delete:
 *     summary: Limpar todas as requests do Braza Bank
 *     tags: [Admin - Braza Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Requests limpas com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.delete('/clear', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await brazaRequestsService.clearAllRequests();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: result.error
      });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Clear Braza requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to clear Braza requests'
    });
  }
});

/**
 * @swagger
 * /api/admin/braza-requests/{id}:
 *   delete:
 *     summary: Deletar uma request específica
 *     tags: [Admin - Braza Requests]
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
 *         description: Request deletada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await brazaRequestsService.deleteRequest(id);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Delete Braza request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/braza-requests/cleanup:
 *   post:
 *     summary: Limpar requests antigas (manter últimos 30 dias)
 *     tags: [Admin - Braza Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpeza executada com sucesso
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 */
router.post('/cleanup', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await brazaRequestsService.cleanupOldRequests();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${result.count} old Braza requests`,
      count: result.count
    });
  } catch (error) {
    console.error('Cleanup Braza requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to cleanup Braza requests'
    });
  }
});

module.exports = router;
