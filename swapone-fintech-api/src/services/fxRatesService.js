const { createClient } = require('@supabase/supabase-js');
const brazaBankService = require('./brazaBankService');
const clientMarkupsService = require('./clientMarkupsService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class FxRatesService {
  /**
   * Buscar todas as taxas FX ativas
   */
  async getAllRates() {
    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('*')
        .eq('active', true)
        .order('from_currency', { ascending: true });

      if (error) {
        console.error('Error fetching FX rates:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch FX rates:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar taxa específica para um par de moedas
   */
  async getRate(fromCurrency, toCurrency) {
    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .select('*')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching FX rate:', error);
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to fetch FX rate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Criar ou atualizar taxa FX
   */
  async upsertRate(rateData) {
    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .upsert({
          from_currency: rateData.from_currency,
          to_currency: rateData.to_currency,
          rate: parseFloat(rateData.rate),
          spread_bps: parseInt(rateData.spread_bps) || 0,
          active: rateData.active !== false,
          fixed_rate_amount: parseFloat(rateData.fixed_rate_amount) || 0
        }, {
          onConflict: 'from_currency,to_currency',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error upserting FX rate:', error);
        throw error;
      }

      console.log(`✅ FX Rate updated: ${rateData.from_currency}/${rateData.to_currency} = ${rateData.rate}`);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to upsert FX rate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualizar taxa FX
   */
  async updateRate(fromCurrency, toCurrency, updateData) {
    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .update(updateData)
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .select()
        .single();

      if (error) {
        console.error('Error updating FX rate:', error);
        throw error;
      }

      console.log(`✅ FX Rate updated: ${fromCurrency}/${toCurrency}`, updateData);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to update FX rate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Desativar taxa FX
   */
  async deactivateRate(fromCurrency, toCurrency) {
    try {
      const { data, error } = await supabase
        .from('fx_rates')
        .update({ active: false })
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating FX rate:', error);
        throw error;
      }

      console.log(`✅ FX Rate deactivated: ${fromCurrency}/${toCurrency}`);
      return { success: true, data };
    } catch (error) {
      console.error('Failed to deactivate FX rate:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcular taxa final com spread aplicado
   */
  calculateFinalRate(baseRate, spreadBps, operation = 'buy') {
    const spreadDecimal = spreadBps / 10000; // Converter basis points para decimal
    
    if (operation === 'buy') {
      // Para compra: taxa base + spread (cliente paga mais)
      return baseRate * (1 + spreadDecimal);
    } else {
      // Para venda: taxa base - spread (cliente recebe menos)
      return baseRate * (1 - spreadDecimal);
    }
  }

  /**
   * Calcular valor convertido usando Braza Bank + nosso markup
   */
  async calculateConversion(fromCurrency, toCurrency, amount, operation = 'buy', clientId = null) {
    try {
      // 1. Obter cotação do Braza Bank
      console.log(`🔄 Getting Braza Bank quotation for ${fromCurrency}/${toCurrency} - ${amount} ${operation}`);
      
      const brazaResult = await brazaBankService.getPreviewQuotation(fromCurrency, amount, operation, null, null, `fx-rate-${Date.now()}`);
      
      if (!brazaResult.success) {
        console.error('❌ Braza Bank quotation failed:', brazaResult.error);
        return { 
          success: false, 
          error: `Braza Bank quotation failed: ${brazaResult.error}` 
        };
      }

      const brazaData = brazaResult.data;
      console.log(`✅ Braza Bank quotation: ${brazaData.vet} BRL for ${amount} ${fromCurrency}`);
      console.log('🔍 Debug brazaData from Braza Bank:', {
        brazaData,
        id: brazaData.id,
        idType: typeof brazaData.id,
        hasId: 'id' in brazaData
      });

      // 2. Obter taxa base do sistema (fx_rates) + markup do cliente
      // SEMPRE usar o markup direto (USDT→BRL) independente da operação
      let markupFromCurrency = fromCurrency;
      let markupToCurrency = toCurrency;
      
      console.log(`🔄 Using direct markup ${markupFromCurrency}→${markupToCurrency} for ${operation} operation`);
      
      // 2.1. Obter taxa base do sistema (fx_rates)
      const fxRateResult = await this.getRate(markupFromCurrency, markupToCurrency);
      let systemRate = 0;
      let systemSpreadBps = 0;
      let systemFixedRateAmount = 0;
      
      if (fxRateResult.success && fxRateResult.data) {
        systemRate = parseFloat(fxRateResult.data.rate) || 0;
        systemSpreadBps = parseInt(fxRateResult.data.spread_bps) || 0;
        systemFixedRateAmount = parseFloat(fxRateResult.data.fixed_rate_amount) || 0;
        console.log(`📊 System rate from fx_rates: ${systemRate}%, spread: ${systemSpreadBps}bps, fixed: ${systemFixedRateAmount}`);
      } else {
        console.log(`⚠️ No system rate found in fx_rates for ${markupFromCurrency}/${markupToCurrency}`);
      }
      
      // 2.2. Obter markup específico do cliente
      const markupData = await clientMarkupsService.getClientMarkup(clientId, markupFromCurrency, markupToCurrency);
      let clientMarkupPercentage = 0;
      let clientFixedRateAmount = 0;
      
      if (markupData.success) {
        clientMarkupPercentage = markupData.markup_percentage;
        clientFixedRateAmount = markupData.fixed_rate_amount || 0;
        console.log(`📊 Client markup from client_markups: ${clientMarkupPercentage}%`);
        console.log(`📊 Client fixed rate amount: ${clientFixedRateAmount} ${markupToCurrency}`);
      } else {
        console.log(`⚠️ No client markup found for ${markupFromCurrency}/${markupToCurrency}`);
      }

      // 3. Calcular taxa final: Braza + Sistema + Cliente
      const totalMarkupPercentage = systemRate + clientMarkupPercentage;
      
      // SEMPRE usar a taxa do Braza Bank como base
      const baseRate = parseFloat(brazaData.final_quotation);
      console.log(`📊 Always using Braza Bank final_quotation as base: ${baseRate}`);
      
      // Usar a mesma taxa para compra e venda (cálculo igual)
      let workingRate = baseRate;
      console.log(`🔍 Operation: ${operation}, Base rate: ${baseRate}`);
      
      // Aplicar markup total (sistema + cliente) sobre a taxa
      let finalRate = workingRate;
      if (totalMarkupPercentage && parseFloat(totalMarkupPercentage) > 0) {
        finalRate = clientMarkupsService.applyMarkup(workingRate, totalMarkupPercentage);
        console.log(`📈 Applied total markup (system: ${systemRate}% + client: ${clientMarkupPercentage}% = ${totalMarkupPercentage}%): ${workingRate} + ${totalMarkupPercentage}% = ${finalRate}`);
      }
      
      // Aplicar spread do sistema se houver (igual para compra e venda)
      if (systemSpreadBps && systemSpreadBps > 0) {
        const spreadDecimal = systemSpreadBps / 10000;
        finalRate = finalRate * (1 + spreadDecimal);
        console.log(`💰 Applied system spread: ${finalRate / (1 + spreadDecimal)} + ${systemSpreadBps}bps = ${finalRate} (${operation})`);
      }
      
      // Calcular valor base com markup percentual
      let convertedAmount = parseFloat(amount) * finalRate;
      
      // Adicionar taxa fixa quando aplicável (sistema + cliente) - igual para compra e venda
      const totalFixedRateAmount = systemFixedRateAmount + clientFixedRateAmount;
      if (totalFixedRateAmount && totalFixedRateAmount > 0) {
        // Converter taxa fixa de USDT para BRL usando a taxa base (sem markup)
        const fixedRateInBrl = totalFixedRateAmount * parseFloat(brazaData.final_quotation);
        convertedAmount += fixedRateInBrl;
        console.log(`💰 Added fixed rate amount: ${totalFixedRateAmount} USDT → ${fixedRateInBrl} BRL (using base rate: ${brazaData.final_quotation}) = ${convertedAmount} (${operation})`);
      }

      return {
        success: true,
        data: {
          from_currency: fromCurrency,
          to_currency: toCurrency,
          amount: parseFloat(amount),
          braza_rate: parseFloat(brazaData.final_quotation),
          base_rate: parseFloat(brazaData.final_quotation),
          markup_percentage: totalMarkupPercentage || 0,
          fixed_rate_amount: totalFixedRateAmount || 0,
          final_rate: finalRate,
          converted_amount: convertedAmount,
          operation: operation,
          braza_order_id: brazaData.id,
          // Manter braza_data para uso interno da plataforma (criação de operações, logs, etc)
          braza_data: brazaData
        }
      };
    } catch (error) {
      console.error('Failed to calculate conversion:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new FxRatesService();
