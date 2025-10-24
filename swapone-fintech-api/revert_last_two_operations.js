const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function revertLastTwoOperations() {
  try {
    console.log('🔄 Reverting last 2 FX Trade operations...');

    // 1. Buscar as últimas 2 operações FX Trade
    const { data: operations, error: fetchError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('operation_type', 'fx_trade')
      .order('created_at', { ascending: false })
      .limit(2);

    if (fetchError) {
      console.error('❌ Error fetching operations:', fetchError);
      return;
    }

    if (!operations || operations.length === 0) {
      console.log('ℹ️ No FX Trade operations found');
      return;
    }

    console.log(`📋 Found ${operations.length} operations to revert`);

    // 2. Processar cada operação
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      console.log(`\n🔄 Reverting operation ${i + 1}/${operations.length}:`, {
        id: operation.id,
        client_id: operation.client_id,
        source_currency: operation.source_currency,
        target_currency: operation.target_currency,
        source_amount: operation.source_amount,
        target_amount: operation.target_amount,
        created_at: operation.created_at
      });

      // 3. Deletar a operação
      const { error: deleteError } = await supabase
        .from('operations_history')
        .delete()
        .eq('id', operation.id);

      if (deleteError) {
        console.error(`❌ Error deleting operation ${operation.id}:`, deleteError);
        continue;
      }

      console.log(`✅ Operation ${operation.id} deleted`);

      // 4. Reverter saldos das carteiras
      const clientId = operation.client_id;
      const sourceCurrency = operation.source_currency;
      const targetCurrency = operation.target_currency;
      const sourceAmount = parseFloat(operation.source_amount);
      const targetAmount = parseFloat(operation.target_amount);

      // Reverter carteira origem (subtrair o que foi adicionado)
      const { data: sourceWallet, error: sourceWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('client_id', clientId)
        .eq('currency', sourceCurrency)
        .single();

      if (sourceWalletError) {
        console.error(`❌ Error fetching source wallet for operation ${operation.id}:`, sourceWalletError);
        continue;
      }

      const newSourceBalance = parseFloat(sourceWallet.balance) - sourceAmount;
      const { error: sourceUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newSourceBalance })
        .eq('client_id', clientId)
        .eq('currency', sourceCurrency);

      if (sourceUpdateError) {
        console.error(`❌ Error updating source wallet for operation ${operation.id}:`, sourceUpdateError);
        continue;
      }

      console.log(`💰 Source wallet updated: ${sourceCurrency} ${sourceWallet.balance} → ${newSourceBalance}`);

      // Reverter carteira destino (adicionar o que foi subtraído)
      const { data: targetWallet, error: targetWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('client_id', clientId)
        .eq('currency', targetCurrency)
        .single();

      if (targetWalletError) {
        console.error(`❌ Error fetching target wallet for operation ${operation.id}:`, targetWalletError);
        continue;
      }

      const newTargetBalance = parseFloat(targetWallet.balance) + targetAmount;
      const { error: targetUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newTargetBalance })
        .eq('client_id', clientId)
        .eq('currency', targetCurrency);

      if (targetUpdateError) {
        console.error(`❌ Error updating target wallet for operation ${operation.id}:`, targetUpdateError);
        continue;
      }

      console.log(`💰 Target wallet updated: ${targetCurrency} ${targetWallet.balance} → ${newTargetBalance}`);

      // 5. Reverter uso anual
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('current_annual_usage_usdt')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error(`❌ Error fetching client for operation ${operation.id}:`, clientError);
        continue;
      }

      const newAnnualUsage = parseFloat(client.current_annual_usage_usdt) - sourceAmount;
      const { error: usageUpdateError } = await supabase
        .from('clients')
        .update({ current_annual_usage_usdt: newAnnualUsage })
        .eq('id', clientId);

      if (usageUpdateError) {
        console.error(`❌ Error updating annual usage for operation ${operation.id}:`, usageUpdateError);
        continue;
      }

      console.log(`📈 Annual usage updated: ${client.current_annual_usage_usdt} → ${newAnnualUsage} USDT`);
    }

    console.log('\n✅ Last 2 operations reverted successfully!');

  } catch (error) {
    console.error('❌ Error reverting operations:', error);
  }
}

revertLastTwoOperations();
