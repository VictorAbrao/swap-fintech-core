const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixClientBalance() {
  try {
    const clientId = 'f548279e-503a-4245-af7c-63fa42ab9526';
    
    console.log(`🔍 Buscando carteiras do cliente ${clientId}...`);
    
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .eq('is_deleted', false);
    
    if (walletsError) {
      console.error('❌ Erro ao buscar carteiras:', walletsError);
      return;
    }
    
    console.log(`📊 Encontradas ${wallets.length} carteiras`);
    
    const { data: transactions, error: transError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('client_id', clientId)
      .is('deleted_at', null)
      .eq('is_deleted', false);
    
    if (transError) {
      console.error('❌ Erro ao buscar transações:', transError);
      return;
    }
    
    console.log(`📊 Encontradas ${transactions.length} transações`);
    
    for (const tx of transactions) {
      console.log(`\n📝 Operação: ${tx.operation_type}`);
      console.log(`   ID: ${tx.id}`);
      console.log(`   Source: ${tx.source_currency} ${tx.source_amount}`);
      console.log(`   Target: ${tx.target_currency} ${tx.target_amount}`);
      console.log(`   Destination: ${tx.destination_client_id}`);
      console.log(`   Status: ${tx.status}`);
    }
    
    const usdtWallet = wallets.find(w => w.currency === 'USDT');
    
    if (usdtWallet) {
      console.log(`\n💰 Saldo atual USDT: ${usdtWallet.balance}`);
      console.log(`   ID da carteira: ${usdtWallet.id}`);
      
      let newBalance = 0;
      for (const tx of transactions) {
        if (tx.operation_type === 'transfer') {
          if (tx.source_currency === 'USDT' && tx.destination_client_id !== clientId) {
            newBalance -= tx.source_amount;
            console.log(`   - Transferência: -${tx.source_amount} USDT`);
          }
          if (tx.target_currency === 'USDT' && tx.destination_client_id === clientId) {
            newBalance += tx.target_amount;
            console.log(`   + Transferência recebida: +${tx.target_amount} USDT`);
          }
        }
      }
      
      console.log(`\n💰 Saldo calculado: ${newBalance} USDT`);
      console.log(`💰 Saldo atual: ${usdtWallet.balance} USDT`);
      
      if (Math.abs(newBalance - usdtWallet.balance) > 0.01) {
        console.log(`\n🔄 Atualizando saldo para ${newBalance}...`);
        
        const { error: updateError } = await supabase
          .from('wallets')
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', usdtWallet.id);
        
        if (updateError) {
          console.error('❌ Erro ao atualizar:', updateError);
        } else {
          console.log('✅ Saldo atualizado com sucesso!');
        }
      } else {
        console.log('✅ Saldo já está correto');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

if (require.main === module) {
  fixClientBalance()
    .then(() => {
      console.log('\n🎉 Correção concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixClientBalance };

