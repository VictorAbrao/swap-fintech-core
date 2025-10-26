const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class OperationsService {
  async createOperation(operationData) {
    try {
      const { data, error } = await supabase
        .from('operations_history')
        .insert([operationData])
        .select()
        .single();

      if (error) {
        console.error('Error creating operation:', error);
        console.error('Operation data:', operationData);
        throw error;
      }

      console.log('✅ Operation saved to history:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to save operation:', error);
      return { success: false, error: error.message };
    }
  }

  async updateOperationStatus(operationId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData
      };

      if (status === 'executed') {
        updateData.executed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('operations_history')
        .update(updateData)
        .eq('id', operationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating operation:', error);
        throw error;
      }

      console.log('✅ Operation status updated:', operationId, '->', status);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to update operation:', error);
      return { success: false, error: error.message };
    }
  }

  async updateOperationBrazaOrderId(operationId, brazaOrderId) {
    try {
      const { data, error } = await supabase
        .from('operations_history')
        .update({
          braza_order_id: brazaOrderId,
          updated_at: new Date().toISOString()
        })
        .eq('id', operationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating operation with Braza order ID:', error);
        throw error;
      }

      console.log('✅ Operation updated with Braza order ID:', data.id, '->', brazaOrderId);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to update operation with Braza order ID:', error);
      return { success: false, error: error.message };
    }
  }

  async updateOperationIdBrazaOrder(operationId, idBrazaOrder) {
    try {
      const { data, error } = await supabase
        .from('operations_history')
        .update({
          id_braza_order: idBrazaOrder,
          updated_at: new Date().toISOString()
        })
        .eq('id', operationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating operation with Braza order ID number:', error);
        throw error;
      }

      console.log('✅ Operation updated with Braza order ID number:', data.id, '->', idBrazaOrder);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to update operation with Braza order ID number:', error);
      return { success: false, error: error.message };
    }
  }

  async getClientOperations(clientId, limit = 50) {
    try {
      // Buscar operações onde o cliente é o originador OU o destino (para transferências internas)
      const { data, error } = await supabase
        .from('operations_history')
        .select('*')
        .or(`client_id.eq.${clientId},destination_client_id.eq.${clientId}`)
        .neq('status', 'cancelado')
        .neq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching client operations:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to fetch client operations:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserOperations(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('operations_history')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'cancelado')
        .neq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user operations:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to fetch user operations:', error);
      return { success: false, error: error.message };
    }
  }

  async getAllOperations(limit = 100, offset = 0, filters = {}) {
    try {
      let query = supabase
        .from('operations_history')
        .select(`
          *,
          clients!client_id (
            name,
            cnpj
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.operation_type) {
        query = query.eq('operation_type', filters.operation_type);
      }
      if (filters.source_currency) {
        query = query.eq('source_currency', filters.source_currency);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching all operations:', error);
        throw error;
      }

      // Processar dados para incluir informações do cliente
      const processedData = data.map(operation => ({
        ...operation,
        client_name: operation.clients?.name || 'N/A',
        client_cnpj: operation.clients?.cnpj || 'N/A'
      }));

      // Adicionar informações do usuário aos dados processados
      const finalData = processedData.map(operation => ({
        ...operation,
        user_name: operation.user_id || 'N/A',
        user_email: operation.user_id || 'N/A'
      }));

      return { success: true, data: finalData, total: count };
    } catch (error) {
      console.error('❌ Failed to fetch all operations:', error);
      return { success: false, error: error.message };
    }
  }

  async getOperationById(operationId) {
    try {
      const { data, error } = await supabase
        .from('operations_history')
        .select('*')
        .eq('id', operationId)
        .single();

      if (error) {
        console.error('Error fetching operation:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to fetch operation:', error);
      return { success: false, error: error.message };
    }
  }
}

const operationsService = new OperationsService();

module.exports = operationsService;


