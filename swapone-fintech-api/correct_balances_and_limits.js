const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function correctBalancesAndLimits() {
  try {
    console.log('🔄 Correcting balances and limits...');

    // Cliente: SWAP EXCHANGE DEFI LTDA
    const clientId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; // Substitua pelo ID real do cliente

    console.log('📊 Current wallet balances:');
    
    // Verificar saldos atuais
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('currency, balance')
      .eq('client_id', clientId);

    if (walletsError) {
      console.error('❌ Error fetching wallets:', walletsError);
      return;
    }

    wallets.forEach(wallet => {
      console.log(`  ${wallet.currency}: ${wallet.balance}`);
    });

    // Verificar limite atual
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('current_annual_usage_usdt, annual_limit_usdt')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('❌ Error fetching client:', clientError);
      return;
    }

    console.log(`📈 Current annual usage: ${client.current_annual_usage_usdt} USDT`);
    console.log(`📊 Annual limit: ${client.annual_limit_usdt} USDT`);

    // Baseado nas operações deletadas, vamos corrigir os saldos:
    // 1. Depósito externo: 1000 BRL (adicionar de volta)
    // 2. Transferência: 25 USD (adicionar de volta)  
    // 3. Conversão: 100 USDT → 100.015 USD (reverter)

    console.log('\n💰 Correcting balances...');

    // Corrigir BRL (adicionar 1000 de volta)
    const { data: brlWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('client_id', clientId)
      .eq('currency', 'BRL')
      .single();

    if (brlWallet) {
      const newBrlBalance = parseFloat(brlWallet.balance) + 1000;
      const { error: brlError } = await supabase
        .from('wallets')
        .update({ balance: newBrlBalance })
        .eq('client_id', clientId)
        .eq('currency', 'BRL');

      if (brlError) {
        console.error('❌ Error updating BRL wallet:', brlError);
      } else {
        console.log(`✅ BRL wallet updated: ${brlWallet.balance} → ${newBrlBalance}`);
      }
    }

    // Corrigir USD (adicionar 25 de volta)
    const { data: usdWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('client_id', clientId)
      .eq('currency', 'USD')
      .single();

    if (usdWallet) {
      const newUsdBalance = parseFloat(usdWallet.balance) + 25;
      const { error: usdError } = await supabase
        .from('wallets')
        .update({ balance: newUsdBalance })
        .eq('client_id', clientId)
        .eq('currency', 'USD');

      if (usdError) {
        console.error('❌ Error updating USD wallet:', usdError);
      } else {
        console.log(`✅ USD wallet updated: ${usdWallet.balance} → ${newUsdBalance}`);
      }
    }

    // Corrigir USDT (adicionar 100 de volta)
    const { data: usdtWallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('client_id', clientId)
      .eq('currency', 'USDT')
      .single();

    if (usdtWallet) {
      const newUsdtBalance = parseFloat(usdtWallet.balance) + 100;
      const { error: usdtError } = await supabase
        .from('wallets')
        .update({ balance: newUsdtBalance })
        .eq('client_id', clientId)
        .eq('currency', 'USDT');

      if (usdtError) {
        console.error('❌ Error updating USDT wallet:', usdtError);
      } else {
        console.log(`✅ USDT wallet updated: ${usdtWallet.balance} → ${newUsdtBalance}`);
      }
    }

    // Corrigir limite anual (adicionar 100 USDT de volta)
    const newAnnualUsage = parseFloat(client.current_annual_usage_usdt) + 100;
    const { error: limitError } = await supabase
      .from('clients')
      .update({ current_annual_usage_usdt: newAnnualUsage })
      .eq('id', clientId);

    if (limitError) {
      console.error('❌ Error updating annual usage:', limitError);
    } else {
      console.log(`✅ Annual usage updated: ${client.current_annual_usage_usdt} → ${newAnnualUsage} USDT`);
    }

    console.log('\n✅ Balances and limits corrected successfully!');

  } catch (error) {
    console.error('❌ Error correcting balances:', error);
  }
}

correctBalancesAndLimits();
