const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CLIENT_ID = 'bdf195ee-95a7-478f-a154-4ff0a3d88924';

async function debugClientMarkups() {
  console.log('🔍 Debugging client markups for:', CLIENT_ID);
  
  try {
    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', CLIENT_ID)
      .single();
    
    if (clientError) {
      console.error('❌ Client not found:', clientError);
      return;
    }
    
    console.log('✅ Client found:', client.name);
    
    // Check existing markups
    console.log('🔍 Checking existing markups...');
    const { data: markups, error: markupsError } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', CLIENT_ID);
    
    if (markupsError) {
      console.error('❌ Error fetching markups:', markupsError);
      return;
    }
    
    console.log('📊 Existing markups count:', markups ? markups.length : 0);
    
    if (markups && markups.length > 0) {
      console.log('📋 Existing markups:');
      markups.forEach(markup => {
        console.log(`  - ${markup.from_currency} → ${markup.to_currency}: ${markup.markup_percentage}%`);
      });
    } else {
      console.log('🔄 No markups found, this should trigger creation...');
      
      // Test the creation logic
      console.log('🧪 Testing markup creation...');
      const currencies = ['USD', 'EUR', 'GBP', 'USDT'];
      const markupsToCreate = [];
      
      for (const fromCurrency of currencies) {
        for (const toCurrency of currencies) {
          if (fromCurrency !== toCurrency) {
            markupsToCreate.push({
              client_id: CLIENT_ID,
              from_currency: fromCurrency,
              to_currency: toCurrency,
              markup_percentage: 0.005, // 0.5% default
              active: true
            });
          }
        }
      }
      
      console.log(`📊 About to create ${markupsToCreate.length} markups...`);
      
      const { data: createdMarkups, error: createError } = await supabase
        .from('client_markups')
        .insert(markupsToCreate)
        .select();
      
      if (createError) {
        console.error('❌ Error creating markups:', createError);
      } else {
        console.log('✅ Markups created successfully:', createdMarkups.length);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugClientMarkups();
