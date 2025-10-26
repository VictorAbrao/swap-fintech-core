const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUSDCMarkupsToExistingClients() {
  try {
    console.log('🔍 Fetching all clients...');
    
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name');
    
    if (clientsError) {
      throw clientsError;
    }
    
    console.log(`✅ Found ${clients.length} clients`);
    
    for (const client of clients) {
      console.log(`\n📊 Processing client: ${client.name} (${client.id})`);
      
      const { data: existingMarkups, error: markupsError } = await supabase
        .from('client_markups')
        .select('from_currency, to_currency')
        .eq('client_id', client.id);
      
      if (markupsError) {
        console.error(`❌ Error fetching markups for client ${client.name}:`, markupsError);
        continue;
      }
      
      console.log(`   Found ${existingMarkups.length} existing markups`);
      
      const currencies = ['USD', 'EUR', 'GBP', 'USDT', 'USDC'];
      const markupsToCreate = [];
      
      for (const fromCurrency of currencies) {
        for (const toCurrency of currencies) {
          if (fromCurrency !== toCurrency) {
            const exists = existingMarkups.some(
              m => m.from_currency === fromCurrency && m.to_currency === toCurrency
            );
            
            if (!exists) {
              markupsToCreate.push({
                client_id: client.id,
                from_currency: fromCurrency,
                to_currency: toCurrency,
                markup_percentage: 0.005,
                fixed_rate_amount: 0.00,
                active: true
              });
            }
          }
        }
      }
      
      if (markupsToCreate.length > 0) {
        console.log(`   Creating ${markupsToCreate.length} missing markups...`);
        
        const { data: createdMarkups, error: createError } = await supabase
          .from('client_markups')
          .insert(markupsToCreate);
        
        if (createError) {
          console.error(`❌ Error creating markups for client ${client.name}:`, createError);
        } else {
          console.log(`   ✅ Created ${markupsToCreate.length} markups successfully`);
        }
      } else {
        console.log(`   ✅ All markups already exist for this client`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addUSDCMarkupsToExistingClients();

