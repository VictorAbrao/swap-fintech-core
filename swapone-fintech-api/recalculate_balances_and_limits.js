const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculateBalancesAndLimits() {
  try {
    console.log('🔄 Recalculating balances and limits based on remaining operations...');

    // Buscar todas as operações restantes
    const { data: operations, error: fetchError } = await supabase
      .from('operations_history')
      .select(`
        *,
        clients!inner(name, id)
      `)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching operations:', fetchError);
      return;
    }

    console.log(`📋 Found ${operations.length} remaining operations`);

    // Agrupar operações por cliente
    const operationsByClient = {};
    operations.forEach(op => {
      if (!operationsByClient[op.client_id]) {
        operationsByClient[op.client_id] = {
          clientName: op.clients.name,
          operations: []
        };
      }
      operationsByClient[op.client_id].operations.push(op);
    });

    // Processar cada cliente
    for (const [clientId, clientData] of Object.entries(operationsByClient)) {
      console.log(`\n👤 Processing client: ${clientData.clientName} (${clientId})`);
      
      // Calcular saldos corretos baseados nas operações
      const walletBalances = {};
      let totalAnnualUsage = 0;

      clientData.operations.forEach(op => {
        console.log(`  📝 Operation: ${op.operation_type} - ${op.source_amount} ${op.source_currency} → ${op.target_amount} ${op.target_currency}`);
        
        // Processar moeda origem
        if (!walletBalances[op.source_currency]) {
          walletBalances[op.source_currency] = 0;
        }
        
        // Processar moeda destino
        if (!walletBalances[op.target_currency]) {
          walletBalances[op.target_currency] = 0;
        }

        // Aplicar lógica baseada no tipo de operação
        switch (op.operation_type) {
          case 'external_deposit':
            // Depósito externo: adiciona à moeda destino
            walletBalances[op.target_currency] += parseFloat(op.target_amount);
            break;
            
          case 'external_withdrawal':
            // Saque externo: subtrai da moeda origem
            walletBalances[op.source_currency] -= parseFloat(op.source_amount);
            break;
            
          case 'fx_trade':
          case 'conversion':
            // Conversão: subtrai origem, adiciona destino
            walletBalances[op.source_currency] -= parseFloat(op.source_amount);
            walletBalances[op.target_currency] += parseFloat(op.target_amount);
            // Contar para uso anual (valor em USDT)
            if (op.source_currency === 'USDT') {
              totalAnnualUsage += parseFloat(op.source_amount);
            } else if (op.target_currency === 'USDT') {
              totalAnnualUsage += parseFloat(op.target_amount);
            }
            break;
            
          case 'transfer':
            // Transferência: subtrai origem, adiciona destino
            walletBalances[op.source_currency] -= parseFloat(op.source_amount);
            walletBalances[op.target_currency] += parseFloat(op.target_amount);
            break;
            
          case 'arbitrage':
            // Arbitragem: subtrai origem, adiciona destino
            walletBalances[op.source_currency] -= parseFloat(op.source_amount);
            walletBalances[op.target_currency] += parseFloat(op.target_amount);
            break;
        }
      });

      console.log(`\n💰 Calculated balances for ${clientData.clientName}:`);
      Object.entries(walletBalances).forEach(([currency, balance]) => {
        console.log(`  ${currency}: ${balance}`);
      });
      console.log(`📈 Calculated annual usage: ${totalAnnualUsage} USDT`);

      // Atualizar saldos das carteiras
      for (const [currency, balance] of Object.entries(walletBalances)) {
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: balance })
          .eq('client_id', clientId)
          .eq('currency', currency);

        if (walletError) {
          console.error(`❌ Error updating ${currency} wallet:`, walletError);
        } else {
          console.log(`✅ ${currency} wallet updated to ${balance}`);
        }
      }

      // Atualizar uso anual
      const { error: usageError } = await supabase
        .from('clients')
        .update({ current_annual_usage_usdt: totalAnnualUsage })
        .eq('id', clientId);

      if (usageError) {
        console.error(`❌ Error updating annual usage:`, usageError);
      } else {
        console.log(`✅ Annual usage updated to ${totalAnnualUsage} USDT`);
      }
    }

    console.log('\n✅ All balances and limits recalculated successfully!');

  } catch (error) {
    console.error('❌ Error recalculating balances:', error);
  }
}

recalculateBalancesAndLimits();
