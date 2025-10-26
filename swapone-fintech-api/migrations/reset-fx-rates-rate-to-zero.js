const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetFXRatesRateToZero() {
  try {
    console.log('🔄 Resetting all FX rates rate to zero (markup)...');
    
    const { data: allRates, error: fetchError } = await supabase
      .from('fx_rates')
      .select('id, from_currency, to_currency, rate, spread_bps');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 Found ${allRates.length} total FX rates`);
    
    if (allRates.length === 0) {
      console.log('✅ No FX rates to update');
      return;
    }
    
    const batchSize = 50;
    let updatedCount = 0;
    
    for (let i = 0; i < allRates.length; i += batchSize) {
      const batch = allRates.slice(i, i + batchSize);
      const ids = batch.map(r => r.id);
      
      const { error: batchError } = await supabase
        .from('fx_rates')
        .update({
          rate: 0,
          spread_bps: 0
        })
        .in('id', ids);
      
      if (batchError) {
        console.error(`❌ Error updating batch ${i / batchSize + 1}:`, batchError);
      } else {
        updatedCount += batch.length;
        console.log(`✅ Updated batch ${i / batchSize + 1}/${Math.ceil(allRates.length / batchSize)} (${updatedCount}/${allRates.length})`);
      }
    }
    
    console.log(`\n✅ Successfully reset ${updatedCount} FX rates rate and spread_bps to zero`);
    
    const currencyPairs = {};
    allRates.forEach(rate => {
      const pair = `${rate.from_currency}/${rate.to_currency}`;
      if (!currencyPairs[pair]) {
        currencyPairs[pair] = 0;
      }
      currencyPairs[pair]++;
    });
    
    console.log('\n📊 Summary by currency pairs:');
    for (const [pair, count] of Object.entries(currencyPairs)) {
      console.log(`   ${pair}: ${count} rate(s) - rate: 0, spread_bps: 0`);
    }
    
    console.log('\n✅ All FX rates have been reset to zero!');
    
  } catch (error) {
    console.error('❌ Error resetting FX rates:', error);
    process.exit(1);
  }
}

resetFXRatesRateToZero();

