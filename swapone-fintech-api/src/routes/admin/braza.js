const express = require('express');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const brazaBankService = require('../../services/brazaBankService');
const operationsService = require('../../services/operationsService');

const router = express.Router();

/**
 * @swagger
 * /api/admin/braza/execute-order:
 *   post:
 *     summary: Executar ordem no Braza Bank
 *     tags: [Admin - Braza Bank]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - operationId
 *               - brazaOrderId
 *             properties:
 *               operationId:
 *                 type: string
 *                 description: ID da operação no sistema
 *               brazaOrderId:
 *                 type: string
 *                 description: UUID da ordem no Braza Bank
 *     responses:
 *       200:
 *         description: Ordem executada com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/execute-order', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { operationId, brazaOrderId } = req.body;

    if (!operationId || !brazaOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'operationId and brazaOrderId are required'
      });
    }

    console.log(`🚀 Executing Braza order for operation ${operationId}: ${brazaOrderId}`);

    // Executar a ordem no Braza Bank
    const executeResult = await brazaBankService.executeOrder(
      brazaOrderId,
      req.user.userId,
      req.user.clientId,
      `execute-${Date.now()}`
    );

    if (!executeResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to execute order in Braza Bank',
        message: executeResult.error
      });
    }

    // Atualizar a operação com o UUID do Braza (se ainda não estiver)
    const updateResult = await operationsService.updateOperationBrazaOrderId(operationId, brazaOrderId);
    
    if (!updateResult.success) {
      console.warn('⚠️  Failed to update operation with Braza order ID, but order was executed');
    }

    // Atualizar status da operação para executed
    const statusResult = await operationsService.updateOperationStatus(operationId, 'executed');
    
    if (!statusResult.success) {
      console.warn('⚠️  Failed to update operation status, but order was executed');
    }

    res.json({
      success: true,
      message: 'Order executed successfully in Braza Bank',
      data: {
        operationId,
        brazaOrderId,
        executeResult: executeResult.data
      }
    });

  } catch (error) {
    console.error('Execute Braza order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to execute Braza order'
    });
  }
});

module.exports = router;
