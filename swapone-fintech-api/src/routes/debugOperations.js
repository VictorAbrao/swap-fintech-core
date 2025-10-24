const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint para debug - buscar operações de todas as tabelas possíveis
router.get('/debug-operations', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔍 Debug operations for user ${userId}, client ${clientId}`);

    const results = {};

    // Tentar buscar de operations_history por client_id
    try {
      const { data: operationsByClient, error: operationsByClientError } = await supabase
        .from('operations_history')
        .select('*')
        .eq('client_id', clientId);

      results.operations_history_by_client_id = {
        success: !operationsByClientError,
        count: operationsByClient?.length || 0,
        data: operationsByClient,
        error: operationsByClientError?.message
      };
    } catch (e) {
      results.operations_history_by_client_id = {
        success: false,
        error: e.message
      };
    }

    // Tentar buscar de operations_history por user_id
    try {
      const { data: operationsByUser, error: operationsByUserError } = await supabase
        .from('operations_history')
        .select('*')
        .eq('user_id', userId);

      results.operations_history_by_user_id = {
        success: !operationsByUserError,
        count: operationsByUser?.length || 0,
        data: operationsByUser,
        error: operationsByUserError?.message
      };
    } catch (e) {
      results.operations_history_by_user_id = {
        success: false,
        error: e.message
      };
    }

    // Tentar buscar de operations (sem _history)
    try {
      const { data: operations, error: operationsError } = await supabase
        .from('operations')
        .select('*')
        .eq('client_id', clientId);

      results.operations_by_client_id = {
        success: !operationsError,
        count: operations?.length || 0,
        data: operations,
        error: operationsError?.message
      };
    } catch (e) {
      results.operations_by_client_id = {
        success: false,
        error: e.message
      };
    }

    // Tentar buscar de transfers
    try {
      const { data: transfers, error: transfersError } = await supabase
        .from('transfers')
        .select('*')
        .eq('client_id', clientId);

      results.transfers_by_client_id = {
        success: !transfersError,
        count: transfers?.length || 0,
        data: transfers,
        error: transfersError?.message
      };
    } catch (e) {
      results.transfers_by_client_id = {
        success: false,
        error: e.message
      };
    }

    // Tentar buscar de transfers por user_id
    try {
      const { data: transfersByUser, error: transfersByUserError } = await supabase
        .from('transfers')
        .select('*')
        .eq('user_id', userId);

      results.transfers_by_user_id = {
        success: !transfersByUserError,
        count: transfersByUser?.length || 0,
        data: transfersByUser,
        error: transfersByUserError?.message
      };
    } catch (e) {
      results.transfers_by_user_id = {
        success: false,
        error: e.message
      };
    }

    res.json({
      success: true,
      data: {
        userId,
        clientId,
        debugResults: results
      }
    });

  } catch (error) {
    console.error('❌ Debug operations error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to debug operations'
    });
  }
});

module.exports = router;
