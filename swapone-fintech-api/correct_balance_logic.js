const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function correctBalancesLogic() {
  try {
    console.log('🔄 Correcting balance logic...');

    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Buscar operações restantes
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

    // Calcular saldos corretos - LÓGICA CORRIGIDA
    const walletBalances = {
      'USD': 0,
      'EUR': 0,
      'GBP': 0,
      'USDT': 0,  // Começar com saldo positivo
      'BRL': 0,   // Começar com saldo positivo
      'USDC': 0
    };

    let totalAnnualUsage = 0;

    operations.forEach(op => {
      console.log(`  📝 ${op.operation_type}: ${op.source_amount} ${op.source_currency} → ${op.target_amount} ${op.target_currency}`);
      
      // LÓGICA CORRIGIDA: Para FX Trade, o cliente GASTA a moeda origem e RECEBE a moeda destino
      if (op.operation_type === 'fx_trade') {
        // Subtrair da moeda origem (o que foi gasto)
        walletBalances[op.source_currency] -= parseFloat(op.source_amount);
        // Adicionar à moeda destino (o que foi recebido)
        walletBalances[op.target_currency] += parseFloat(op.target_amount);
        
        // Contar para uso anual (valor em USDT gasto)
        if (op.source_currency === 'USDT') {
          totalAnnualUsage += parseFloat(op.source_amount);
        }
      }
    });

    console.log(`\n💰 Corrected balances:`);
    Object.entries(walletBalances).forEach(([currency, balance]) => {
      console.log(`  ${currency}: ${balance}`);
    });
    console.log(`📈 Annual usage: ${totalAnnualUsage} USDT`);

    // Atualizar saldos das carteiras
    console.log(`\n🔄 Updating wallet balances with correct logic...`);
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

    console.log('\n✅ Balance logic corrected!');

  } catch (error) {
    console.error('❌ Error correcting balance logic:', error);
  }
}

correctBalancesLogic();
