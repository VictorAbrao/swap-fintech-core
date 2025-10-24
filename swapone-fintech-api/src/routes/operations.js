const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const operationsService = require('../services/operationsService');

const router = express.Router();

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;
    const limit = parseInt(req.query.limit) || 50;
    const currency = req.query.currency;

    console.log(`🔍 Operations history for user ${userId}, client ${clientId}, currency: ${currency || 'all'}`);

    const result = await operationsService.getClientOperations(clientId, limit);

    if (result.success) {
      let operations = result.data || [];
      
      console.log(`📊 Found ${operations.length} operations`);
      
      if (currency) {
        if (currency.toUpperCase() === 'BRL') {
          operations = operations.filter(op => 
            op.target_currency === 'BRL' || op.source_currency === 'BRL'
          );
          console.log(`🔎 Filtered to ${operations.length} operations with BRL`);
        } else {
          operations = operations.filter(op => 
            op.source_currency?.toUpperCase() === currency.toUpperCase() ||
            op.target_currency?.toUpperCase() === currency.toUpperCase()
          );
          console.log(`🔎 Filtered to ${operations.length} operations for ${currency}`);
        }
      }

      res.json({
        success: true,
        data: operations
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch operations',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Operations history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/history/:id', authenticateToken, async (req, res) => {
  try {
    const operationId = req.params.id;
    const userId = req.user.id;

    const result = await operationsService.getOperationById(operationId);

    if (result.success) {
      if (result.data.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to view this operation'
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Not found',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Get operation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;


