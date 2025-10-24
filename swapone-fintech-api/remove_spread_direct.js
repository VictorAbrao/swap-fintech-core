const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeSpreadColumns() {
  console.log('🔄 Removing spread_percentage columns...');
  
  try {
    // Remove from client_markups
    const { error: clientMarkupsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE client_markups DROP COLUMN IF EXISTS spread_percentage;'
    });
    
    if (clientMarkupsError) {
      console.log('⚠️ client_markups error (may already be removed):', clientMarkupsError.message);
    } else {
      console.log('✅ Removed spread_percentage from client_markups');
    }
    
    // Remove from operations_history
    const { error: operationsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE operations_history DROP COLUMN IF EXISTS spread_percentage;'
    });
    
    if (operationsError) {
      console.log('⚠️ operations_history error (may already be removed):', operationsError.message);
    } else {
      console.log('✅ Removed spread_percentage from operations_history');
    }
    
    console.log('✅ Spread removal completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

removeSpreadColumns();
