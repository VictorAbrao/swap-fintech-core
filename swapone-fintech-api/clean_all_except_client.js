const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const KEEP_CLIENT_ID = '404a1361-c17c-46f0-ac8a-d11e65000b34';

async function cleanAllExceptClient() {
  try {
    console.log('🗑️  Limpando operações de todos os clientes exceto:', KEEP_CLIENT_ID);
    
    const { error: deleteOpsError } = await supabase
      .from('operations_history')
      .delete()
      .neq('client_id', KEEP_CLIENT_ID);
    
    if (deleteOpsError) {
      console.error('❌ Erro ao deletar operações:', deleteOpsError);
      return;
    }
    
    console.log('✅ Operações de outros clientes deletadas');
    
    console.log('\n💰 Zerando saldos de todas as carteiras exceto cliente mantido...');
    
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('*')
      .neq('client_id', KEEP_CLIENT_ID)
      .is('deleted_at', null)
      .eq('is_deleted', false);
    
    if (walletsError) {
      console.error('❌ Erro ao buscar carteiras:', walletsError);
      return;
    }
    
    console.log(`📊 Encontradas ${wallets.length} carteiras para zerar`);
    
    let updatedCount = 0;
    
    for (const wallet of wallets) {
      console.log(`   Zerando carteira ${wallet.currency} do cliente ${wallet.client_id}`);
      
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', wallet.id);
      
      if (!updateError) {
        updatedCount++;
      } else {
        console.error(`   ❌ Erro ao zerar: ${updateError.message}`);
      }
    }
    
    console.log(`\n✅ Total de carteiras zeradas: ${updatedCount}`);
    
    console.log('\n📊 Verificando carteiras mantidas do cliente:', KEEP_CLIENT_ID);
    
    const { data: keptWallets, error: keptWalletsError } = await supabase
      .from('wallets')
      .select('*')
      .eq('client_id', KEEP_CLIENT_ID)
      .is('deleted_at', null)
      .eq('is_deleted', false);
    
    if (!keptWalletsError && keptWallets) {
      console.log(`💰 Carteiras mantidas (${keptWallets.length}):`);
      keptWallets.forEach(w => {
        console.log(`   ${w.currency}: ${w.balance}`);
      });
    }
    
    console.log('\n📊 Verificando operações mantidas do cliente:', KEEP_CLIENT_ID);
    
    const { data: keptOps, error: keptOpsError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('client_id', KEEP_CLIENT_ID)
      .is('deleted_at', null)
      .eq('is_deleted', false);
    
    if (!keptOpsError && keptOps) {
      console.log(`📝 Operações mantidas: ${keptOps.length}`);
      keptOps.forEach(op => {
        console.log(`   ${op.operation_type} - ${op.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

if (require.main === module) {
  cleanAllExceptClient()
    .then(() => {
      console.log('\n🎉 Limpeza concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { cleanAllExceptClient };

