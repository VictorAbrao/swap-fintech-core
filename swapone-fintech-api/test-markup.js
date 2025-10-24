const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configure Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função de teste
const testClientMarkup = async () => {
  const clientId = 'bdf195ee-95a7-478f-a154-4ff0a3d88924';
  const fromCurrency = 'USD';
  const toCurrency = 'EUR';

  console.log('🔍 Testing getClientMarkup with:', {
    clientId,
    fromCurrency,
    toCurrency
  });

  try {
    const { data, error } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', clientId)
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('active', true)
      .single();

    console.log('🔍 Query result:', {
      data,
      error: error?.code || 'none'
    });

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching client markup:', error);
      return;
    }

    const result = data || {
      markup_percentage: 0,
      fixed_rate_amount: 0
    };

    console.log('🔍 Final result:', result);
    return result;
  } catch (error) {
    console.error('Error in testClientMarkup:', error);
    return {
      markup_percentage: 0,
      fixed_rate_amount: 0
    };
  }
};

// Executar teste
testClientMarkup().then(result => {
  console.log('✅ Test completed:', result);
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
