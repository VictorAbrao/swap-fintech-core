require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearTables() {
  console.log('🧹 Starting table cleanup...');
  
  // Tabelas para limpar (exceto clients e users)
  const tablesToClear = [
    'operations_history',
    'wallets', 
    'webhooks_log',
    'braza_requests_log',
    'fx_rates',
    'client_markups'
  ];

  for (const table of tablesToClear) {
    try {
      console.log(`🗑️  Clearing table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.error(`❌ Error clearing ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} cleared successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception clearing ${table}:`, err.message);
    }
  }

  console.log('🎉 Table cleanup completed!');
  console.log('📊 Tables preserved: clients, users');
}

clearTables().catch(console.error);
