const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class BrazaRequestsService {
  /**
   * Logar uma request para o Braza Bank
   */
  async logRequest(requestData) {
    try {
      const logEntry = {
        request_type: requestData.type || 'unknown',
        endpoint: requestData.endpoint || '',
        method: requestData.method || 'POST',
        request_payload: requestData.requestPayload || null,
        request_headers: requestData.requestHeaders || null,
        response_status: requestData.responseStatus || null,
        response_payload: requestData.responseData || null,
        response_headers: requestData.responseHeaders || null,
        request_duration_ms: requestData.responseTime || null,
        error_message: requestData.error || null,
        error_code: requestData.errorCode || null,
        user_id: requestData.userId || null,
        client_id: requestData.clientId || null,
        quotation_id: requestData.quotationId || null
      };

      const { data, error } = await supabase
        .from('braza_requests_log')
        .insert([logEntry])
        .select();

      if (error) {
        console.error('Error logging Braza request:', error);
        return { success: false, error: error.message };
      }

      console.log(`📝 Braza request logged: ${requestData.type} - ${requestData.endpoint}`);
      return { success: true, data };
    } catch (error) {
      console.error('Error in logRequest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter todas as requests do Braza Bank
   */
  async getAllRequests(limit = 1000) {
    try {
      const { data, error } = await supabase
        .from('braza_requests_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting Braza requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getAllRequests:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter requests por tipo
   */
  async getRequestsByType(requestType, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('braza_requests_log')
        .select('*')
        .eq('request_type', requestType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting Braza requests by type:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getRequestsByType:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpar todas as requests antigas (manter últimos 30 dias)
   */
  async cleanupOldRequests() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      console.log(`🧹 Cleaning up Braza requests older than: ${thirtyDaysAgo.toISOString()}`);

      const { error, count } = await supabase
        .from('braza_requests_log')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Error cleaning up old Braza requests:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Cleaned up ${count} old Braza requests.`);
      return { success: true, count };
    } catch (error) {
      console.error('Error in cleanupOldRequests:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpar todas as requests
   */
  async clearAllRequests() {
    try {
      const { error } = await supabase
        .from('braza_requests_log')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Condição para deletar tudo

      if (error) {
        console.error('Error clearing all Braza requests:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'All Braza requests cleared.' };
    } catch (error) {
      console.error('Error in clearAllRequests:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletar uma request específica
   */
  async deleteRequest(id) {
    try {
      const { error } = await supabase
        .from('braza_requests_log')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting Braza request:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: `Request ${id} deleted.` };
    } catch (error) {
      console.error('Error in deleteRequest:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new BrazaRequestsService();
