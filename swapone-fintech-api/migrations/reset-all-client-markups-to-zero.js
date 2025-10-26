const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetAllClientMarkupsToZero() {
  try {
    console.log('🔄 Resetting all client markups to zero...');
    
    const { data: allMarkups, error: fetchError } = await supabase
      .from('client_markups')
      .select('id, client_id, from_currency, to_currency, markup_percentage, fixed_rate_amount');
    
    if (fetchError) {
      throw fetchError;
    }
    
    console.log(`📊 Found ${allMarkups.length} total markups`);
    
    let updatedCount = 0;
    const groupedByClient = {};
    
    for (const markup of allMarkups) {
      const { error } = await supabase
        .from('client_markups')
        .update({
          markup_percentage: 0,
          fixed_rate_amount: 0
        })
        .eq('id', markup.id);
      
      if (!error) {
        updatedCount++;
        
        if (!groupedByClient[markup.client_id]) {
          groupedByClient[markup.client_id] = [];
        }
        groupedByClient[markup.client_id].push({
          ...markup,
          markup_percentage: 0,
          fixed_rate_amount: 0
        });
      }
    }
    
    console.log(`✅ Successfully updated ${updatedCount} markups to zero`);
    console.log('📊 Updated markups by client:');
    
    for (const [clientId, markups] of Object.entries(groupedByClient)) {
      console.log(`\n   Client: ${clientId}`);
      console.log(`   Markups: ${markups.length}`);
      if (markups.length > 0) {
        console.log(`   Sample: ${markups[0].from_currency} → ${markups[0].to_currency} (markup: 0%, fixed: 0)`);
      }
    }
    
    console.log('\n✅ All markups have been reset to zero!');
    
  } catch (error) {
    console.error('❌ Error resetting markups:', error);
    process.exit(1);
  }
}

resetAllClientMarkupsToZero();

