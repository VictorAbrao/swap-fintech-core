const axios = require('axios');

const FASTFOREX_API_KEY = 'c347834b1b-9e587f8df9-t4i0so';
const FASTFOREX_BASE_URL = 'https://api.fastforex.io';

class FastForexService {
  /**
   * Obtém taxas de câmbio para múltiplas moedas
   * @param {string} fromCurrency - Moeda base
   * @param {string[]} toCurrencies - Array de moedas de destino
   * @returns {Promise<Object>} Taxas de câmbio
   */
  async getExchangeRates(fromCurrency, toCurrencies) {
    try {
      const toCurrenciesString = toCurrencies.join(',');
      const url = `${FASTFOREX_BASE_URL}/fetch-multi?from=${fromCurrency}&to=${toCurrenciesString}&api_key=${FASTFOREX_API_KEY}`;
      
      console.log(`🔄 Fetching exchange rates from FastForex: ${fromCurrency} → ${toCurrenciesString}`);
      
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SwapOne-Fintech-API/1.0'
        }
      });

      if (response.data && response.data.results) {
        console.log(`✅ FastForex rates received:`, response.data.results);
        return {
          success: true,
          data: {
            base: response.data.base,
            rates: response.data.results,
            updated: response.data.updated,
            ms: response.data.ms
          }
        };
      } else {
        throw new Error('Invalid response format from FastForex');
      }
    } catch (error) {
      console.error('❌ FastForex API Error:', error.message);
      
      // Fallback rates em caso de erro
      const fallbackRates = this.getFallbackRates(fromCurrency, toCurrencies);
      console.log(`🔄 Using fallback rates:`, fallbackRates);
      
      return {
        success: false,
        error: error.message,
        data: {
          base: fromCurrency,
          rates: fallbackRates,
          updated: new Date().toISOString(),
          ms: 0,
          fallback: true
        }
      };
    }
  }

  /**
   * Obtém taxa de câmbio para uma única moeda
   * @param {string} fromCurrency - Moeda base
   * @param {string} toCurrency - Moeda de destino
   * @returns {Promise<number>} Taxa de câmbio
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      const result = await this.getExchangeRates(fromCurrency, [toCurrency]);
      
      if (result.success || result.data.fallback) {
        return result.data.rates[toCurrency] || 1;
      }
      
      throw new Error('Failed to get exchange rate');
    } catch (error) {
      console.error('❌ Error getting single exchange rate:', error.message);
      return this.getFallbackRate(fromCurrency, toCurrency);
    }
  }

  /**
   * Taxas de fallback em caso de erro na API
   */
  getFallbackRates(fromCurrency, toCurrencies) {
    const fallbackRates = {
      'USDT': { 'USD': 1.0 },
      'USD': { 
        'EUR': 0.9200, 
        'GBP': 0.7800, 
        'USDT': 1.002 
      },
      'EUR': { 
        'USD': 1.0870, 
        'GBP': 0.8478 
      },
      'GBP': { 
        'USD': 1.2821, 
        'EUR': 1.1795 
      }
    };

    const rates = {};
    toCurrencies.forEach(toCurrency => {
      rates[toCurrency] = fallbackRates[fromCurrency]?.[toCurrency] || 1;
    });

    return rates;
  }

  getFallbackRate(fromCurrency, toCurrency) {
    return this.getFallbackRates(fromCurrency, [toCurrency])[toCurrency] || 1;
  }

  /**
   * Aplica markup do cliente à taxa de câmbio
   * @param {number} baseRate - Taxa base do FastForex
   * @param {number} markupPercentage - Percentual de markup do cliente
   * @returns {number} Taxa final com markup aplicado
   */
  applyClientMarkup(baseRate, markupPercentage = 0) {
    // Aplica markup
    const finalRate = baseRate * (1 + markupPercentage / 100);
    
    return finalRate;
  }

  /**
   * Calcula conversão com markup do cliente
   * @param {string} fromCurrency - Moeda origem
   * @param {string} toCurrency - Moeda destino
   * @param {number} amount - Quantidade
   * @param {Object} clientMarkup - Markup do cliente {markup_percentage}
   * @returns {Promise<Object>} Resultado da conversão
   */
  async calculateConversion(fromCurrency, toCurrency, amount, clientMarkup = {}) {
    try {
      // 1. Obter taxa base do FastForex
      const baseRate = await this.getExchangeRate(fromCurrency, toCurrency);
      
      // 2. Aplicar markup do cliente
      const finalRate = this.applyClientMarkup(
        baseRate, 
        clientMarkup.markup_percentage || 0
      );
      
      // 3. Calcular valor final
      const finalAmount = amount * finalRate;
      
      return {
        success: true,
        data: {
          fromCurrency,
          toCurrency,
          amount,
          baseRate,
          finalRate,
          finalAmount,
          markupApplied: {
            markup_percentage: clientMarkup.markup_percentage || 0
          }
        }
      };
    } catch (error) {
      console.error('❌ Error calculating conversion:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new FastForexService();
