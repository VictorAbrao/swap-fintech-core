const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function adjustUsdUsdtBalances() {
  try {
    console.log('🔄 Adjusting USD and USDT balances...');

    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Atualizar USD para 0
    const { error: usdError } = await supabase
      .from('wallets')
      .update({ 
        balance: 0,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('currency', 'USD');

    if (usdError) {
      console.error(`❌ Error updating USD wallet:`, usdError);
    } else {
      console.log(`✅ USD wallet updated to 0`);
    }

    // Atualizar USDT para 275
    const { error: usdtError } = await supabase
      .from('wallets')
      .update({ 
        balance: 275,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('currency', 'USDT');

    if (usdtError) {
      console.error(`❌ Error updating USDT wallet:`, usdtError);
    } else {
      console.log(`✅ USDT wallet updated to 275`);
    }

    console.log('\n✅ USD and USDT balances adjusted!');

  } catch (error) {
    console.error('❌ Error adjusting balances:', error);
  }
}

adjustUsdUsdtBalances();
