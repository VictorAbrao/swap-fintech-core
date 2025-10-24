const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseBalances() {
  try {
    console.log('🔍 Verifying database balances directly...');

    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Verificar saldos das carteiras
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('currency, balance')
      .eq('client_id', clientId);

    if (walletsError) {
      console.error('❌ Error fetching wallets:', walletsError);
      return;
    }

    console.log(`📊 Database balances for client ${clientId}:`);
    wallets.forEach(wallet => {
      console.log(`  ${wallet.currency}: ${wallet.balance}`);
    });

    // Verificar uso anual
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name, current_annual_usage_usdt')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('❌ Error fetching client:', clientError);
      return;
    }

    console.log(`📈 Annual usage: ${client.current_annual_usage_usdt} USDT`);

    // Verificar operações restantes
    const { data: operations, error: operationsError } = await supabase
      .from('operations_history')
      .select('operation_type, source_currency, target_currency, source_amount, target_amount, created_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (operationsError) {
      console.error('❌ Error fetching operations:', operationsError);
      return;
    }

    console.log(`\n📋 Remaining operations (${operations.length}):`);
    operations.forEach((op, index) => {
      console.log(`  ${index + 1}. ${op.operation_type}: ${op.source_amount} ${op.source_currency} → ${op.target_amount} ${op.target_currency}`);
    });

  } catch (error) {
    console.error('❌ Error verifying balances:', error);
  }
}

verifyDatabaseBalances();
