const { createClient } = require('@supabase/supabase-js');

class ClientMarkupsService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  async getClientMarkup(clientId, fromCurrency, toCurrency) {
    try {
      if (!clientId) {
        return {
          success: true,
          markup_percentage: 0,
          fixed_rate_amount: 0,
          isDefault: true
        };
      }

      const { data, error } = await this.supabase
        .from('client_markups')
        .select('*')
        .eq('client_id', clientId)
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .eq('active', true)
        .single();

      if (error || !data) {
        return {
          success: true,
          markup_percentage: 0,
          fixed_rate_amount: 0,
          isDefault: true
        };
      }

      return {
        success: true,
        markup_percentage: parseFloat(data.markup_percentage),
        fixed_rate_amount: parseFloat(data.fixed_rate_amount) || 0,
        isDefault: false,
        data: data
      };
    } catch (error) {
      console.error('Error fetching client markup:', error);
      return {
        success: false,
        error: error.message,
        markup_percentage: 0.5,
        fixed_rate_amount: 0,
        isDefault: true
      };
    }
  }

  applyMarkup(value, markupPercentage) {
    const markupMultiplier = 1 + (markupPercentage / 100);
    const finalValue = parseFloat(value) * markupMultiplier;
    
    console.log(`💰 Aplicando markup:`);
    console.log(`   Valor original: ${value}`);
    console.log(`   Markup: ${markupPercentage}%`);
    console.log(`   Multiplicador: ${markupMultiplier}`);
    console.log(`   Valor final: ${finalValue.toFixed(4)}`);
    
    return finalValue.toFixed(4);
  }

  async getClientMarkups(clientId) {
    try {
      const { data, error } = await this.supabase
        .from('client_markups')
        .select('*')
        .eq('client_id', clientId)
        .eq('active', true)
        .order('from_currency', { ascending: true })
        .order('to_currency', { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Error fetching client markups:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updateClientMarkup(clientId, fromCurrency, toCurrency, markupPercentage) {
    try {
      const { data: existing } = await this.supabase
        .from('client_markups')
        .select('id')
        .eq('client_id', clientId)
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .single();

      let result;
      if (existing) {
        result = await this.supabase
          .from('client_markups')
          .update({
            markup_percentage: markupPercentage,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await this.supabase
          .from('client_markups')
          .insert({
            client_id: clientId,
            from_currency: fromCurrency,
            to_currency: toCurrency,
            markup_percentage: markupPercentage,
            active: true
          })
          .select()
          .single();
      }

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error updating client markup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

const clientMarkupsService = new ClientMarkupsService();
module.exports = clientMarkupsService;

