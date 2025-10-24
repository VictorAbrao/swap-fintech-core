const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class WebhookService {
  constructor() {
    this.MAX_NOTIFICATIONS = 1000; // Aumentado de 100 para 1000
  }

  /**
   * Criar tabela webhook_notifications no Supabase (executar uma vez)
   */
  async createTable() {
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS webhook_notifications (
            id VARCHAR(255) PRIMARY KEY,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            headers JSONB,
            body JSONB,
            query_params JSONB,
            ip_address INET,
            method VARCHAR(10),
            url TEXT,
            is_test BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_webhook_notifications_timestamp 
          ON webhook_notifications(timestamp DESC);
          
          CREATE INDEX IF NOT EXISTS idx_webhook_notifications_is_test 
          ON webhook_notifications(is_test);
        `
      });

      if (error) {
        console.error('Error creating webhook_notifications table:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Webhook notifications table created successfully');
      return { success: true };
    } catch (error) {
      console.error('Failed to create webhook_notifications table:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Salvar notificação de webhook no Supabase
   */
  async saveNotification(notificationData) {
    try {
      const { data, error } = await supabase
        .from('webhook_notifications')
        .insert([notificationData])
        .select()
        .single();

      if (error) {
        console.error('Error saving webhook notification:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Webhook notification saved: ${notificationData.id}`);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to save webhook notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter todas as notificações do Supabase
   */
  async getAllNotifications() {
    try {
      const { data, error } = await supabase
        .from('webhook_notifications')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(this.MAX_NOTIFICATIONS);

      if (error) {
        console.error('Error getting webhook notifications:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Failed to get webhook notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Deletar uma notificação específica
   */
  async deleteNotification(id) {
    try {
      const { error } = await supabase
        .from('webhook_notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting webhook notification:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Webhook notification deleted: ${id}`);
      return { success: true, message: 'Notification deleted' };
    } catch (error) {
      console.error('Failed to delete webhook notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpar todas as notificações
   */
  async clearAllNotifications() {
    try {
      const { error } = await supabase
        .from('webhook_notifications')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        console.error('Error clearing webhook notifications:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ All webhook notifications cleared');
      return { success: true, message: 'All notifications cleared' };
    } catch (error) {
      console.error('Failed to clear webhook notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Limpar notificações antigas (mais de 30 dias)
   */
  async cleanOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('webhook_notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error cleaning old webhook notifications:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Old webhook notifications cleaned');
      return { success: true, message: 'Old notifications cleaned' };
    } catch (error) {
      console.error('Failed to clean old webhook notifications:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obter estatísticas das notificações
   */
  async getStats() {
    try {
      const { data, error } = await supabase
        .from('webhook_notifications')
        .select('id, is_test, created_at');

      if (error) {
        console.error('Error getting webhook stats:', error);
        return { success: false, error: error.message };
      }

      const total = data.length;
      const test = data.filter(n => n.is_test).length;
      const real = total - test;

      return {
        success: true,
        data: {
          total,
          test,
          real,
          oldest: data.length > 0 ? data[data.length - 1].created_at : null,
          newest: data.length > 0 ? data[0].created_at : null
        }
      };
    } catch (error) {
      console.error('Failed to get webhook stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WebhookService();
