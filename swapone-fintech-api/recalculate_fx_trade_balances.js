const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
          const side = tx.side || 'buy';
          
          if (side === 'sell') {
            if (tx.source_currency === currency) {
              newBalance -= tx.source_amount;
            }
            if (tx.target_currency === currency) {
              newBalance += tx.target_amount;
            }
          } else {
            if (tx.source_currency === currency) {
              newBalance += tx.source_amount;
            }
            if (tx.target_currency === currency) {
              newBalance -= tx.target_amount;
            }
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
  recalculateWalletBalances()
    .then(() => {
      console.log('\n🎉 Recálculo concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { recalculateWalletBalances };

