const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function invertBalances() {
  try {
    console.log('🔄 Inverting balances...');

    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Buscar saldos atuais
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('currency, balance')
      .eq('client_id', clientId);

    if (walletsError) {
      console.error('❌ Error fetching wallets:', walletsError);
      return;
    }

    console.log(`📊 Current balances:`);
    wallets.forEach(wallet => {
      console.log(`  ${wallet.currency}: ${wallet.balance}`);
    });

    // Inverter os saldos
    console.log(`\n🔄 Inverting balances...`);
    for (const wallet of wallets) {
      const invertedBalance = parseFloat(wallet.balance) * -1;
      
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: invertedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('currency', wallet.currency);

      if (walletError) {
        console.error(`❌ Error updating ${wallet.currency} wallet:`, walletError);
      } else {
        console.log(`✅ ${wallet.currency}: ${wallet.balance} → ${invertedBalance}`);
      }
    }

    console.log('\n✅ Balances inverted successfully!');

  } catch (error) {
    console.error('❌ Error inverting balances:', error);
  }
}

invertBalances();
