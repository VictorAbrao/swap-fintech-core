const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class ClientLimitsService {
  /**
   * Verifica se o cliente pode realizar uma operação baseado no limite anual
   * @param {string} clientId - ID do cliente
   * @param {number} amountBrl - Valor da operação em BRL
   * @returns {Object} - Resultado da verificação
   */
  async checkAnnualLimit(clientId, amountBrl) {
    try {
      console.log(`🔍 Checking annual limit for client ${clientId}, amount: ${amountBrl} BRL`);

      // Buscar informações do cliente
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name, annual_transaction_limit_usdt, current_annual_usage_usdt, annual_limit_reset_date, limit_currency')
        .eq('id', clientId)
        .single();

      if (clientError || !client) {
        console.error('❌ Error fetching client:', clientError?.message);
        return {
          success: false,
          error: 'Client not found',
          message: 'Cliente não encontrado'
        };
      }

      // Verificar se o limite anual foi resetado
      const currentDate = new Date();
      const resetDate = new Date(client.annual_limit_reset_date);
      
      if (currentDate.getFullYear() > resetDate.getFullYear()) {
        console.log(`🔄 Annual limit reset for client ${clientId}`);
        await this.resetAnnualLimit(clientId);
        client.current_annual_usage_usdt = 0;
      }

      const currentUsage = parseFloat(client.current_annual_usage_usdt || 0);
      const annualLimit = parseFloat(client.annual_transaction_limit_usdt || 0);
      const requestedAmount = parseFloat(amountBrl);

      console.log(`📊 Client ${client.name}:`);
      console.log(`   Annual Limit: ${annualLimit} BRL`);
      console.log(`   Current Usage: ${currentUsage} BRL`);
      console.log(`   Requested Amount: ${requestedAmount} BRL`);
      console.log(`   Available: ${annualLimit - currentUsage} BRL`);

      // Verificar se há limite suficiente
      if (annualLimit === 0) {
        console.log(`⚠️ No annual limit set for client ${clientId}`);
        return {
          success: true,
          canProceed: true,
          message: 'No annual limit set',
          limitInfo: {
            annualLimit: annualLimit,
            currentUsage: currentUsage,
            requestedAmount: requestedAmount,
            available: annualLimit - currentUsage
          }
        };
      }

      if (currentUsage + requestedAmount > annualLimit) {
        console.log(`❌ Annual limit exceeded for client ${clientId}`);
        return {
          success: true,
          canProceed: false,
          error: 'Annual limit exceeded',
          message: `Limite anual excedido. Disponível: ${annualLimit - currentUsage} BRL`,
          limitInfo: {
            annualLimit: annualLimit,
            currentUsage: currentUsage,
            requestedAmount: requestedAmount,
            available: annualLimit - currentUsage
          }
        };
      }

      console.log(`✅ Annual limit check passed for client ${clientId}`);
      return {
        success: true,
        canProceed: true,
        message: 'Limit check passed',
        limitInfo: {
          annualLimit: annualLimit,
          currentUsage: currentUsage,
          requestedAmount: requestedAmount,
          available: annualLimit - currentUsage
        }
      };

    } catch (error) {
      console.error('❌ Error checking annual limit:', error);
      return {
        success: false,
        error: 'Internal error',
        message: 'Erro interno ao verificar limite'
      };
    }
  }

  /**
   * Atualiza o uso anual do cliente após uma operação
   * @param {string} clientId - ID do cliente
   * @param {number} amountBrl - Valor da operação em BRL
   * @returns {Object} - Resultado da atualização
   */
  async updateAnnualUsage(clientId, amountBrl) {
    try {
      console.log(`📈 Updating annual usage for client ${clientId}, amount: ${amountBrl} BRL`);

      // Primeiro, buscar o uso atual
      const { data: client, error: fetchError } = await supabase
        .from('clients')
        .select('current_annual_usage_usdt')
        .eq('id', clientId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current usage:', fetchError);
        return {
          success: false,
          error: fetchError.message,
          message: 'Erro ao buscar uso atual'
        };
      }

      const currentUsage = parseFloat(client.current_annual_usage_usdt || 0);
      const newUsage = currentUsage + parseFloat(amountBrl);

      // Atualizar o uso
      const { data, error } = await supabase
        .from('clients')
        .update({
          current_annual_usage_usdt: newUsage,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select('id, name, current_annual_usage_usdt, annual_transaction_limit_usdt')
        .single();

      if (error) {
        console.error('❌ Error updating annual usage:', error);
        return {
          success: false,
          error: error.message,
          message: 'Erro ao atualizar uso anual'
        };
      }

      console.log(`✅ Annual usage updated for client ${data.name}: ${data.current_annual_usage_usdt} BRL`);
      return {
        success: true,
        data: data,
        message: 'Annual usage updated successfully'
      };

    } catch (error) {
      console.error('❌ Error updating annual usage:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro interno ao atualizar uso anual'
      };
    }
  }

  /**
   * Reseta o limite anual do cliente
   * @param {string} clientId - ID do cliente
   * @returns {Object} - Resultado do reset
   */
  async resetAnnualLimit(clientId) {
    try {
      console.log(`🔄 Resetting annual limit for client ${clientId}`);

      const { data, error } = await supabase
        .from('clients')
        .update({
          current_annual_usage_usdt: 0,
          annual_limit_reset_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)
        .select('id, name, current_annual_usage_usdt, annual_limit_reset_date')
        .single();

      if (error) {
        console.error('❌ Error resetting annual limit:', error);
        return {
          success: false,
          error: error.message,
          message: 'Erro ao resetar limite anual'
        };
      }

      console.log(`✅ Annual limit reset for client ${data.name}`);
      return {
        success: true,
        data: data,
        message: 'Annual limit reset successfully'
      };

    } catch (error) {
      console.error('❌ Error resetting annual limit:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro interno ao resetar limite anual'
      };
    }
  }

  /**
   * Converte valor de uma moeda para BRL para cálculo de limite
   * @param {number} amount - Valor da operação
   * @param {string} fromCurrency - Moeda de origem
   * @param {string} toCurrency - Moeda de destino
   * @param {number} exchangeRate - Taxa de câmbio atual (opcional)
   * @returns {number} - Valor equivalente em BRL
   */
  async convertToBrlForLimit(amount, fromCurrency, toCurrency, exchangeRate = null) {
    try {
      // Se já é BRL, retorna o valor
      if (fromCurrency === 'BRL') {
        return parseFloat(amount);
      }

      // Se temos uma taxa de câmbio específica, usar ela
      if (exchangeRate && exchangeRate > 0) {
        let brlAmount;
        
        if (fromCurrency === 'USDT' && toCurrency === 'BRL') {
          // Compra de USDT: amount USDT * exchangeRate = BRL
          brlAmount = parseFloat(amount) * parseFloat(exchangeRate);
        } else if (fromCurrency === 'BRL' && toCurrency === 'USDT') {
          // Venda de USDT: amount BRL / exchangeRate = USDT (mas queremos BRL)
          brlAmount = parseFloat(amount);
        } else {
          // Para outras moedas, usar taxa fixa
          brlAmount = parseFloat(amount) * parseFloat(exchangeRate);
        }
        
        console.log(`💱 Converted ${amount} ${fromCurrency} to ${brlAmount} BRL using exchange rate ${exchangeRate}`);
        return brlAmount;
      }

      // Fallback: usar taxas fixas aproximadas
      const conversionRates = {
        'USD': 5.4,
        'EUR': 5.8,
        'GBP': 6.8,
        'USDT': 5.4,
        'USDC': 5.4
      };

      const rate = conversionRates[fromCurrency] || 1.0;
      const brlAmount = parseFloat(amount) * rate;

      console.log(`💱 Converted ${amount} ${fromCurrency} to ${brlAmount} BRL using fixed rate ${rate}`);
      return brlAmount;

    } catch (error) {
      console.error('❌ Error converting to BRL for limit:', error);
      return parseFloat(amount); // Fallback para o valor original
    }
  }
}

const clientLimitsService = new ClientLimitsService();

module.exports = clientLimitsService;
