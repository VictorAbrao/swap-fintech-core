const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setReasonableBalances() {
  try {
    console.log('🔄 Setting reasonable balances...');

    const clientId = '3540fd26-9b18-4a88-b589-5cbac8378aa9';

    // Buscar operações restantes para calcular o que foi movimentado
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

    // Calcular movimentações
    let totalUsdtSpent = 0;
    let totalBrlReceived = 0;

    operations.forEach(op => {
      if (op.operation_type === 'fx_trade') {
        totalUsdtSpent += parseFloat(op.source_amount);
        totalBrlReceived += parseFloat(op.target_amount);
        console.log(`  📝 ${op.source_amount} USDT → ${op.target_amount} BRL`);
      }
    });

    console.log(`\n📊 Total movements:`);
    console.log(`  USDT spent: ${totalUsdtSpent}`);
    console.log(`  BRL received: ${totalBrlReceived}`);

    // Definir saldos razoáveis baseados nas movimentações
    // Assumindo que o cliente tinha saldo suficiente para fazer as operações
    const reasonableBalances = {
      'USD': 0,
      'EUR': 0,
      'GBP': 0,
      'USDT': 1000,  // Saldo razoável após gastar 275
      'BRL': totalBrlReceived,  // O que ele recebeu das conversões
      'USDC': 0
    };

    console.log(`\n💰 Setting reasonable balances:`);
    Object.entries(reasonableBalances).forEach(([currency, balance]) => {
      console.log(`  ${currency}: ${balance}`);
    });

    // Atualizar saldos das carteiras
    console.log(`\n🔄 Updating wallet balances...`);
    for (const [currency, balance] of Object.entries(reasonableBalances)) {
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
        current_annual_usage_usdt: totalUsdtSpent,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (usageError) {
      console.error(`❌ Error updating annual usage:`, usageError);
    } else {
      console.log(`✅ Annual usage updated to ${totalUsdtSpent} USDT`);
    }

    console.log('\n✅ Reasonable balances set!');

  } catch (error) {
    console.error('❌ Error setting reasonable balances:', error);
  }
}

setReasonableBalances();
