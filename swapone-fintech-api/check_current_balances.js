const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentBalances() {
  try {
    console.log('🔍 Checking current balances...');

    // Buscar todas as carteiras
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select(`
        currency,
        balance,
        clients!inner(name, id)
      `)
      .order('client_id', { ascending: true });

    if (walletsError) {
      console.error('❌ Error fetching wallets:', walletsError);
      return;
    }

    console.log(`📊 Current wallet balances:`);
    
    // Agrupar por cliente
    const walletsByClient = {};
    wallets.forEach(wallet => {
      const clientId = wallet.clients.id;
      if (!walletsByClient[clientId]) {
        walletsByClient[clientId] = {
          clientName: wallet.clients.name,
          wallets: []
        };
      }
      walletsByClient[clientId].wallets.push({
        currency: wallet.currency,
        balance: wallet.balance
      });
    });

    // Mostrar saldos por cliente
    Object.entries(walletsByClient).forEach(([clientId, clientData]) => {
      console.log(`\n👤 ${clientData.clientName} (${clientId}):`);
      clientData.wallets.forEach(wallet => {
        console.log(`  ${wallet.currency}: ${wallet.balance}`);
      });
    });

    // Verificar uso anual
    console.log(`\n📈 Annual usage:`);
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('name, current_annual_usage_usdt')
      .order('name', { ascending: true });

    if (clientsError) {
      console.error('❌ Error fetching clients:', clientsError);
      return;
    }

    clients.forEach(client => {
      console.log(`  ${client.name}: ${client.current_annual_usage_usdt} USDT`);
    });

  } catch (error) {
    console.error('❌ Error checking balances:', error);
  }
}

checkCurrentBalances();