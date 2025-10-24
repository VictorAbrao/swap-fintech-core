const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteLastThreeOperations() {
  try {
    console.log('🔄 Deleting last 3 operations...');

    // 1. Buscar as últimas 3 operações
    const { data: operations, error: fetchError } = await supabase
      .from('operations_history')
      .select(`
        *,
        clients!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(3);

    if (fetchError) {
      console.error('❌ Error fetching operations:', fetchError);
      return;
    }

    if (!operations || operations.length === 0) {
      console.log('ℹ️ No operations found');
      return;
    }

    console.log(`📋 Found ${operations.length} operations to delete:`);
    operations.forEach((op, index) => {
      console.log(`${index + 1}. ID: ${op.id}, Client: ${op.clients.name}, Type: ${op.operation_type}, Amount: ${op.source_amount} ${op.source_currency} → ${op.target_amount} ${op.target_currency}, Date: ${op.created_at}`);
    });

    // 2. Processar cada operação
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      console.log(`\n🔄 Processing operation ${i + 1}/${operations.length}: ID ${operation.id}`);

      const clientId = operation.client_id;
      const sourceCurrency = operation.source_currency;
      const targetCurrency = operation.target_currency;
      const sourceAmount = parseFloat(operation.source_amount);
      const targetAmount = parseFloat(operation.target_amount);

      // 3. Reverter saldos das carteiras
      console.log(`💰 Reverting wallet balances...`);

      // Reverter carteira origem (adicionar de volta o que foi subtraído)
      const { data: sourceWallet, error: sourceWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('client_id', clientId)
        .eq('currency', sourceCurrency)
        .single();

      if (sourceWalletError) {
        console.error(`❌ Error fetching source wallet:`, sourceWalletError);
        continue;
      }

      const newSourceBalance = parseFloat(sourceWallet.balance) + sourceAmount;
      const { error: sourceUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newSourceBalance })
        .eq('client_id', clientId)
        .eq('currency', sourceCurrency);

      if (sourceUpdateError) {
        console.error(`❌ Error updating source wallet:`, sourceUpdateError);
        continue;
      }

      console.log(`✅ Source wallet updated: ${sourceCurrency} ${sourceWallet.balance} → ${newSourceBalance}`);

      // Reverter carteira destino (subtrair o que foi adicionado)
      const { data: targetWallet, error: targetWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('client_id', clientId)
        .eq('currency', targetCurrency)
        .single();

      if (targetWalletError) {
        console.error(`❌ Error fetching target wallet:`, targetWalletError);
        continue;
      }

      const newTargetBalance = parseFloat(targetWallet.balance) - targetAmount;
      const { error: targetUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newTargetBalance })
        .eq('client_id', clientId)
        .eq('currency', targetCurrency);

      if (targetUpdateError) {
        console.error(`❌ Error updating target wallet:`, targetUpdateError);
        continue;
      }

      console.log(`✅ Target wallet updated: ${targetCurrency} ${targetWallet.balance} → ${newTargetBalance}`);

      // 4. Reverter uso anual (subtrair o valor da operação)
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('current_annual_usage_usdt')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error(`❌ Error fetching client:`, clientError);
        continue;
      }

      const newAnnualUsage = parseFloat(client.current_annual_usage_usdt) - sourceAmount;
      const { error: usageUpdateError } = await supabase
        .from('clients')
        .update({ current_annual_usage_usdt: newAnnualUsage })
        .eq('id', clientId);

      if (usageUpdateError) {
        console.error(`❌ Error updating annual usage:`, usageUpdateError);
        continue;
      }

      console.log(`✅ Annual usage updated: ${client.current_annual_usage_usdt} → ${newAnnualUsage} USDT`);

      // 5. Deletar a operação
      const { error: deleteError } = await supabase
        .from('operations_history')
        .delete()
        .eq('id', operation.id);

      if (deleteError) {
        console.error(`❌ Error deleting operation ${operation.id}:`, deleteError);
        continue;
      }

      console.log(`✅ Operation ${operation.id} deleted successfully`);
    }

    console.log('\n✅ Last 3 operations deleted and balances corrected successfully!');

  } catch (error) {
    console.error('❌ Error deleting operations:', error);
  }
}

deleteLastThreeOperations();
