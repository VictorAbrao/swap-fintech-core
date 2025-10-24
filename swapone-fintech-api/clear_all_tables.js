require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearAllTables() {
  console.log('🧹 Starting comprehensive table cleanup...');
  
  // Lista de todas as tabelas conhecidas (exceto clients e users)
  const tablesToClear = [
    'operations_history',
    'wallets', 
    'braza_requests_log',
    'fx_rates',
    'client_markups',
    'webhooks', // Tentar diferentes nomes
    'webhook_logs',
    'webhook_notifications',
    'notifications',
    'transactions',
    'beneficiaries',
    'user_profiles'
  ];

  for (const table of tablesToClear) {
    try {
      console.log(`🗑️  Attempting to clear table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (error) {
        if (error.message.includes('Could not find the table')) {
          console.log(`⚠️  Table ${table} does not exist - skipping`);
        } else {
          console.error(`❌ Error clearing ${table}:`, error.message);
        }
      } else {
        console.log(`✅ Table ${table} cleared successfully`);
      }
    } catch (err) {
      console.error(`❌ Exception clearing ${table}:`, err.message);
    }
  }

  console.log('🎉 Comprehensive table cleanup completed!');
  console.log('📊 Tables preserved: clients, users');
  console.log('📊 Tables cleared: operations_history, wallets, braza_requests_log, fx_rates, client_markups');
}

clearAllTables().catch(console.error);
