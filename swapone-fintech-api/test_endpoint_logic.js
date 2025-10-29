const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CLIENT_ID = 'bdf195ee-95a7-478f-a154-4ff0a3d88924';

async function testEndpointLogic() {
  console.log('🧪 Testing endpoint logic for client:', CLIENT_ID);
  
  try {
    // Simulate the exact logic from the endpoint
    console.log('🔍 Step 1: Fetching markups...');
    const { data: markups, error } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .order('from_currency')
      .order('to_currency');

    console.log('📊 Query result:', { markups: markups?.length, error: error?.message });

    if (error) {
      console.error('❌ Error in query:', error);
      return;
    }

    if (!markups || markups.length === 0) {
      console.log('🔄 No markups found, would create new ones...');
      return;
    }

    console.log('✅ Markups found:', markups.length);

    // Test the grouping logic
    console.log('🔍 Step 2: Testing grouping logic...');
    const grouped = {
      USDT: markups.filter(m => m.from_currency === 'USDT'),
      USD: markups.filter(m => m.from_currency === 'USD'),
      EUR: markups.filter(m => m.from_currency === 'EUR'),
      GBP: markups.filter(m => m.from_currency === 'GBP')
    };

    console.log('📊 Grouped results:');
    Object.keys(grouped).forEach(currency => {
      console.log(`  ${currency}: ${grouped[currency].length} markups`);
    });

    // Test the response structure
    console.log('🔍 Step 3: Testing response structure...');
    const response = {
      success: true,
      data: {
        markups: markups,
        grouped: grouped
      }
    };

    console.log('✅ Response structure created successfully');
    console.log('📊 Response size:', JSON.stringify(response).length, 'characters');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testEndpointLogic();



