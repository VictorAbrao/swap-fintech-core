const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAllClientMarkupsToZero() {
  try {
    console.log('🔄 Resetting all client markups to zero using SQL...');
    
    const { data: allMarkups, error: fetchError } = await supabase
      .from('client_markups')
      .select('id, client_id, from_currency, to_currency, markup_percentage, fixed_rate_amount');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 Found ${allMarkups.length} total markups`);
    
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: 'UPDATE client_markups SET markup_percentage = 0, fixed_rate_amount = 0'
    });
    
    if (updateError) {
      console.log('⚠️ Direct RPC failed, trying batch update...');
      
      const batchSize = 100;
      let updatedCount = 0;
      
      for (let i = 0; i < allMarkups.length; i += batchSize) {
        const batch = allMarkups.slice(i, i + batchSize);
        const ids = batch.map(m => m.id);
        
        const { error: batchError } = await supabase
          .from('client_markups')
          .update({
            markup_percentage: 0,
            fixed_rate_amount: 0
          })
          .in('id', ids);
        
        if (batchError) {
          console.error(`❌ Error updating batch ${i / batchSize + 1}:`, batchError);
        } else {
          updatedCount += batch.length;
          console.log(`✅ Updated batch ${i / batchSize + 1}/${Math.ceil(allMarkups.length / batchSize)} (${updatedCount}/${allMarkups.length})`);
        }
      }
      
      console.log(`\n✅ Successfully reset ${updatedCount} markups to zero`);
    } else {
      console.log(`\n✅ Successfully reset all ${allMarkups.length} markups to zero`);
    }
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');
    
    if (!clientsError) {
      console.log('\n📊 Summary by client:');
      for (const client of clients) {
        const clientMarkups = allMarkups.filter(m => m.client_id === client.id);
        console.log(`   ${client.name}: ${clientMarkups.length} markups`);
      }
    }
    
    console.log('\n✅ All markups have been reset to zero!');
    
  } catch (error) {
    console.error('❌ Error resetting markups:', error);
    process.exit(1);
  }
}

resetAllClientMarkupsToZero();

