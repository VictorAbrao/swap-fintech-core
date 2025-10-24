const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');
const mockDataService = require('../services/mockDataService');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * @swagger
 * /api/accounts:
 *   get:
 *     summary: Listar todas as contas do usuário
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de contas obtida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       currency:
 *                         type: string
 *                       balance:
 *                         type: number
 *                       wallet_address:
 *                         type: string
 *                       network:
 *                         type: string
 *                       created_at:
 *                         type: string
 *       401:
 *         description: Token inválido
 */
router.get('/v2', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔍 Accounts V2 for user ${userId}, client ${clientId}`);

    // Buscar carteiras por client_id E user_id
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching wallets:', error);
      throw new Error('Failed to fetch wallet data');
    }

    console.log(`📊 Found ${wallets?.length || 0} wallets`);

    // Obter taxas de câmbio para conversão USD
    const exchangeRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      BRL: 0.19,
      USDC: 1.0,
      USDT: 1.0
    };

    // Converter carteiras para formato de contas
    const accounts = wallets?.map(wallet => ({
      id: `account-${wallet.currency.toLowerCase()}`,
      currency: wallet.currency,
      balance: wallet.balance,
      balanceUSD: Math.round(wallet.balance * (exchangeRates[wallet.currency] || 1) * 100) / 100,
      wallet_address: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 
        `0x${Math.random().toString(16).substr(2, 40)}` : null,
      network: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 'Ethereum' : null,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at
    })) || [];

    console.log(`✅ Returning ${accounts.length} accounts`);

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    console.error('❌ Get accounts V2 error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch accounts'
    });
  }
});

router.get('/', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    console.log(`🔍 Accounts for user ${userId}, client ${clientId}`);

    // Buscar carteiras por client_id (uma carteira por cliente, não por usuário)
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching wallets:', error);
      throw new Error('Failed to fetch wallet data');
    }

    console.log(`📊 Found ${wallets?.length || 0} wallets`);

    // Obter taxas de câmbio para conversão USD
    const exchangeRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      BRL: 0.19,
      USDC: 1.0,
      USDT: 1.0
    };

    // Converter carteiras para formato de contas
    const accounts = wallets?.map(wallet => ({
      id: `account-${wallet.currency.toLowerCase()}`,
      currency: wallet.currency,
      balance: wallet.balance,
      balanceUSD: Math.round(wallet.balance * (exchangeRates[wallet.currency] || 1) * 100) / 100,
      wallet_address: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 
        `0x${Math.random().toString(16).substr(2, 40)}` : null,
      network: wallet.currency === 'USDC' || wallet.currency === 'USDT' ? 'Ethereum' : null,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at
    })) || [];

    console.log(`✅ Returning ${accounts.length} accounts`);

    res.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    console.error('❌ Get accounts error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch accounts'
    });
  }
});

/**
 * @swagger
 * /api/accounts/{id}:
 *   get:
 *     summary: Obter detalhes de uma conta específica
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta
 *     responses:
 *       200:
 *         description: Detalhes da conta obtidos com sucesso
 *       404:
 *         description: Conta não encontrada
 */
router.get('/:id', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.client_id;

    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('client_id', clientId)
      .single();

    if (error || !account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'The requested account does not exist or you do not have access to it'
      });
    }

    res.json({
      success: true,
      data: account
    });

  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch account'
    });
  }
});

/**
 * @swagger
 * /api/accounts/balance:
 *   get:
 *     summary: Obter saldo total em diferentes moedas
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saldos obtidos com sucesso
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
 *                     balances:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *                     totalUSD:
 *                       type: number
 *                     lastUpdated:
 *                       type: string
 */
router.get('/balance', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientId = req.user.client_id;

    // Buscar dados reais das carteiras (wallets) do usuário
    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('currency, balance')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching wallets:', error);
      throw new Error('Failed to fetch wallet data');
    }

    // Agrupar saldos por moeda
    const balances = {};
    wallets.forEach(wallet => {
      if (balances[wallet.currency]) {
        balances[wallet.currency] += wallet.balance;
      } else {
        balances[wallet.currency] = wallet.balance;
      }
    });

    // Calcular total em USD
    const exchangeRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      BRL: 0.19,
      USDC: 1.0,
      USDT: 1.0
    };

    let totalUSD = 0;
    Object.keys(balances).forEach(currency => {
      const rate = exchangeRates[currency] || 1;
      totalUSD += balances[currency] * rate;
    });

    res.json({
      success: true,
      data: {
        balances,
        totalUSD: Math.round(totalUSD * 100) / 100,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch balances'
    });
  }
});

/**
 * @swagger
 * /api/accounts/transactions:
 *   get:
 *     summary: Obter histórico de transações de uma conta
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: account_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da conta
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número máximo de transações
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Número de transações para pular
 *     responses:
 *       200:
 *         description: Histórico de transações obtido com sucesso
 */
router.get('/transactions', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const { account_id, limit = 20, offset = 0 } = req.query;
    const clientId = req.user.client_id;

    if (!account_id) {
      return res.status(400).json({
        error: 'Missing parameter',
        message: 'account_id is required'
      });
    }

    // Verificar se a conta pertence ao cliente
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', account_id)
      .eq('client_id', clientId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'Account does not exist or you do not have access to it'
      });
    }

    // Buscar transferências da conta
    const { data: transfers, error: transfersError } = await supabase
      .from('transfers')
      .select('*')
      .eq('account_id', account_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (transfersError) {
      throw new Error('Failed to fetch transactions');
    }

    res.json({
      success: true,
      data: transfers,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        count: transfers.length
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch transactions'
    });
  }
});

module.exports = router;
