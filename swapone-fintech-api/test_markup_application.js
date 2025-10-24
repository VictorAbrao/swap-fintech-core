const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
          markup_percentage: 0.5,
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
          markup_percentage: 0.5,
          isDefault: true
        };
      }

      return {
        success: true,
        markup_percentage: parseFloat(data.markup_percentage) || 0.5,
        isDefault: false,
        data: data
      };
    } catch (error) {
      console.error('Error fetching client markup:', error);
      return {
        success: false,
        error: error.message,
        markup_percentage: 0.5,
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
    console.log(`   Valor final: ${finalValue.toFixed(4)}`);
    
    return finalValue.toFixed(4);
  }
}

async function testMarkupApplication() {
  try {
    console.log('🧪 Testando aplicação de markup...');

    const clientMarkupsService = new ClientMarkupsService();
    const CLIENT_ID = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Simular dados do Braza
    const brazaData = {
      final_quotation: '5.4046',
      brl_quantity: '5.40',
      quote: '5.4035',
      vet: '5.400000'
    };

    console.log('\n📊 Dados originais do Braza:');
    console.log(`   final_quotation: ${brazaData.final_quotation}`);
    console.log(`   brl_quantity: ${brazaData.brl_quantity}`);
    console.log(`   quote: ${brazaData.quote}`);
    console.log(`   vet: ${brazaData.vet}`);

    // Testar para USDT → BRL
    const markupData = await clientMarkupsService.getClientMarkup(CLIENT_ID, 'USDT', 'BRL');
    
    console.log('\n📊 Markup encontrado:');
    console.log(`   Markup: ${markupData.markup_percentage}%`);
    console.log(`   É padrão: ${markupData.isDefault ? 'Sim' : 'Não'}`);

    // Aplicar markup
    const finalQuotationWithMarkup = clientMarkupsService.applyMarkup(
      brazaData.final_quotation, 
      markupData.markup_percentage
    );
    const brlQuantityWithMarkup = clientMarkupsService.applyMarkup(
      brazaData.brl_quantity, 
      markupData.markup_percentage
    );
    const quoteWithMarkup = clientMarkupsService.applyMarkup(
      brazaData.quote, 
      markupData.markup_percentage
    );
    const vetWithMarkup = clientMarkupsService.applyMarkup(
      brazaData.vet, 
      markupData.markup_percentage
    );

    console.log('\n📊 Valores com markup aplicado:');
    console.log(`   final_quotation: ${finalQuotationWithMarkup}`);
    console.log(`   brl_quantity: ${brlQuantityWithMarkup}`);
    console.log(`   quote: ${quoteWithMarkup}`);
    console.log(`   vet: ${vetWithMarkup}`);

    // Calcular diferença
    const originalValue = parseFloat(brazaData.brl_quantity);
    const markupValue = parseFloat(brlQuantityWithMarkup);
    const difference = markupValue - originalValue;
    const profitPercentage = (difference / originalValue) * 100;

    console.log('\n💰 Análise de profit:');
    console.log(`   Valor original: ${originalValue}`);
    console.log(`   Valor com markup: ${markupValue}`);
    console.log(`   Diferença: ${difference.toFixed(4)}`);
    console.log(`   Profit: ${profitPercentage.toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testMarkupApplication();
