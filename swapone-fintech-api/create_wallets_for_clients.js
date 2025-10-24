require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createWalletsForClients() {
  console.log('🏦 Creating wallets for existing clients...');
  
  // Moedas padrão para criar carteiras
  const currencies = ['USD', 'EUR', 'GBP', 'USDT', 'BRL', 'USDC'];
  
  // Buscar todos os clientes
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, cnpj');
  
  if (clientsError) {
    console.error('❌ Error fetching clients:', clientsError.message);
    return;
  }
  
  console.log(`📊 Found ${clients.length} clients`);
  
  for (const client of clients) {
    console.log(`\n🏦 Creating wallets for client: ${client.name} (${client.id})`);
    
    for (const currency of currencies) {
      try {
        const walletData = {
          client_id: client.id,
          currency: currency,
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
          .from('wallets')
          .insert([walletData])
          .select()
          .single();
        
        if (error) {
          console.error(`❌ Error creating ${currency} wallet for ${client.name}:`, error.message);
        } else {
          console.log(`✅ Created ${currency} wallet for ${client.name}`);
        }
      } catch (err) {
        console.error(`❌ Exception creating ${currency} wallet for ${client.name}:`, err.message);
      }
    }
  }
  
  // Verificar carteiras criadas
  console.log('\n📊 Checking created wallets...');
  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('id, client_id, currency, balance');
  
  if (walletsError) {
    console.error('❌ Error fetching wallets:', walletsError.message);
    return;
  }
  
  console.log(`✅ Total wallets created: ${wallets.length}`);
  
  // Agrupar por cliente
  const walletsByClient = {};
  wallets.forEach(wallet => {
    if (!walletsByClient[wallet.client_id]) {
      walletsByClient[wallet.client_id] = [];
    }
    walletsByClient[wallet.client_id].push(wallet);
  });
  
  Object.keys(walletsByClient).forEach(clientId => {
    const clientWallets = walletsByClient[clientId];
    const client = clients.find(c => c.id === clientId);
    console.log(`\n💰 ${client.name}: ${clientWallets.length} wallets`);
    clientWallets.forEach(wallet => {
      console.log(`  - ${wallet.currency}: ${wallet.balance}`);
    });
  });
  
  console.log('\n🎉 Wallet creation completed!');
}

createWalletsForClients().catch(console.error);
