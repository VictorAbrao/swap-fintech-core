const { createClient } = require('@supabase/supabase-js');

class SoftDeleteService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Soft delete a record by setting deleted_at and is_deleted
   */
  async softDelete(tableName, id, additionalConditions = {}) {
    try {
      const updateData = {
        deleted_at: new Date().toISOString(),
        is_deleted: true
      };

      let query = this.supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id);

      // Apply additional conditions if provided
      Object.keys(additionalConditions).forEach(key => {
        query = query.eq(key, additionalConditions[key]);
      });

      const { data, error } = await query.select().single();

      if (error) {
        console.error(`❌ Error soft deleting from ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Soft deleted record from ${tableName}:`, id);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Error in softDelete for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Restore a soft deleted record
   */
  async restore(tableName, id, additionalConditions = {}) {
    try {
      const updateData = {
        deleted_at: null,
        is_deleted: false
      };

      let query = this.supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id);

      // Apply additional conditions if provided
      Object.keys(additionalConditions).forEach(key => {
        query = query.eq(key, additionalConditions[key]);
      });

      const { data, error } = await query.select().single();

      if (error) {
        console.error(`❌ Error restoring from ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Restored record from ${tableName}:`, id);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Error in restore for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all records including soft deleted ones
   */
  async getAll(tableName, includeDeleted = false) {
    try {
      let query = this.supabase.from(tableName).select('*');

      if (!includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ Error fetching from ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`❌ Error in getAll for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get only soft deleted records
   */
  async getDeleted(tableName) {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('is_deleted', true);

      if (error) {
        console.error(`❌ Error fetching deleted from ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`❌ Error in getDeleted for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Permanently delete records that have been soft deleted for more than X days
   */
  async permanentDelete(tableName, daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('is_deleted', true)
        .lt('deleted_at', cutoffDate.toISOString())
        .select();

      if (error) {
        console.error(`❌ Error permanently deleting from ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Permanently deleted ${data?.length || 0} records from ${tableName}`);
      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error(`❌ Error in permanentDelete for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Soft delete multiple records by client_id (for cascade operations)
   */
  async softDeleteByClientId(tableName, clientId) {
    try {
      const updateData = {
        deleted_at: new Date().toISOString(),
        is_deleted: true
      };

      const { data, error } = await this.supabase
        .from(tableName)
        .update(updateData)
        .eq('client_id', clientId)
        .eq('is_deleted', false)
        .select();

      if (error) {
        console.error(`❌ Error soft deleting by client_id from ${tableName}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Soft deleted ${data?.length || 0} records from ${tableName} for client ${clientId}`);
      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error(`❌ Error in softDeleteByClientId for ${tableName}:`, error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SoftDeleteService();
