const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeSpreadColumn() {
  try {
    console.log('🔄 Removing spread_percentage column from client_markups table...');

    // Primeiro, vamos verificar se a coluna existe
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'client_markups' });

    if (columnsError) {
      console.log('⚠️ Could not check columns, proceeding with removal...');
    } else {
      console.log('📊 Current columns:', columns);
    }

    // Remover a coluna spread_percentage
    const { error: dropError } = await supabase
      .rpc('drop_column_if_exists', { 
        table_name: 'client_markups',
        column_name: 'spread_percentage'
      });

    if (dropError) {
      console.error('❌ Error removing spread_percentage column:', dropError);
      console.log('💡 You may need to run this SQL manually in Supabase:');
      console.log('   ALTER TABLE client_markups DROP COLUMN IF EXISTS spread_percentage;');
    } else {
      console.log('✅ spread_percentage column removed successfully!');
    }

    // Verificar se ainda há dados com spread_percentage em operations_history
    console.log('\n🔄 Checking operations_history table...');
    const { data: operations, error: operationsError } = await supabase
      .from('operations_history')
      .select('id, spread_percentage')
      .not('spread_percentage', 'is', null)
      .limit(5);

    if (operationsError) {
      console.log('⚠️ Could not check operations_history table');
    } else if (operations && operations.length > 0) {
      console.log(`📊 Found ${operations.length} operations with spread_percentage`);
      console.log('💡 Consider updating these records or removing the column from operations_history as well');
    } else {
      console.log('✅ No operations found with spread_percentage');
    }

    console.log('\n✅ Spread removal process completed!');

  } catch (error) {
    console.error('❌ Error removing spread column:', error);
  }
}

removeSpreadColumn();
