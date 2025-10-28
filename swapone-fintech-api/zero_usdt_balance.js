const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function zeroUsdtBalance() {
  try {
    const clientId = 'f548279e-503a-4245-af7c-63fa42ab9526';
    
    console.log(`🔍 Buscando carteira USDT do cliente ${clientId}...`);
    
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .eq('client_id', clientId)
      .eq('currency', 'USDT')
      .is('deleted_at', null)
      .eq('is_deleted', false);
    
    if (walletsError) {
      console.error('❌ Erro ao buscar carteiras:', walletsError);
      return;
    }
    
    if (!wallets || wallets.length === 0) {
      console.log('❌ Nenhuma carteira USDT encontrada');
      return;
    }
    
    const usdtWallet = wallets[0];
    
    console.log(`💰 Saldo atual USDT: ${usdtWallet.balance}`);
    console.log(`   ID da carteira: ${usdtWallet.id}`);
    console.log(`   Cliente: ${usdtWallet.client_id}`);
    
    console.log(`\n🔄 Zerando saldo para 0...`);
    
    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', usdtWallet.id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar:', updateError);
    } else {
      console.log('✅ Saldo zerado com sucesso!');
      console.log('💰 Novo saldo: 0 USDT');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

if (require.main === module) {
  zeroUsdtBalance()
    .then(() => {
      console.log('\n🎉 Processo concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { zeroUsdtBalance };

