const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CLIENT_ID = 'bdf195ee-95a7-478f-a154-4ff0a3d88924';

async function checkDatabaseStructure() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check if client_markups table exists and its structure
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .eq('table_name', 'client_markups');
    
    if (tablesError) {
      console.log('⚠️ Could not check table structure:', tablesError.message);
    } else {
      console.log('📋 client_markups columns:');
      tables.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }
    
    // Try to create markups manually instead of using RPC
    console.log('🔄 Creating markups manually...');
    
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
    
    console.log(`📊 Creating ${markupsToCreate.length} markups...`);
    
    const { data: createdMarkups, error: createError } = await supabase
      .from('client_markups')
      .insert(markupsToCreate)
      .select();
    
    if (createError) {
      console.error('❌ Error creating markups:', createError);
    } else {
      console.log('✅ Markups created successfully:', createdMarkups.length);
    }
    
    // Now test the endpoint logic
    console.log('🔄 Testing endpoint logic...');
    
    const { data: markups, error: markupsError } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .order('from_currency')
      .order('to_currency');
    
    if (markupsError) {
      console.error('❌ Error fetching markups:', markupsError);
      return;
    }
    
    console.log('✅ Markups fetched successfully:', markups.length);
    
    const grouped = {
      USDT: markups.filter(m => m.from_currency === 'USDT'),
      USD: markups.filter(m => m.from_currency === 'USD'),
      EUR: markups.filter(m => m.from_currency === 'EUR'),
      GBP: markups.filter(m => m.from_currency === 'GBP')
    };
    
    console.log('📊 Grouped markups:', Object.keys(grouped).map(key => `${key}: ${grouped[key].length}`).join(', '));
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseStructure();
