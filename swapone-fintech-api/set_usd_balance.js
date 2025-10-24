const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setUsdBalance() {
  try {
    console.log('🔄 Setting USD balance to +275...');

    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Atualizar apenas o saldo do USD
    const { error: walletError } = await supabase
      .from('wallets')
      .update({ 
        balance: 275,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', clientId)
      .eq('currency', 'USD');

    if (walletError) {
      console.error(`❌ Error updating USD wallet:`, walletError);
    } else {
      console.log(`✅ USD wallet updated to 275`);
    }

    console.log('\n✅ USD balance set to +275!');

  } catch (error) {
    console.error('❌ Error setting USD balance:', error);
  }
}

setUsdBalance();
