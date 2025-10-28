const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFxTradeTargetAmount() {
  try {
    console.log('🔍 Buscando operações FX Trade com target_amount incorreto...');
    
    const { data: operations, error: fetchError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('operation_type', 'fx_trade')
      .is('deleted_at', null)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.error('❌ Erro ao buscar operações:', fetchError);
      return;
    }
    
    console.log(`📊 Encontradas ${operations.length} operações FX Trade`);
    
    let fixedCount = 0;
    const corrections = [];
    
    for (const op of operations) {
      const sourceAmount = parseFloat(op.source_amount);
      const exchangeRate = parseFloat(op.exchange_rate);
      const fixedRateAmount = parseFloat(op.fixed_rate_amount) || 0;
      const currentTargetAmount = parseFloat(op.target_amount);
      
      // Calcular o valor correto
      const correctTargetAmount = sourceAmount * exchangeRate + fixedRateAmount;
      
      // Verificar se o valor atual está incorreto
      // Consideramos incorreto se a diferença for maior que 1% do valor correto
      const difference = Math.abs(currentTargetAmount - correctTargetAmount);
      const tolerance = correctTargetAmount * 0.01;
      
      if (difference > tolerance && !isNaN(sourceAmount) && !isNaN(exchangeRate)) {
        corrections.push({
          operation: op,
          oldValue: currentTargetAmount,
          newValue: correctTargetAmount,
          difference
        });
      }
    }
    
    console.log(`🔧 Encontradas ${corrections.length} operações para corrigir`);
    
    for (const correction of corrections) {
      const op = correction.operation;
      
      console.log(`\n📝 Corrigindo operação ${op.id}:`);
      console.log(`   Cliente: ${op.client_id}`);
      console.log(`   Valor antigo: ${correction.oldValue}`);
      console.log(`   Valor novo: ${correction.newValue}`);
      console.log(`   Diferença: ${correction.difference}`);
      
      const updateResult = await supabase
        .from('operations_history')
        .update({
          target_amount: correction.newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', op.id);
      
      if (!updateResult.error) {
        fixedCount++;
        console.log(`   ✅ Operação corrigida`);
      } else {
        console.error(`   ❌ Erro ao corrigir: ${updateResult.error.message}`);
      }
    }
    
    console.log(`\n✅ Total de operações corrigidas: ${fixedCount}`);
    
    if (fixedCount > 0) {
      console.log('\n🔄 Agora vamos recalcular os saldos das carteiras...');
      await recalculateWalletBalances();
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir operações:', error);
  }
}

async function recalculateWalletBalances() {
  try {
    console.log('🔍 Buscando todas as carteiras...');
    
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .is('deleted_at', null)
      .eq('is_deleted', false);
    
    if (walletsError) {
      console.error('❌ Erro ao buscar carteiras:', walletsError);
      return;
    }
    
    console.log(`📊 Encontradas ${wallets.length} carteiras`);
    
    let updatedCount = 0;
    
    for (const wallet of wallets) {
      console.log(`\n💰 Recalculando saldo da carteira ${wallet.id} (Cliente: ${wallet.client_id})`);
      
      const { data: transactions, error: transError } = await supabase
        .from('operations_history')
        .select('*')
        .eq('client_id', wallet.client_id)
        .is('deleted_at', null)
        .eq('is_deleted', false);
      
      if (transError) {
        console.error(`❌ Erro ao buscar transações: ${transError.message}`);
        continue;
      }
      
      const currency = wallet.currency;
      let newBalance = 0;
      
      for (const tx of transactions) {
        if (tx.operation_type === 'fx_trade') {
          if (tx.source_currency === currency) {
            newBalance -= tx.source_amount;
          }
          if (tx.target_currency === currency) {
            newBalance += tx.target_amount;
          }
        } else if (tx.operation_type === 'transfer') {
          if (tx.source_currency === currency && tx.destination_client_id === wallet.client_id) {
            newBalance -= tx.source_amount;
          } else if (tx.target_currency === currency && tx.client_id === wallet.client_id) {
            newBalance += tx.target_amount;
          }
        } else if (tx.operation_type === 'external_deposit') {
          if (tx.target_currency === currency && tx.target_amount > 0) {
            newBalance += tx.target_amount;
          }
        } else if (tx.operation_type === 'external_withdrawal') {
          if (tx.source_currency === currency && tx.source_amount > 0) {
            newBalance -= tx.source_amount;
          }
        }
      }
      
      const balanceDifference = newBalance - wallet.balance;
      
      if (Math.abs(balanceDifference) > 0.01) {
        console.log(`   Saldo antigo: ${wallet.balance}`);
        console.log(`   Saldo novo: ${newBalance}`);
        console.log(`   Diferença: ${balanceDifference}`);
        
        const updateResult = await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', wallet.id);
        
        if (!updateResult.error) {
          updatedCount++;
          console.log(`   ✅ Carteira atualizada`);
        } else {
          console.error(`   ❌ Erro ao atualizar: ${updateResult.error.message}`);
        }
      }
    }
    
    console.log(`\n✅ Total de carteiras atualizadas: ${updatedCount}`);
    
  } catch (error) {
    console.error('❌ Erro ao recalcular saldos:', error);
  }
}

if (require.main === module) {
  fixFxTradeTargetAmount()
    .then(() => {
      console.log('\n🎉 Correção concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixFxTradeTargetAmount, recalculateWalletBalances };

