const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');
const mockDataService = require('../services/mockDataService');
const operationsService = require('../services/operationsService');
const walletsService = require('../services/walletsService');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Helper function to get client name by ID
async function getClientNameById(clientId) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();
    
    if (error || !data) {
      return 'Cliente Desconhecido';
    }
    
    return data.name;
  } catch (error) {
    console.error('Error fetching client name:', error);
    return 'Cliente Desconhecido';
  }
}

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Obter resumo financeiro do dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumo financeiro obtido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalBalance:
 *                       type: number
 *                       description: Saldo total em USD
 *                     accounts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           currency:
 *                             type: string
 *                           balance:
 *                             type: number
 *                           balanceUSD:
 *                             type: number
 *                     recentTransfers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           currency:
 *                             type: string
 *                           status:
 *                             type: string
 *                           created_at:
 *                             type: string
 *                     arbitrageRates:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           pair:
 *                             type: string
 *                           rate:
 *                             type: number
 *                           spread_bps:
 *                             type: number
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/summary', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    const arbitrageRates = mockDataService.getArbitrageRates();
    const exchangeRates = mockDataService.getExchangeRates();

    const walletsResult = await walletsService.getClientWallets(clientId);
    
    let accounts = [];
    if (walletsResult.success) {
      accounts = walletsResult.data.map(wallet => ({
        id: `account-${wallet.currency.toLowerCase()}`,
        currency: wallet.currency,
        balance: parseFloat(wallet.balance),
        balanceUSD: parseFloat(wallet.balance) * (exchangeRates[wallet.currency] || 1),
        wallet_address: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 
          `0x${Math.random().toString(16).substr(2, 40)}` : null,
        network: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 'Ethereum' : null,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at
      }));
    } else {
      const allCurrencies = ['USD', 'EUR', 'GBP', 'BRL', 'USDC', 'USDT'];
      accounts = allCurrencies.map(currency => ({
        id: `account-${currency.toLowerCase()}`,
        currency: currency,
        balance: 0,
        balanceUSD: 0,
        wallet_address: null,
        network: currency === 'USDC' || currency === 'USDT' ? 'Ethereum' : null,
        created_at: new Date().toISOString()
      }));
    }

    const operationsResult = await operationsService.getClientOperations(clientId, 5);
    
    let recentTransfers = [];
    if (operationsResult.success && operationsResult.data && operationsResult.data.length > 0) {
      recentTransfers = await Promise.all(operationsResult.data.map(async op => {
        // Mapear campos baseado no tipo de operação
        let displayData = {
          id: op.id,
          status: op.status,
          beneficiary_name: op.beneficiary_name || 'Operation',
          created_at: op.created_at,
          operation_type: op.operation_type
        };

        // Para FX Trade (buy/sell)
        if (op.operation_type === 'fx_trade') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.final_quotation = op.final_rate;
          displayData.base_rate = op.base_rate;
          // Determinar side baseado na lógica da operação
          // Se source_amount > 0 e target_amount > 0, é uma conversão
          // Se estamos "comprando" USDT com BRL, side = "buy"
          // Se estamos "vendendo" USDT por BRL, side = "sell"
          let determinedSide = 'buy'; // Default
          if (op.source_currency === 'USDT' && op.target_currency === 'BRL') {
            // Para USDT -> BRL, se estamos adicionando USDT e subtraindo BRL, é compra de USDT
            determinedSide = 'buy';
          } else if (op.source_currency === 'BRL' && op.target_currency === 'USDT') {
            // Para BRL -> USDT, se estamos adicionando BRL e subtraindo USDT, é venda de USDT
            determinedSide = 'sell';
          }
          
          displayData.side = op.side || determinedSide;
        }
        // Para operações antigas (buy/sell) - manter compatibilidade
        else if (op.operation_type === 'buy' || op.operation_type === 'sell') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.final_quotation = op.final_rate;
        }
        // Para Arbitragem (conversion)
        else if (op.operation_type === 'conversion') {
          displayData.from_amount = op.source_amount;
          displayData.from_currency = op.source_currency;
          displayData.to_amount = op.target_amount;
          displayData.to_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.base_rate = op.base_rate;
          displayData.markup_percentage = op.markup_percentage;
        }
        // Para Transferências
        else if (op.operation_type === 'transfer') {
          // Verificar se é uma transferência recebida (cliente atual é o destino)
          const isReceivedTransfer = op.destination_client_id === clientId;
          
          if (isReceivedTransfer) {
            // Transferência recebida - mostrar como transferência recebida
            // Para transferências recebidas, precisamos buscar o nome do cliente que enviou
            const senderClientName = await getClientNameById(op.client_id);
            
            displayData.amount = op.source_amount;
            displayData.currency = op.source_currency;
            displayData.target_amount = op.target_amount;
            displayData.target_currency = op.target_currency;
            displayData.transfer_method = op.transfer_method;
            displayData.payment_reference = op.payment_reference;
            displayData.fee_amount = op.fee_amount;
            displayData.notes = `Transfer by ${senderClientName || 'cliente'}`;
            displayData.beneficiary_account = op.internal_account_number;
            displayData.operation_type = 'transfer_received'; // Tipo específico para transferências recebidas
            displayData.transfer_by = senderClientName || 'Cliente';
            displayData.transfer_from_account = op.internal_account_number;
          } else {
            // Transferência enviada - mostrar como débito
            displayData.amount = op.source_amount;
            displayData.currency = op.source_currency;
            displayData.target_amount = op.target_amount;
            displayData.target_currency = op.target_currency;
            displayData.transfer_method = op.transfer_method;
            displayData.payment_reference = op.payment_reference;
            displayData.fee_amount = op.fee_amount;
            displayData.notes = op.notes;
            displayData.beneficiary_account = op.beneficiary_account;
          }
        }
        // Para Depósitos Externos
        else if (op.operation_type === 'external_deposit' || op.operation_type === 'deposit') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.fee_amount = op.fee_amount;
          displayData.notes = op.notes;
        }
        // Para Saques
        else if (op.operation_type === 'withdrawal') {
          displayData.amount = op.source_amount;
          displayData.currency = op.source_currency;
          displayData.target_amount = op.target_amount;
          displayData.target_currency = op.target_currency;
          displayData.exchange_rate = op.exchange_rate;
          displayData.fee_amount = op.fee_amount;
          displayData.notes = op.notes;
        }

        return displayData;
      }));
    } else {
      const transferHistory = mockDataService.getTransferHistory(userId);
      recentTransfers = transferHistory.slice(0, 5);
    }

    res.json({
      success: true,
      data: {
        accounts: accounts,
        recentTransfers: recentTransfers,
        arbitrageRates: arbitrageRates,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch dashboard data'
    });
  }
});

/**
 * @swagger
 * /api/dashboard/statistics:
 *   get:
 *     summary: Obter estatísticas do dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     monthlyVolume:
 *                       type: number
 *                       description: Volume mensal de transferências
 *                     totalTransfers:
 *                       type: number
 *                       description: Total de transferências
 *                     pendingTransfers:
 *                       type: number
 *                       description: Transferências pendentes
 *                     approvedTransfers:
 *                       type: number
 *                       description: Transferências aprovadas
 *                     rejectedTransfers:
 *                       type: number
 *                       description: Transferências rejeitadas
 */
router.get('/statistics', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const clientId = req.user.client_id;

    // Buscar estatísticas de transferências
    const { data: transfers, error: transfersError } = await supabase
      .from('transfers')
      .select('amount, currency, status, created_at')
      .eq('client_id', clientId);

    if (transfersError) {
      throw new Error('Failed to fetch transfer statistics');
    }

    // Calcular estatísticas
    const totalTransfers = transfers.length;
    const pendingTransfers = transfers.filter(t => t.status === 'pending_review').length;
    const approvedTransfers = transfers.filter(t => t.status === 'approved' || t.status === 'sent').length;
    const rejectedTransfers = transfers.filter(t => t.status === 'rejected').length;

    // Calcular volume mensal (simulado)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyTransfers = transfers.filter(t => {
      const transferDate = new Date(t.created_at);
      return transferDate.getMonth() === currentMonth && transferDate.getFullYear() === currentYear;
    });

    const exchangeRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      BRL: 0.19,
      USDC: 1.0,
      USDT: 1.0
    };

    const monthlyVolume = monthlyTransfers.reduce((total, transfer) => {
      const amountUSD = transfer.amount * (exchangeRates[transfer.currency] || 1);
      return total + amountUSD;
    }, 0);

    res.json({
      success: true,
      data: {
        monthlyVolume: Math.round(monthlyVolume * 100) / 100,
        totalTransfers,
        pendingTransfers,
        approvedTransfers,
        rejectedTransfers,
        successRate: totalTransfers > 0 ? Math.round((approvedTransfers / totalTransfers) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch statistics'
    });
  }
});

/**
 * @swagger
 * /api/dashboard/exchange-rates:
 *   get:
 *     summary: Obter taxas de câmbio em tempo real
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Taxas de câmbio obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     rates:
 *                       type: object
 *                       description: Taxas de câmbio em relação ao USD
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 */
router.get('/exchange-rates', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    // Obter taxas de câmbio atualizadas do serviço mockado
    const exchangeRates = mockDataService.getExchangeRates();

    res.json({
      success: true,
      data: {
        rates: exchangeRates,
        base: 'USD',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Exchange rates error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch exchange rates'
    });
  }
});

module.exports = router;
