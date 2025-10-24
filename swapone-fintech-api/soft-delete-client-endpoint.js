// Soft Delete Implementation for Client Deletion
// This replaces the physical delete with soft delete functionality

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Soft deleting client and cascade soft deleting users: ${id}`);

    // Buscar dados do cliente antes de deletar para notificação
    const { data: clientData, error: clientFetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (clientFetchError) {
      console.error('❌ Error fetching client data:', clientFetchError);
      return res.status(500).json({
        success: false,
        error: 'Error fetching client data',
        message: clientFetchError.message
      });
    }

    // Soft delete all users of the client
    console.log(`👥 Soft deleting all users for client ${id}...`);
    const usersResult = await softDeleteService.softDeleteByClientId('profiles', id);
    
    if (!usersResult.success) {
      console.error('❌ Error soft deleting users:', usersResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error soft deleting users',
        message: usersResult.error
      });
    }

    // Soft delete all wallets of the client
    console.log(`💰 Soft deleting all wallets for client ${id}...`);
    const walletsResult = await softDeleteService.softDeleteByClientId('wallets', id);
    
    if (!walletsResult.success) {
      console.error('❌ Error soft deleting wallets:', walletsResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error soft deleting wallets',
        message: walletsResult.error
      });
    }

    // Soft delete all operations of the client
    console.log(`📊 Soft deleting all operations for client ${id}...`);
    const operationsResult = await softDeleteService.softDeleteByClientId('operations_history', id);
    
    if (!operationsResult.success) {
      console.error('❌ Error soft deleting operations:', operationsResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error soft deleting operations',
        message: operationsResult.error
      });
    }

    // Soft delete all beneficiaries of the client
    console.log(`👤 Soft deleting all beneficiaries for client ${id}...`);
    const beneficiariesResult = await softDeleteService.softDeleteByClientId('beneficiaries', id);
    
    if (!beneficiariesResult.success) {
      console.error('❌ Error soft deleting beneficiaries:', beneficiariesResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error soft deleting beneficiaries',
        message: beneficiariesResult.error
      });
    }

    // Soft delete all markups of the client
    console.log(`📈 Soft deleting all markups for client ${id}...`);
    const markupsResult = await softDeleteService.softDeleteByClientId('client_markups', id);
    
    if (!markupsResult.success) {
      console.error('❌ Error soft deleting markups:', markupsResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error soft deleting markups',
        message: markupsResult.error
      });
    }

    // Finally, soft delete the client itself
    console.log(`🏢 Soft deleting client ${id}...`);
    const clientResult = await softDeleteService.softDelete('clients', id);
    
    if (!clientResult.success) {
      console.error('❌ Error soft deleting client:', clientResult.error);
      return res.status(500).json({
        success: false,
        error: 'Error soft deleting client',
        message: clientResult.error
      });
    }

    console.log(`✅ Client and all related data soft deleted successfully: ${id}`);

    // Enviar notificação para o board sobre deleção de cliente
    try {
      const userInfo = {
        name: req.user.name || 'Administrador',
        email: req.user.email,
        role: req.user.role
      };
      
      await emailService.sendClientNotification('deleted', {
        ...clientData,
        deleted_at: new Date().toISOString()
      }, userInfo);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar notificação de cliente:', emailError.message);
      // Não falha a operação por erro de email
    }

    res.json({
      success: true,
      message: `Client and related data soft deleted successfully`,
      deletedUsers: usersResult.deletedCount,
      deletedWallets: walletsResult.deletedCount,
      deletedOperations: operationsResult.deletedCount,
      deletedBeneficiaries: beneficiariesResult.deletedCount,
      deletedMarkups: markupsResult.deletedCount
    });

  } catch (error) {
    console.error('❌ Delete client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});
