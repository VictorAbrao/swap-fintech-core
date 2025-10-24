const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class WalletsService {
  async initializeClientWallets(clientId) {
    try {
      const currencies = ['USD', 'EUR', 'GBP', 'BRL', 'USDC', 'USDT'];
      
      for (const currency of currencies) {
        const { error } = await supabase
          .from('wallets')
          .upsert({
            client_id: clientId,
            currency: currency,
            balance: 0
          }, {
            onConflict: 'client_id,currency',
            ignoreDuplicates: true
          });
        
        if (error) {
          console.error(`Error initializing ${currency} wallet for client ${clientId}:`, error);
        }
      }
      
      console.log(`✅ Wallets initialized for client ${clientId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to initialize client wallets:', error);
      return { success: false, error: error.message };
    }
  }

  // DEPRECATED: Mantido para compatibilidade, mas não deve ser usado
  async initializeUserWallets(userId) {
    console.warn('⚠️ initializeUserWallets is deprecated. Use initializeClientWallets instead.');
    return { success: false, error: 'This method is deprecated' };
  }

  async getUserWallets(userId) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', userId)
        .single();

      const clientId = profile?.client_id;
      
      if (!clientId) {
        return { success: true, data: [] };
      }

      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', clientId)
        .is('user_id', null)
        .order('currency');

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Failed to get user wallets:', error);
      return { success: false, error: error.message };
    }
  }

  async getClientWallets(clientId) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', clientId)
        .order('currency');

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Failed to get client wallets:', error);
      return { success: false, error: error.message };
    }
  }

  async getWalletBalance(clientId, currency) {
    try {
      console.log(`🔍 Getting wallet balance for client ${clientId}, currency: ${currency}`);
      
      if (!clientId) {
        return { success: true, data: 0 };
      }

      const { data, error } = await supabase
        .from('wallets')
        .select('balance')
        .eq('client_id', clientId)
        .is('user_id', null)
        .eq('currency', currency)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`⚠️ No wallet found for ${currency}, returning 0`);
          return { success: true, data: 0 };
        }
        throw error;
      }

      console.log(`✅ Wallet balance found: ${data?.balance} ${currency}`);
      return { success: true, data: data?.balance || 0 };
    } catch (error) {
      console.error('❌ Failed to get wallet balance:', error);
      return { success: false, error: error.message };
    }
  }

  async updateWalletBalance(clientId, currency, amount, operation = 'add') {
    try {
      if (!clientId) {
        throw new Error('clientId is required');
      }

      const currentBalance = await this.getWalletBalance(clientId, currency);
      
      if (!currentBalance.success) {
        throw new Error('Failed to get current balance');
      }

      const currentBalanceValue = parseFloat(currentBalance.data) || 0;
      
      let newBalance;
      if (operation === 'add') {
        newBalance = currentBalanceValue + parseFloat(amount);
      } else if (operation === 'subtract') {
        newBalance = currentBalanceValue - parseFloat(amount);
      } else if (operation === 'set') {
        newBalance = parseFloat(amount);
      } else {
        throw new Error('Invalid operation');
      }

      const { data, error } = await supabase
        .from('wallets')
        .upsert({
          client_id: clientId,
          user_id: null,
          currency: currency,
          balance: newBalance
        }, {
          onConflict: 'client_id,currency',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`💰 Wallet updated for client ${clientId}`);
      console.log(`   Currency: ${currency}, Operation: ${operation} ${amount}`);
      console.log(`   Previous balance: ${currentBalanceValue}, New balance: ${newBalance}`);

      return { success: true, data, previousBalance: currentBalanceValue, newBalance };
    } catch (error) {
      console.error('❌ Failed to update wallet balance:', error);
      return { success: false, error: error.message };
    }
  }

  async processOperation(clientId, currency, amount, operationType) {
    try {
      if (operationType === 'buy') {
        return await this.updateWalletBalance(clientId, currency, amount, 'add');
      } else if (operationType === 'sell') {
        return await this.updateWalletBalance(clientId, currency, amount, 'subtract');
      } else {
        throw new Error('Invalid operation type');
      }
    } catch (error) {
      console.error('❌ Failed to process operation:', error);
      return { success: false, error: error.message };
    }
  }

  async processOperationWithBRL(clientId, currency, amount, brlAmount, operationType) {
    try {
      console.log(`🔄 Processing operation with BRL:`);
      console.log(`   Currency: ${currency} ${amount}, BRL: ${brlAmount}, Type: ${operationType}`);

      if (operationType === 'buy') {
        const currencyResult = await this.updateWalletBalance(clientId, currency, amount, 'add');
        if (!currencyResult.success) {
          throw new Error(`Failed to add ${currency}: ${currencyResult.error}`);
        }

        const brlResult = await this.updateWalletBalance(clientId, 'BRL', brlAmount, 'subtract');
        if (!brlResult.success) {
          await this.updateWalletBalance(clientId, currency, amount, 'subtract');
          throw new Error(`Failed to subtract BRL: ${brlResult.error}`);
        }

        console.log(`✅ Buy operation complete: +${amount} ${currency}, -${brlAmount} BRL`);
        return { 
          success: true, 
          currencyBalance: currencyResult.newBalance,
          brlBalance: brlResult.newBalance
        };

      } else if (operationType === 'sell') {
        const currencyResult = await this.updateWalletBalance(clientId, currency, amount, 'subtract');
        if (!currencyResult.success) {
          throw new Error(`Failed to subtract ${currency}: ${currencyResult.error}`);
        }

        const brlResult = await this.updateWalletBalance(clientId, 'BRL', brlAmount, 'add');
        if (!brlResult.success) {
          await this.updateWalletBalance(clientId, currency, amount, 'add');
          throw new Error(`Failed to add BRL: ${brlResult.error}`);
        }

        console.log(`✅ Sell operation complete: -${amount} ${currency}, +${brlAmount} BRL`);
        return { 
          success: true, 
          currencyBalance: currencyResult.newBalance,
          brlBalance: brlResult.newBalance
        };

      } else {
        throw new Error('Invalid operation type');
      }
    } catch (error) {
      console.error('❌ Failed to process operation with BRL:', error);
      return { success: false, error: error.message };
    }
  }

  async processConversion(clientId, fromCurrency, toCurrency, fromAmount, toAmount) {
    try {
      console.log(`🔄 Processing conversion:`);
      console.log(`   ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}`);

      // 1. Subtrair moeda de origem
      const fromResult = await this.updateWalletBalance(clientId, fromCurrency, fromAmount, 'subtract');
      if (!fromResult.success) {
        throw new Error(`Failed to subtract ${fromCurrency}: ${fromResult.error}`);
      }

      // 2. Adicionar moeda de destino
      const toResult = await this.updateWalletBalance(clientId, toCurrency, toAmount, 'add');
      if (!toResult.success) {
        // Rollback: adicionar de volta a moeda de origem
        await this.updateWalletBalance(clientId, fromCurrency, fromAmount, 'add');
        throw new Error(`Failed to add ${toCurrency}: ${toResult.error}`);
      }

      console.log(`✅ Conversion complete:`);
      console.log(`   -${fromAmount} ${fromCurrency} (balance: ${fromResult.newBalance})`);
      console.log(`   +${toAmount} ${toCurrency} (balance: ${toResult.newBalance})`);

      return { 
        success: true,
        fromBalance: fromResult.newBalance,
        toBalance: toResult.newBalance
      };

    } catch (error) {
      console.error('❌ Failed to process conversion:', error);
      return { success: false, error: error.message };
    }
  }

  async createWallet(clientId, currency, initialBalance = 0) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .insert([{
          client_id: clientId,
          currency: currency,
          balance: initialBalance,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${currency} wallet for client ${clientId}:`, error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Created ${currency} wallet for client ${clientId}`);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Failed to create ${currency} wallet for client ${clientId}:`, error);
      return { success: false, error: error.message };
    }
  }
}

const walletsService = new WalletsService();

module.exports = walletsService;

