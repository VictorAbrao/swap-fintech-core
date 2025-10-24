const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

class MockDataService {
  constructor() {
    this.exchangeRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      BRL: 0.19,
      JPY: 149.85,
      CHF: 0.88,
      USDC: 1.00,
      AUD: 1.54,
      CNY: 7.25,
      USDC: 1.0,
      USDT: 1.0
    };
    
    this.arbitrageRates = [
      { pair: 'USD_EUR', rate: 0.92, spread_bps: 50 },
      { pair: 'USD_GBP', rate: 0.79, spread_bps: 50 },
      { pair: 'USDC_USD', rate: 1.00, spread_bps: 10 },
      { pair: 'USDT_USD', rate: 1.00, spread_bps: 10 }
    ];

    this.accountBalances = {};

    this.transferHistory = {
      '76e63666-921c-4565-a82b-a13044af064e': [
        {
          id: '1',
          amount: 1500.00,
          currency: 'USD',
          status: 'sent',
          beneficiary_name: 'John Doe',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          amount: 2500.00,
          currency: 'EUR',
          status: 'pending_review',
          beneficiary_name: 'Maria Silva',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          amount: 500.00,
          currency: 'GBP',
          status: 'approved',
          beneficiary_name: 'Robert Smith',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ],
      'e6533471-7316-434e-8a9b-a8ee9f2603f0': [
        {
          id: '4',
          amount: 10000.00,
          currency: 'USD',
          status: 'sent',
          beneficiary_name: 'Alice Johnson',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          amount: 7500.00,
          currency: 'EUR',
          status: 'sent',
          beneficiary_name: 'Carlos Rodriguez',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      '43d57990-68d1-4194-b074-5b894a2b9f82': []
    };

    this.startHourlyUpdates();
  }

  // Simular flutuações nas taxas de câmbio
  updateExchangeRates() {
    const currencies = ['EUR', 'GBP', 'BRL', 'JPY', 'CHF', 'USDC', 'AUD', 'CNY'];
    
    currencies.forEach(currency => {
      const currentRate = this.exchangeRates[currency];
      const variation = (Math.random() - 0.5) * 0.02; // ±1% de variação
      const newRate = currentRate * (1 + variation);
      
      this.exchangeRates[currency] = Math.round(newRate * 10000) / 10000;
    });

    console.log(`🔄 Exchange rates updated at ${new Date().toISOString()}`);
  }

  // Simular movimentações nas contas
  updateAccountBalances() {
    Object.keys(this.accountBalances).forEach(userId => {
      const balances = this.accountBalances[userId];
      
      Object.keys(balances).forEach(currency => {
        if (currency !== 'USD') {
          // Simular pequenas variações nos saldos
          const variation = (Math.random() - 0.5) * 0.001; // ±0.05% de variação
          const currentBalance = balances[currency];
          const newBalance = currentBalance * (1 + variation);
          
          this.accountBalances[userId][currency] = Math.round(newBalance * 100) / 100;
        }
      });
    });

    console.log(`💰 Account balances updated at ${new Date().toISOString()}`);
  }

  // Iniciar atualizações por hora
  startHourlyUpdates() {
    // Atualizar imediatamente
    this.updateExchangeRates();
    this.updateAccountBalances();

    // Atualizar a cada hora
    setInterval(() => {
      this.updateExchangeRates();
      this.updateAccountBalances();
    }, 60 * 60 * 1000); // 1 hora

    console.log('⏰ Hourly updates started for mock data');
  }

  // Obter saldos de uma conta
  getAccountBalances(userId) {
    if (this.accountBalances[userId]) {
      return this.accountBalances[userId];
    }
    
    return {
      USD: 0,
      EUR: 0,
      GBP: 0,
      BRL: 0,
      USDC: 0,
      USDT: 0
    };
  }

  // Obter histórico de transferências
  getTransferHistory(userId) {
    return this.transferHistory[userId] || [];
  }

  // Obter taxas de câmbio
  getExchangeRates() {
    return this.exchangeRates;
  }

  // Obter taxas de arbitragem
  getArbitrageRates() {
    return this.arbitrageRates;
  }

  // Calcular saldo total em USD
  calculateTotalBalanceUSD(userId) {
    const balances = this.getAccountBalances(userId);
    const rates = this.getExchangeRates();
    
    let totalUSD = 0;
    Object.keys(balances).forEach(currency => {
      const balance = balances[currency];
      const rate = rates[currency] || 1;
      totalUSD += balance * rate;
    });

    return Math.round(totalUSD * 100) / 100;
  }

  // Simular nova transferência
  addTransfer(userId, transferData) {
    if (!this.transferHistory[userId]) {
      this.transferHistory[userId] = [];
    }

    const newTransfer = {
      id: Date.now().toString(),
      ...transferData,
      created_at: new Date().toISOString()
    };

    this.transferHistory[userId].unshift(newTransfer);
    
    // Manter apenas as últimas 50 transferências
    if (this.transferHistory[userId].length > 50) {
      this.transferHistory[userId] = this.transferHistory[userId].slice(0, 50);
    }

    return newTransfer;
  }
}

// Instância singleton
const mockDataService = new MockDataService();

module.exports = mockDataService;

