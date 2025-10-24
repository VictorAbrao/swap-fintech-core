require('dotenv').config({ path: './swapone-fintech-api/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('📝 Reading migration file...');
    const sql = fs.readFileSync('./swapone-fintech-api/migrations/create_operations_history.sql', 'utf8');
    
    console.log('🚀 Applying migration to Supabase...');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('   Table operations_history created');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    console.log('\n📋 Você pode executar manualmente no Supabase SQL Editor:');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/sql');
    console.log('   2. Cole o SQL do arquivo: swapone-fintech-api/migrations/create_operations_history.sql');
    console.log('   3. Clique em Run');
  }
}

applyMigration();


