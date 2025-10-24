const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Endpoint para atualizar client_id nas operações existentes
router.post('/update-operations-client-id', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    console.log('🔄 Starting operations client_id update process...');

    // 1. Verificar operações sem client_id
    const { data: operationsWithoutClientId, error: countError1 } = await supabase
      .from('operations_history')
      .select('id')
      .is('client_id', null);

    if (countError1) {
      throw new Error(`Failed to count operations without client_id: ${countError1.message}`);
    }

    console.log(`📊 Found ${operationsWithoutClientId.length} operations without client_id`);

    // 2. Buscar operações sem client_id com user_id
    const { data: operationsToUpdate, error: selectError } = await supabase
      .from('operations_history')
      .select(`
        id,
        user_id,
        operation_type,
        amount,
        currency,
        brl_amount,
        status,
        created_at
      `)
      .is('client_id', null)
      .not('user_id', 'is', null);

    if (selectError) {
      throw new Error(`Failed to select operations: ${selectError.message}`);
    }

    console.log(`📋 Found ${operationsToUpdate.length} operations to update`);

    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    // 3. Atualizar cada operação
    for (const operation of operationsToUpdate) {
      try {
        // Buscar client_id do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('client_id')
          .eq('id', operation.user_id)
          .single();

        if (profileError || !profile?.client_id) {
          console.log(`⚠️ No client_id found for user ${operation.user_id}`);
          errorCount++;
          errors.push({
            operationId: operation.id,
            userId: operation.user_id,
            error: 'No client_id found in profile'
          });
          continue;
        }

        // Atualizar operação com client_id
        const { error: updateError } = await supabase
          .from('operations_history')
          .update({ client_id: profile.client_id })
          .eq('id', operation.id);

        if (updateError) {
          console.error(`❌ Failed to update operation ${operation.id}:`, updateError);
          errorCount++;
          errors.push({
            operationId: operation.id,
            userId: operation.user_id,
            error: updateError.message
          });
        } else {
          updatedCount++;
          console.log(`✅ Updated operation ${operation.id} with client_id ${profile.client_id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing operation ${operation.id}:`, error);
        errorCount++;
        errors.push({
          operationId: operation.id,
          userId: operation.user_id,
          error: error.message
        });
      }
    }

    // 4. Verificar resultado final
    const { data: finalCount, error: finalCountError } = await supabase
      .from('operations_history')
      .select('id')
      .is('client_id', null);

    if (finalCountError) {
      console.error('Failed to get final count:', finalCountError);
    }

    console.log(`🎉 Update process completed!`);
    console.log(`✅ Updated: ${updatedCount} operations`);
    console.log(`❌ Errors: ${errorCount} operations`);
    console.log(`📊 Remaining without client_id: ${finalCount?.length || 0} operations`);

    res.json({
      success: true,
      data: {
        totalOperationsFound: operationsToUpdate.length,
        updatedCount,
        errorCount,
        remainingWithoutClientId: finalCount?.length || 0,
        errors: errors.slice(0, 10) // Limitar a 10 erros para não sobrecarregar a resposta
      }
    });

  } catch (error) {
    console.error('❌ Update operations client_id error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to update operations client_id'
    });
  }
});

// Endpoint para verificar status das operações
router.get('/check-operations-status', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔍 Checking operations status for user ${userId}, client ${clientId}`);

    // Verificar operações sem client_id
    const { data: operationsWithoutClientId, error: countError1 } = await supabase
      .from('operations_history')
      .select('id')
      .is('client_id', null);

    // Verificar operações com client_id
    const { data: operationsWithClientId, error: countError2 } = await supabase
      .from('operations_history')
      .select('id')
      .not('client_id', 'is', null);

    // Verificar operações do cliente atual
    const { data: clientOperations, error: clientOperationsError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Verificar operações do usuário atual
    const { data: userOperations, error: userOperationsError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    res.json({
      success: true,
      data: {
        userId,
        clientId,
        summary: {
          operationsWithoutClientId: operationsWithoutClientId?.length || 0,
          operationsWithClientId: operationsWithClientId?.length || 0,
          clientOperationsCount: clientOperations?.length || 0,
          userOperationsCount: userOperations?.length || 0
        },
        clientOperations: clientOperations || [],
        userOperations: userOperations || []
      }
    });

  } catch (error) {
    console.error('❌ Check operations status error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to check operations status'
    });
  }
});

module.exports = router;
