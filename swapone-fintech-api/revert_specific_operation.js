require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const walletsService = require('./src/services/walletsService');
const clientLimitsService = require('./src/services/clientLimitsService');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function revertSpecificOperation(operationId) {
  try {
    console.log(`🔍 Buscando operação: ${operationId}`);

    // 1. Buscar a operação
    const { data: operation, error: operationError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('id', operationId)
      .single();

    if (operationError) {
      console.error('❌ Erro ao buscar operação:', operationError);
      return;
    }

    if (!operation) {
      console.error('❌ Operação não encontrada');
      return;
    }

    console.log('📋 Operação encontrada:', {
      id: operation.id,
      operation_type: operation.operation_type,
      side: operation.side,
      source_currency: operation.source_currency,
      target_currency: operation.target_currency,
      source_amount: operation.source_amount,
      target_amount: operation.target_amount,
      status: operation.status,
      client_id: operation.client_id
    });

    // 2. Verificar se é fx_trade
    if (operation.operation_type !== 'fx_trade') {
      console.log('⚠️ Esta operação não é fx_trade, tipo:', operation.operation_type);
    }

    const side = operation.side || 'buy';
    console.log(`🔄 Revertendo operação tipo: ${operation.operation_type}, side: ${side}`);

    // 3. Reverter saldos das carteiras
    if (operation.operation_type === 'fx_trade') {
      if (side === 'buy') {
        // Compra: reverter = adicionar BRL e subtrair USDT/USDC
        console.log(`💰 Revertendo COMPRA:`);
        console.log(`   Adicionar ${operation.target_amount} ${operation.target_currency}`);
        console.log(`   Subtrair ${operation.source_amount} ${operation.source_currency}`);
        
        const addBrlResult = await walletsService.updateWalletBalance(
          operation.client_id,
          operation.target_currency,
          parseFloat(operation.target_amount),
          'add'
        );
        
        const subtractUsdtResult = await walletsService.updateWalletBalance(
          operation.client_id,
          operation.source_currency,
          parseFloat(operation.source_amount),
          'subtract'
        );
        
        if (!addBrlResult.success) {
          console.error('❌ Erro ao reverter BRL:', addBrlResult.error);
        } else {
          console.log(`✅ BRL revertido: ${addBrlResult.newBalance}`);
        }
        
        if (!subtractUsdtResult.success) {
          console.error('❌ Erro ao reverter USDT/USDC:', subtractUsdtResult.error);
        } else {
          console.log(`✅ USDT/USDC revertido: ${subtractUsdtResult.newBalance}`);
        }
        
      } else {
        // Venda: reverter = subtrair BRL e adicionar USDT/USDC
        console.log(`💰 Revertendo VENDA:`);
        console.log(`   Subtrair ${operation.target_amount} ${operation.target_currency}`);
        console.log(`   Adicionar ${operation.source_amount} ${operation.source_currency}`);
        
        const subtractBrlResult = await walletsService.updateWalletBalance(
          operation.client_id,
          operation.target_currency,
          parseFloat(operation.target_amount),
          'subtract'
        );
        
        const addUsdtResult = await walletsService.updateWalletBalance(
          operation.client_id,
          operation.source_currency,
          parseFloat(operation.source_amount),
          'add'
        );
        
        if (!subtractBrlResult.success) {
          console.error('❌ Erro ao reverter BRL:', subtractBrlResult.error);
        } else {
          console.log(`✅ BRL revertido: ${subtractBrlResult.newBalance}`);
        }
        
        if (!addUsdtResult.success) {
          console.error('❌ Erro ao reverter USDT/USDC:', addUsdtResult.error);
        } else {
          console.log(`✅ USDT/USDC revertido: ${addUsdtResult.newBalance}`);
        }
      }
    } else if (operation.operation_type === 'withdrawal') {
      // Saque: reverter = adicionar de volta o valor subtraído
      console.log(`💰 Revertendo SAQUE:`);
      console.log(`   Adicionar ${operation.source_amount || operation.target_amount} ${operation.source_currency || operation.target_currency}`);
      
      const currency = operation.source_currency || operation.target_currency;
      const amount = operation.source_amount || operation.target_amount;
      
      const addResult = await walletsService.updateWalletBalance(
        operation.client_id,
        currency,
        parseFloat(amount),
        'add'
      );
      
      if (!addResult.success) {
        console.error('❌ Erro ao reverter saque:', addResult.error);
      } else {
        console.log(`✅ Valor revertido: ${addResult.newBalance}`);
      }
    }

    // 4. Reverter uso anual (se aplicável)
    if (operation.operation_type === 'fx_trade' && operation.target_currency === 'BRL') {
      const amountBrl = parseFloat(operation.target_amount);
      console.log(`📊 Revertendo uso anual: -${amountBrl} BRL`);
      
      // Buscar cliente para obter uso atual
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('current_annual_usage_usdt')
        .eq('id', operation.client_id)
        .single();

      if (!clientError && client) {
        const currentUsage = parseFloat(client.current_annual_usage_usdt || 0);
        const newUsage = Math.max(0, currentUsage - amountBrl);
        
        const { error: updateError } = await supabase
          .from('clients')
          .update({ current_annual_usage_usdt: newUsage })
          .eq('id', operation.client_id);

        if (updateError) {
          console.error('❌ Erro ao reverter uso anual:', updateError);
        } else {
          console.log(`✅ Uso anual revertido: ${currentUsage} → ${newUsage} BRL`);
        }
      }
    }

    console.log('\n✅ Reversão concluída!');
  } catch (error) {
    console.error('❌ Erro ao reverter operação:', error);
  }
}

const operationId = process.argv[2];
if (!operationId) {
  console.error('❌ Por favor, forneça o ID da operação como argumento');
  console.log('Uso: node revert_specific_operation.js <operation_id>');
  process.exit(1);
}

revertSpecificOperation(operationId).then(() => {
  console.log('\n✅ Processo finalizado');
  process.exit(0);
});

