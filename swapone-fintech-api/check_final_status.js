require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFinalStatus() {
  console.log('📊 Final Status - Clients and Wallets:');
  
  // Buscar todos os clientes
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, cnpj')
    .order('created_at', { ascending: false });
  
  if (clientsError) {
    console.error('❌ Error fetching clients:', clientsError.message);
    return;
  }
  
  // Buscar todas as carteiras
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('id, client_id, currency, balance');
  
  if (walletsError) {
    console.error('❌ Error fetching wallets:', walletsError.message);
    return;
  }
  
  console.log(`✅ Total clients: ${clients.length}`);
  console.log(`💰 Total wallets: ${wallets.length}`);
  console.log(`📈 Expected wallets: ${clients.length * 6}`);
  
  // Mostrar cada cliente
  clients.forEach((client, index) => {
    const clientWallets = wallets.filter(w => w.client_id === client.id);
    console.log(`\n${index + 1}. ${client.name}:`);
    console.log(`   CNPJ: ${client.cnpj || 'N/A'}`);
    console.log(`   Wallets: ${clientWallets.length}/6`);
    
    if (clientWallets.length > 0) {
      clientWallets.forEach(wallet => {
        console.log(`     - ${wallet.currency}: ${wallet.balance}`);
      });
    }
  });
  
  console.log(`\n🎉 Summary:`);
  console.log(`   Status: ${wallets.length === clients.length * 6 ? '✅ Complete' : '⚠️ Incomplete'}`);
}

checkFinalStatus().catch(console.error);
