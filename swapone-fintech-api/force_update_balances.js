const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function forceUpdateBalances() {
  try {
    console.log('🔄 Force updating balances...');

    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Forçar atualização dos saldos baseados nas operações restantes
    const { data: operations, error: operationsError } = await supabase
      .from('operations_history')
      .select('operation_type, source_currency, target_currency, source_amount, target_amount')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (operationsError) {
      console.error('❌ Error fetching operations:', operationsError);
      return;
    }

    console.log(`📋 Found ${operations.length} operations`);

    // Calcular saldos corretos
    const walletBalances = {
      'USD': 0,
      'EUR': 0,
      'GBP': 0,
      'USDT': 0,
      'BRL': 0,
      'USDC': 0
    };

    let totalAnnualUsage = 0;

    operations.forEach(op => {
      console.log(`  📝 ${op.operation_type}: ${op.source_amount} ${op.source_currency} → ${op.target_amount} ${op.target_currency}`);
      
      // Aplicar lógica baseada no tipo de operação
      switch (op.operation_type) {
        case 'fx_trade':
        case 'conversion':
          // Conversão: subtrai origem, adiciona destino
          walletBalances[op.source_currency] -= parseFloat(op.source_amount);
          walletBalances[op.target_currency] += parseFloat(op.target_amount);
          // Contar para uso anual (valor em USDT)
          if (op.source_currency === 'USDT') {
            totalAnnualUsage += parseFloat(op.source_amount);
          }
          break;
      }
    });

    console.log(`\n💰 Calculated balances:`);
    Object.entries(walletBalances).forEach(([currency, balance]) => {
      console.log(`  ${currency}: ${balance}`);
    });
    console.log(`📈 Calculated annual usage: ${totalAnnualUsage} USDT`);

    // Atualizar saldos das carteiras
    console.log(`\n🔄 Updating wallet balances...`);
    for (const [currency, balance] of Object.entries(walletBalances)) {
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          balance: balance,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId)
        .eq('currency', currency);

      if (walletError) {
        console.error(`❌ Error updating ${currency} wallet:`, walletError);
      } else {
        console.log(`✅ ${currency} wallet updated to ${balance}`);
      }
    }

    // Atualizar uso anual
    console.log(`\n🔄 Updating annual usage...`);
    const { error: usageError } = await supabase
      .from('clients')
      .update({ 
        current_annual_usage_usdt: totalAnnualUsage,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (usageError) {
      console.error(`❌ Error updating annual usage:`, usageError);
    } else {
      console.log(`✅ Annual usage updated to ${totalAnnualUsage} USDT`);
    }

    console.log('\n✅ Force update completed!');

  } catch (error) {
    console.error('❌ Error force updating balances:', error);
  }
}

forceUpdateBalances();
