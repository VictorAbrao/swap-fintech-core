const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const { createClient } = require('@supabase/supabase-js');
const walletsService = require('../../services/walletsService');
const clientLimitsService = require('../../services/clientLimitsService');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @swagger
 * /api/admin/transactions:
 *   get:
 *     summary: Listar todas as transações
 *     description: Retorna uma lista paginada de todas as transações do sistema
 *     tags: [Admin - Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Número de itens por página
 *     responses:
 *       200:
 *         description: Lista de transações retornada com sucesso
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
 *                       operation_type:
 *                         type: string
 *                       source_currency:
 *                         type: string
 *                       target_currency:
 *                         type: string
 *                       source_amount:
 *                         type: number
 *                       target_amount:
 *                         type: number
 *                       exchange_rate:
 *                         type: number
 *                       base_rate:
 *                         type: number
 *                       final_rate:
 *                         type: number
 *                       markup_percentage:
 *                         type: number
 *                       status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                       client_name:
 *                         type: string
 *                       client_cnpj:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const clientId = req.query.client_id;

    console.log(`📊 Buscando transações - página ${page}, limite ${limit}${clientId ? `, cliente: ${clientId}` : ''}`);

    // Construir query base
    let query = supabase
      .from('operations_history')
      .select(`
        *,
        clients:client_id (
          name,
          cnpj
        )
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtro por cliente se fornecido
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    // Aplicar paginação
    const { data: transactions, error: transactionsError } = await query
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      console.error('❌ Erro ao buscar transações:', transactionsError);
      throw transactionsError;
    }

    // Contar total de transações (com filtro se aplicável)
    let countQuery = supabase
      .from('operations_history')
      .select('*', { count: 'exact', head: true });

    if (clientId) {
      countQuery = countQuery.eq('client_id', clientId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('❌ Erro ao contar transações:', countError);
      throw countError;
    }

    // Formatar dados para resposta
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction,
      client_name: transaction.clients?.name || 'N/A',
      client_cnpj: transaction.clients?.cnpj || 'N/A'
    }));

    const totalPages = Math.ceil(count / limit);

    console.log(`✅ ${formattedTransactions.length} transações encontradas de ${count} total`);

    res.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        page,
        limit,
        total: count,
        totalPages
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar transações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**

/**
 * @swagger
 * /api/admin/transactions/{id}/cancel:
 *   patch:
 *     summary: Cancelar transação
 *     description: Cancela uma transação alterando seu status para 'cancelado' e reverte todos os saldos e limites afetados
 *     tags: [Admin - Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da transação a ser cancelada
 *     responses:
 *       200:
 *         description: Transação cancelada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 reversions:
 *                   type: object
 *                   properties:
 *                     wallets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           currency:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           operation:
 *                             type: string
 *                     annual_limit:
 *                       type: object
 *                       properties:
 *                         currency:
 *                           type: string
 *                         amount:
 *                           type: number
 *       404:
 *         description: Transação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.patch('/:id/cancel', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🚫 Iniciando cancelamento da transação: ${id}`);
    
    // 1. Buscar a transação
    const { data: transaction, error: transactionError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('id', id)
      .single();
    
    if (transactionError || !transaction) {
      console.error('❌ Transação não encontrada:', transactionError);
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }

    // Verificar se já está cancelada
    if (transaction.status === 'cancelado') {
      return res.status(400).json({
        success: false,
        message: 'Transação já está cancelada'
      });
    }
    
    console.log('📊 Transação encontrada:', {
      id: transaction.id,
      type: transaction.operation_type,
      client_id: transaction.client_id,
      source_amount: transaction.source_amount,
      target_amount: transaction.target_amount,
      source_currency: transaction.source_currency,
      target_currency: transaction.target_currency,
      current_status: transaction.status
    });
    
    const reversions = {
      wallets: [],
      annual_limit: null
    };
    
    // 2. Reverter saldos das carteiras baseado no tipo de operação
    if (transaction.operation_type === 'fx_trade') {
      console.log('🔄 Revertendo FX Trade - 2 carteiras');
      
      // Para FX Trade (compra de USDT): 
      // - USDT: SUBTRAIR (cliente não deveria ter recebido)
      // - BRL: ADICIONAR (cliente deveria ter mantido o dinheiro)
      
      // Reverter USDT (subtrair - cliente não deveria ter recebido)
      const { data: usdtWallet, error: usdtFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.source_currency)
        .single();
      
      if (usdtFetchError && usdtFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira USDT:', usdtFetchError);
        throw usdtFetchError;
      }
      
      if (usdtWallet) {
        const newUsdtBalance = usdtWallet.balance - parseFloat(transaction.source_amount);
        const { error: usdtError } = await supabase
          .from('wallets')
          .update({ balance: newUsdtBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.source_currency);
        
        if (usdtError) {
          console.error('❌ Erro ao reverter USDT:', usdtError);
          throw usdtError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.source_currency,
        amount: parseFloat(transaction.source_amount),
        operation: 'subtract'
      });
      
      // Reverter BRL (adicionar - cliente deveria ter mantido o dinheiro)
      const { data: brlWallet, error: brlFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.target_currency)
        .single();
      
      if (brlFetchError && brlFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira BRL:', brlFetchError);
        throw brlFetchError;
      }
      
      if (brlWallet) {
        const newBrlBalance = brlWallet.balance + parseFloat(transaction.target_amount);
        const { error: brlError } = await supabase
          .from('wallets')
          .update({ balance: newBrlBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.target_currency);
        
        if (brlError) {
          console.error('❌ Erro ao reverter BRL:', brlError);
          throw brlError;
        }
      } else {
        // Criar nova carteira BRL se não existir
        const { error: brlError } = await supabase
          .from('wallets')
          .insert({
            client_id: transaction.client_id,
            currency: transaction.target_currency,
            balance: parseFloat(transaction.target_amount),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (brlError) {
          console.error('❌ Erro ao criar carteira BRL:', brlError);
          throw brlError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.target_currency,
        amount: parseFloat(transaction.target_amount),
        operation: 'add'
      });
      
    } else if (transaction.operation_type === 'arbitrage') {
      console.log('🔄 Revertendo Arbitragem - 2 carteiras');
      
      // Reverter moeda origem (adicionar de volta)
      const { data: sourceWallet, error: sourceFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.source_currency)
        .single();
      
      if (sourceFetchError && sourceFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira origem:', sourceFetchError);
        throw sourceFetchError;
      }
      
      if (sourceWallet) {
        const newSourceBalance = sourceWallet.balance + parseFloat(transaction.source_amount);
        const { error: sourceError } = await supabase
          .from('wallets')
          .update({ balance: newSourceBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.source_currency);
        
        if (sourceError) {
          console.error('❌ Erro ao reverter moeda origem:', sourceError);
          throw sourceError;
        }
      } else {
        // Criar nova carteira se não existir
        const { error: sourceError } = await supabase
          .from('wallets')
          .insert({
            client_id: transaction.client_id,
            currency: transaction.source_currency,
            balance: parseFloat(transaction.source_amount),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (sourceError) {
          console.error('❌ Erro ao criar carteira origem:', sourceError);
          throw sourceError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.source_currency,
        amount: parseFloat(transaction.source_amount),
        operation: 'add'
      });
      
      // Reverter moeda destino (subtrair)
      const { data: targetWallet, error: targetFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.target_currency)
        .single();
      
      if (targetFetchError && targetFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira destino:', targetFetchError);
        throw targetFetchError;
      }
      
      if (targetWallet) {
        const newTargetBalance = targetWallet.balance - parseFloat(transaction.target_amount);
        const { error: targetError } = await supabase
          .from('wallets')
          .update({ balance: newTargetBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.target_currency);
        
        if (targetError) {
          console.error('❌ Erro ao reverter moeda destino:', targetError);
          throw targetError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.target_currency,
        amount: parseFloat(transaction.target_amount),
        operation: 'subtract'
      });
      
    } else if (transaction.operation_type === 'transfer') {
      console.log('🔄 Revertendo Transferência - 1 carteira');
      
      // Reverter moeda origem (adicionar de volta)
      const { data: transferWallet, error: transferFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.source_currency)
        .single();
      
      if (transferFetchError && transferFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira transferência:', transferFetchError);
        throw transferFetchError;
      }
      
      if (transferWallet) {
        const newTransferBalance = transferWallet.balance + parseFloat(transaction.source_amount);
        const { error: transferError } = await supabase
          .from('wallets')
          .update({ balance: newTransferBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.source_currency);
        
        if (transferError) {
          console.error('❌ Erro ao reverter transferência:', transferError);
          throw transferError;
        }
      } else {
        // Criar nova carteira se não existir
        const { error: transferError } = await supabase
          .from('wallets')
          .insert({
            client_id: transaction.client_id,
            currency: transaction.source_currency,
            balance: parseFloat(transaction.source_amount),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (transferError) {
          console.error('❌ Erro ao criar carteira transferência:', transferError);
          throw transferError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.source_currency,
        amount: parseFloat(transaction.source_amount),
        operation: 'add'
      });
    }
    
    // 3. Atualizar status da transação para 'cancelado'
    const { error: updateError } = await supabase
      .from('operations_history')
      .update({ 
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('❌ Erro ao atualizar status da transação:', updateError);
      throw updateError;
    }
    
    console.log('✅ Transação cancelada com sucesso:', {
      id: transaction.id,
      reversions: reversions
    });
    
    res.json({
      success: true,
      message: 'Transação cancelada e saldos revertidos com sucesso',
      reversions: reversions
    });
    
  } catch (error) {
    console.error('❌ Erro no cancelamento da transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/transactions/{id}:
 *   delete:
 *     summary: Excluir transação completamente
 *     description: Exclui uma transação e reverte todos os saldos e limites afetados
 *     tags: [Admin - Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da transação a ser excluída
 *     responses:
 *       200:
 *         description: Transação excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 reversions:
 *                   type: object
 *                   properties:
 *                     wallets:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           currency:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           operation:
 *                             type: string
 *                     annual_limit:
 *                       type: object
 *                       properties:
 *                         currency:
 *                           type: string
 *                         amount:
 *                           type: number
 *       404:
 *         description: Transação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Iniciando exclusão completa da transação: ${id}`);
    
    // 1. Buscar a transação
    const { data: transaction, error: transactionError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('id', id)
      .single();
    
    if (transactionError || !transaction) {
      console.error('❌ Transação não encontrada:', transactionError);
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }
    
    console.log('📊 Transação encontrada:', {
      id: transaction.id,
      type: transaction.operation_type,
      client_id: transaction.client_id,
      source_amount: transaction.source_amount,
      target_amount: transaction.target_amount,
      source_currency: transaction.source_currency,
      target_currency: transaction.target_currency
    });
    
    const reversions = {
      wallets: [],
      annual_limit: null
    };
    
    // 2. Reverter saldos das carteiras baseado no tipo de operação
    if (transaction.operation_type === 'fx_trade') {
      console.log('🔄 Revertendo FX Trade - 2 carteiras');
      
      // Para FX Trade (compra de USDT): 
      // - USDT: SUBTRAIR (cliente não deveria ter recebido)
      // - BRL: ADICIONAR (cliente deveria ter mantido o dinheiro)
      
      // Reverter USDT (subtrair - cliente não deveria ter recebido)
      const { data: usdtWallet, error: usdtFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.source_currency)
        .single();
      
      if (usdtFetchError && usdtFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira USDT:', usdtFetchError);
        throw usdtFetchError;
      }
      
      if (usdtWallet) {
        const newUsdtBalance = usdtWallet.balance - parseFloat(transaction.source_amount);
        const { error: usdtError } = await supabase
          .from('wallets')
          .update({ balance: newUsdtBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.source_currency);
        
        if (usdtError) {
          console.error('❌ Erro ao reverter USDT:', usdtError);
          throw usdtError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.source_currency,
        amount: parseFloat(transaction.source_amount),
        operation: 'subtract'
      });
      
      // Reverter BRL (adicionar - cliente deveria ter mantido o dinheiro)
      const { data: brlWallet, error: brlFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.target_currency)
        .single();
      
      if (brlFetchError && brlFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira BRL:', brlFetchError);
        throw brlFetchError;
      }
      
      if (brlWallet) {
        const newBrlBalance = brlWallet.balance + parseFloat(transaction.target_amount);
        const { error: brlError } = await supabase
          .from('wallets')
          .update({ balance: newBrlBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.target_currency);
        
        if (brlError) {
          console.error('❌ Erro ao reverter BRL:', brlError);
          throw brlError;
        }
      } else {
        // Criar nova carteira BRL se não existir
        const { error: brlError } = await supabase
          .from('wallets')
          .insert({
            client_id: transaction.client_id,
            currency: transaction.target_currency,
            balance: parseFloat(transaction.target_amount),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (brlError) {
          console.error('❌ Erro ao criar carteira BRL:', brlError);
          throw brlError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.target_currency,
        amount: parseFloat(transaction.target_amount),
        operation: 'add'
      });
      
      // 3. Reverter limite anual para FX Trade (comentado - tabela não existe)
      // const { data: annualUsage, error: annualFetchError } = await supabase
      //   .from('annual_usage_limits')
      //   .select('*')
      //   .eq('client_id', transaction.client_id)
      //   .eq('currency', transaction.source_currency)
      //   .single();
      
      // if (annualFetchError && annualFetchError.code !== 'PGRST116') {
      //   console.error('❌ Erro ao buscar limite anual:', annualFetchError);
      //   throw annualFetchError;
      // }
      
      // if (annualUsage) {
      //   const newUsage = Math.max(0, annualUsage.used_amount - parseFloat(transaction.source_amount));
      //   const { error: annualError } = await supabase
      //     .from('annual_usage_limits')
      //     .update({ used_amount: newUsage, updated_at: new Date().toISOString() })
      //     .eq('client_id', transaction.client_id)
      //     .eq('currency', transaction.source_currency);
      
      //   if (annualError) {
      //     console.error('❌ Erro ao reverter limite anual:', annualError);
      //     throw annualError;
      //   }
      // }
      
      // reversions.annual_limit = {
      //   currency: transaction.source_currency,
      //   amount: parseFloat(transaction.source_amount),
      //   operation: 'subtract'
      // };
      
    } else if (transaction.operation_type === 'arbitrage') {
      console.log('🔄 Revertendo Arbitragem - 2 carteiras');
      
      // Reverter moeda origem (adicionar de volta)
      const { data: sourceWallet, error: sourceFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.source_currency)
        .single();
      
      if (sourceFetchError && sourceFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira origem:', sourceFetchError);
        throw sourceFetchError;
      }
      
      if (sourceWallet) {
        const newSourceBalance = sourceWallet.balance + parseFloat(transaction.source_amount);
        const { error: sourceError } = await supabase
          .from('wallets')
          .update({ balance: newSourceBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.source_currency);
        
        if (sourceError) {
          console.error('❌ Erro ao reverter moeda origem:', sourceError);
          throw sourceError;
        }
      } else {
        // Criar nova carteira se não existir
        const { error: sourceError } = await supabase
          .from('wallets')
          .insert({
            client_id: transaction.client_id,
            currency: transaction.source_currency,
            balance: parseFloat(transaction.source_amount),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (sourceError) {
          console.error('❌ Erro ao criar carteira origem:', sourceError);
          throw sourceError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.source_currency,
        amount: parseFloat(transaction.source_amount),
        operation: 'add'
      });
      
      // Reverter moeda destino (subtrair)
      const { data: targetWallet, error: targetFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.target_currency)
        .single();
      
      if (targetFetchError && targetFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira destino:', targetFetchError);
        throw targetFetchError;
      }
      
      if (targetWallet) {
        const newTargetBalance = targetWallet.balance - parseFloat(transaction.target_amount);
        const { error: targetError } = await supabase
          .from('wallets')
          .update({ balance: newTargetBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.target_currency);
        
        if (targetError) {
          console.error('❌ Erro ao reverter moeda destino:', targetError);
          throw targetError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.target_currency,
        amount: parseFloat(transaction.target_amount),
        operation: 'subtract'
      });
      
    } else if (transaction.operation_type === 'transfer') {
      console.log('🔄 Revertendo Transferência - 1 carteira');
      
      // Reverter moeda origem (adicionar de volta)
      const { data: transferWallet, error: transferFetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('client_id', transaction.client_id)
        .eq('currency', transaction.source_currency)
        .single();
      
      if (transferFetchError && transferFetchError.code !== 'PGRST116') {
        console.error('❌ Erro ao buscar carteira transferência:', transferFetchError);
        throw transferFetchError;
      }
      
      if (transferWallet) {
        const newTransferBalance = transferWallet.balance + parseFloat(transaction.source_amount);
        const { error: transferError } = await supabase
          .from('wallets')
          .update({ balance: newTransferBalance, updated_at: new Date().toISOString() })
          .eq('client_id', transaction.client_id)
          .eq('currency', transaction.source_currency);
        
        if (transferError) {
          console.error('❌ Erro ao reverter transferência:', transferError);
          throw transferError;
        }
      } else {
        // Criar nova carteira se não existir
        const { error: transferError } = await supabase
          .from('wallets')
          .insert({
            client_id: transaction.client_id,
            currency: transaction.source_currency,
            balance: parseFloat(transaction.source_amount),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (transferError) {
          console.error('❌ Erro ao criar carteira transferência:', transferError);
          throw transferError;
        }
      }
      
      reversions.wallets.push({
        currency: transaction.source_currency,
        amount: parseFloat(transaction.source_amount),
        operation: 'add'
      });
    }
    
    // 4. Excluir a transação do histórico
    const { error: deleteError } = await supabase
      .from('operations_history')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('❌ Erro ao excluir transação:', deleteError);
      throw deleteError;
    }
    
    console.log('✅ Transação excluída com sucesso:', {
      id: transaction.id,
      reversions: reversions
    });
    
    res.json({
      success: true,
      message: 'Transação excluída e saldos revertidos com sucesso',
      reversions: reversions
    });
    
  } catch (error) {
    console.error('❌ Erro na exclusão da transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/transactions/{id}:
 *   put:
 *     summary: Atualizar status da transação
 *     description: Atualiza o status de uma transação. Se o status for alterado para 'cancelado', reverte automaticamente os saldos das carteiras e o limite anual usado.
 *     tags: [Admin - Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da transação a ser atualizada
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, executed, failed, cancelado]
 *                 description: Novo status da transação
 *               notes:
 *                 type: string
 *                 description: Notas adicionais
 *     responses:
 *       200:
 *         description: Status da transação atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                 reversions:
 *                   type: object
 *                   description: Dados das reversões realizadas (apenas quando status = cancelado)
 *       404:
 *         description: Transação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      status, 
      notes,
      source_amount,
      target_amount,
      exchange_rate,
      base_rate,
      final_rate,
      markup_percentage,
      fee_amount,
      beneficiary_name,
      beneficiary_account,
      beneficiary_bank_name,
      beneficiary_iban,
      beneficiary_swift_bic,
      transfer_method,
      attachment_url_1,
      attachment_url_2
    } = req.body;
    
    console.log(`🔄 Atualizando transação ${id} com status: ${status}`);
    
    // 1. Buscar a transação atual
    const { data: transaction, error: transactionError } = await supabase
      .from('operations_history')
      .select('*')
      .eq('id', id)
      .single();
    
    if (transactionError || !transaction) {
      console.error('❌ Transação não encontrada:', transactionError);
      return res.status(404).json({
        success: false,
        message: 'Transação não encontrada'
      });
    }
    
    console.log('📊 Transação encontrada:', {
      id: transaction.id,
      current_status: transaction.status,
      new_status: status,
      type: transaction.operation_type,
      client_id: transaction.client_id
    });
    
    // 2. Verificar se houve mudança de valores que requer ajuste nas carteiras
    let needsWalletAdjustment = false;
    let walletAdjustments = null;
    
    // Verificar se os valores foram alterados
    const amountChanged = (source_amount !== undefined && source_amount !== transaction.source_amount) ||
                         (target_amount !== undefined && target_amount !== transaction.target_amount);
    
    if (amountChanged) {
      needsWalletAdjustment = true;
      walletAdjustments = {
        wallets: [],
        annual_limit: null,
        action: 'adjust'
      };
      
      console.log('💰 Valores alterados - calculando ajustes nas carteiras');
      
      // Calcular diferenças
      const oldSourceAmount = parseFloat(transaction.source_amount);
      const oldTargetAmount = parseFloat(transaction.target_amount);
      const newSourceAmount = parseFloat(source_amount !== undefined ? source_amount : transaction.source_amount);
      const newTargetAmount = parseFloat(target_amount !== undefined ? target_amount : transaction.target_amount);
      
      console.log('📊 Diferenças calculadas:', {
        old_source: oldSourceAmount,
        new_source: newSourceAmount,
        old_target: oldTargetAmount,
        new_target: newTargetAmount,
        source_diff: newSourceAmount - oldSourceAmount,
        target_diff: newTargetAmount - oldTargetAmount
      });
      
      // Ajustar carteiras baseado no tipo de operação
      if (transaction.operation_type === 'external_deposit') {
        // Depósito externo: ajustar apenas a moeda de destino (source_amount = target_amount para external_deposit)
        const amountDiff = newTargetAmount - oldTargetAmount;
        
        if (amountDiff !== 0) {
          const adjustResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.target_currency,
            Math.abs(amountDiff),
            amountDiff > 0 ? 'add' : 'subtract'
          );
          
          if (!adjustResult.success) {
            console.error('❌ Erro ao ajustar carteira:', adjustResult.error);
            throw new Error(adjustResult.error);
          }
          
          walletAdjustments.wallets.push({
            currency: transaction.target_currency,
            amount: Math.abs(amountDiff),
            operation: amountDiff > 0 ? 'add' : 'subtract'
          });
          
          // Ajustar limite anual (apenas para BRL)
          if (transaction.target_currency === 'BRL') {
            const limitAdjustResult = await clientLimitsService.updateAnnualUsage(
              transaction.client_id,
              amountDiff
            );
            
            if (!limitAdjustResult.success) {
              console.error('❌ Erro ao ajustar limite anual:', limitAdjustResult.error);
              throw new Error(limitAdjustResult.error);
            }
            
            walletAdjustments.annual_limit = {
              currency: 'BRL',
              amount: Math.abs(amountDiff),
              operation: amountDiff > 0 ? 'add' : 'subtract'
            };
          }
        }
        
      } else if (transaction.operation_type === 'fx_trade') {
        // FX Trade: ajustar ambas as moedas
        const sourceDiff = newSourceAmount - oldSourceAmount;
        const targetDiff = newTargetAmount - oldTargetAmount;
        
        // Ajustar moeda origem
        if (sourceDiff !== 0) {
          const adjustSourceResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.source_currency,
            Math.abs(sourceDiff),
            sourceDiff > 0 ? 'add' : 'subtract'
          );
          
          if (!adjustSourceResult.success) {
            console.error('❌ Erro ao ajustar carteira origem:', adjustSourceResult.error);
            throw new Error(adjustSourceResult.error);
          }
          
          walletAdjustments.wallets.push({
            currency: transaction.source_currency,
            amount: Math.abs(sourceDiff),
            operation: sourceDiff > 0 ? 'add' : 'subtract'
          });
        }
        
        // Ajustar moeda destino
        if (targetDiff !== 0) {
          const adjustTargetResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.target_currency,
            Math.abs(targetDiff),
            targetDiff > 0 ? 'add' : 'subtract'
          );
          
          if (!adjustTargetResult.success) {
            console.error('❌ Erro ao ajustar carteira destino:', adjustTargetResult.error);
            throw new Error(adjustTargetResult.error);
          }
          
          walletAdjustments.wallets.push({
            currency: transaction.target_currency,
            amount: Math.abs(targetDiff),
            operation: targetDiff > 0 ? 'add' : 'subtract'
          });
          
          // Ajustar limite anual (apenas para BRL)
          if (transaction.target_currency === 'BRL') {
            const limitAdjustResult = await clientLimitsService.updateAnnualUsage(
              transaction.client_id,
              targetDiff
            );
            
            if (!limitAdjustResult.success) {
              console.error('❌ Erro ao ajustar limite anual:', limitAdjustResult.error);
              throw new Error(limitAdjustResult.error);
            }
            
            walletAdjustments.annual_limit = {
              currency: 'BRL',
              amount: Math.abs(targetDiff),
              operation: targetDiff > 0 ? 'add' : 'subtract'
            };
          }
        }
        
      } else if (transaction.operation_type === 'transfer') {
        // Transferência: ajustar apenas a moeda origem (valor que sai)
        const amountDiff = newSourceAmount - oldSourceAmount;
        
        if (amountDiff !== 0) {
          const adjustResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.source_currency,
            Math.abs(amountDiff),
            amountDiff > 0 ? 'add' : 'subtract'
          );
          
          if (!adjustResult.success) {
            console.error('❌ Erro ao ajustar carteira:', adjustResult.error);
            throw new Error(adjustResult.error);
          }
          
          walletAdjustments.wallets.push({
            currency: transaction.source_currency,
            amount: Math.abs(amountDiff),
            operation: amountDiff > 0 ? 'add' : 'subtract'
          });
          
          // Ajustar limite anual (apenas para BRL)
          if (transaction.source_currency === 'BRL') {
            const limitAdjustResult = await clientLimitsService.updateAnnualUsage(
              transaction.client_id,
              amountDiff
            );
            
            if (!limitAdjustResult.success) {
              console.error('❌ Erro ao ajustar limite anual:', limitAdjustResult.error);
              throw new Error(limitAdjustResult.error);
            }
            
            walletAdjustments.annual_limit = {
              currency: 'BRL',
              amount: Math.abs(amountDiff),
              operation: amountDiff > 0 ? 'add' : 'subtract'
            };
          }
        }
      }
      
      console.log('✅ Ajustes de carteira realizados:', walletAdjustments);
    }
    
    // 3. Determinar se precisa reverter ou aplicar saldos baseado na mudança de status
    let reversions = null;
    let needsReversion = false;
    let needsExecution = false;
    
    // Status que requerem reversão de saldos (como excluir)
    const revertStatuses = ['cancelado', 'failed'];
    // Status que requerem aplicação de saldos (como executar)
    const executeStatuses = ['executed', 'pending'];
    
    // Determinar ação baseada na mudança de status
    if (revertStatuses.includes(status) && !revertStatuses.includes(transaction.status)) {
      // Mudando para status que requer reversão
      needsReversion = true;
      console.log(`🔄 Status alterado de '${transaction.status}' para '${status}' - iniciando reversão de saldos`);
    } else if (executeStatuses.includes(status) && revertStatuses.includes(transaction.status)) {
      // Mudando de status de reversão para status de execução
      needsExecution = true;
      console.log(`🔄 Status alterado de '${transaction.status}' para '${status}' - iniciando aplicação de saldos`);
    } else {
      console.log(`ℹ️ Mudança de status de '${transaction.status}' para '${status}' - nenhuma ação de saldo necessária`);
    }
    
    if (needsReversion) {
      reversions = {
        wallets: [],
        annual_limit: null,
        action: 'revert'
      };
      
      // Reverter saldos das carteiras baseado no tipo de operação
      if (transaction.operation_type === 'fx_trade') {
        const side = transaction.side || 'buy';
        
        if (side === 'buy') {
          // Compra: reverter adicionando BRL e subtraindo USDT
          const addBrlResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.target_currency,
            parseFloat(transaction.target_amount),
            'add'
          );
          
          const subtractUsdtResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.source_currency,
            parseFloat(transaction.source_amount),
            'subtract'
          );
          
          if (!addBrlResult.success) {
            console.error('❌ Erro ao reverter BRL:', addBrlResult.error);
            throw new Error(addBrlResult.error);
          }
          
          if (!subtractUsdtResult.success) {
            console.error('❌ Erro ao reverter USDT:', subtractUsdtResult.error);
            throw new Error(subtractUsdtResult.error);
          }
          
          reversions.wallets.push({
            currency: transaction.target_currency,
            amount: parseFloat(transaction.target_amount),
            operation: 'add'
          });
          
          reversions.wallets.push({
            currency: transaction.source_currency,
            amount: parseFloat(transaction.source_amount),
            operation: 'subtract'
          });
          
        } else {
          // Venda: reverter subtraindo BRL e adicionando USDT
          const subtractBrlResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.target_currency,
            parseFloat(transaction.target_amount),
            'subtract'
          );
          
          const addUsdtResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.source_currency,
            parseFloat(transaction.source_amount),
            'add'
          );
          
          if (!subtractBrlResult.success) {
            console.error('❌ Erro ao reverter BRL:', subtractBrlResult.error);
            throw new Error(subtractBrlResult.error);
          }
          
          if (!addUsdtResult.success) {
            console.error('❌ Erro ao reverter USDT:', addUsdtResult.error);
            throw new Error(addUsdtResult.error);
          }
          
          reversions.wallets.push({
            currency: transaction.target_currency,
            amount: parseFloat(transaction.target_amount),
            operation: 'subtract'
          });
          
          reversions.wallets.push({
            currency: transaction.source_currency,
            amount: parseFloat(transaction.source_amount),
            operation: 'add'
          });
        }
        
        // Reverter limite anual usado
        const amountBrl = parseFloat(transaction.target_amount || transaction.source_amount);
        const revertLimitResult = await clientLimitsService.updateAnnualUsage(
          transaction.client_id,
          -amountBrl // Valor negativo para subtrair
        );
        
        if (!revertLimitResult.success) {
          console.error('❌ Erro ao reverter limite anual:', revertLimitResult.error);
          throw new Error(revertLimitResult.error);
        }
        
        reversions.annual_limit = {
          currency: 'BRL',
          amount: amountBrl,
          operation: 'subtract'
        };
        
      } else if (transaction.operation_type === 'transfer') {
        // Transferência: reverter adicionando o valor de volta
        const revertTransferResult = await walletsService.updateWalletBalance(
          transaction.client_id,
          transaction.source_currency,
          parseFloat(transaction.source_amount),
          'add'
        );
        
        if (!revertTransferResult.success) {
          console.error('❌ Erro ao reverter transferência:', revertTransferResult.error);
          throw new Error(revertTransferResult.error);
        }
        
        reversions.wallets.push({
          currency: transaction.source_currency,
          amount: parseFloat(transaction.source_amount),
          operation: 'add'
        });
        
        // Reverter limite anual usado
        const amountBrl = parseFloat(transaction.source_amount);
        const revertLimitResult = await clientLimitsService.updateAnnualUsage(
          transaction.client_id,
          -amountBrl // Valor negativo para subtrair
        );
        
        if (!revertLimitResult.success) {
          console.error('❌ Erro ao reverter limite anual:', revertLimitResult.error);
          throw new Error(revertLimitResult.error);
        }
        
        reversions.annual_limit = {
          currency: 'BRL',
          amount: amountBrl,
          operation: 'subtract'
        };
        
      } else if (transaction.operation_type === 'external_deposit') {
        // Depósito externo: reverter subtraindo o valor
        const revertDepositResult = await walletsService.updateWalletBalance(
          transaction.client_id,
          transaction.target_currency,
          parseFloat(transaction.target_amount),
          'subtract'
        );
        
        if (!revertDepositResult.success) {
          console.error('❌ Erro ao reverter depósito externo:', revertDepositResult.error);
          throw new Error(revertDepositResult.error);
        }
        
        reversions.wallets.push({
          currency: transaction.target_currency,
          amount: parseFloat(transaction.target_amount),
          operation: 'subtract'
        });
        
        // Reverter limite anual usado (se aplicável)
        const amountBrl = parseFloat(transaction.target_amount);
        const revertLimitResult = await clientLimitsService.updateAnnualUsage(
          transaction.client_id,
          -amountBrl // Valor negativo para subtrair
        );
        
        if (!revertLimitResult.success) {
          console.error('❌ Erro ao reverter limite anual:', revertLimitResult.error);
          throw new Error(revertLimitResult.error);
        }
        
        reversions.annual_limit = {
          currency: 'BRL',
          amount: amountBrl,
          operation: 'subtract'
        };
      }
      
      console.log('✅ Reversões realizadas:', reversions);
    }
    
    if (needsExecution) {
      reversions = {
        wallets: [],
        annual_limit: null,
        action: 'execute'
      };
      
      // Aplicar saldos das carteiras baseado no tipo de operação (oposto da reversão)
      if (transaction.operation_type === 'fx_trade') {
        const side = transaction.side || 'buy';
        
        if (side === 'buy') {
          // Compra: adicionar USDT e subtrair BRL (oposto da reversão)
          const addUsdtResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.source_currency,
            parseFloat(transaction.source_amount),
            'add'
          );
          
          const subtractBrlResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.target_currency,
            parseFloat(transaction.target_amount),
            'subtract'
          );
          
          if (!addUsdtResult.success) {
            console.error('❌ Erro ao aplicar USDT:', addUsdtResult.error);
            throw new Error(addUsdtResult.error);
          }
          
          if (!subtractBrlResult.success) {
            console.error('❌ Erro ao aplicar BRL:', subtractBrlResult.error);
            throw new Error(subtractBrlResult.error);
          }
          
          reversions.wallets.push({
            currency: transaction.source_currency,
            amount: parseFloat(transaction.source_amount),
            operation: 'add'
          });
          
          reversions.wallets.push({
            currency: transaction.target_currency,
            amount: parseFloat(transaction.target_amount),
            operation: 'subtract'
          });
          
        } else {
          // Venda: subtrair USDT e adicionar BRL (oposto da reversão)
          const subtractUsdtResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.source_currency,
            parseFloat(transaction.source_amount),
            'subtract'
          );
          
          const addBrlResult = await walletsService.updateWalletBalance(
            transaction.client_id,
            transaction.target_currency,
            parseFloat(transaction.target_amount),
            'add'
          );
          
          if (!subtractUsdtResult.success) {
            console.error('❌ Erro ao aplicar USDT:', subtractUsdtResult.error);
            throw new Error(subtractUsdtResult.error);
          }
          
          if (!addBrlResult.success) {
            console.error('❌ Erro ao aplicar BRL:', addBrlResult.error);
            throw new Error(addBrlResult.error);
          }
          
          reversions.wallets.push({
            currency: transaction.source_currency,
            amount: parseFloat(transaction.source_amount),
            operation: 'subtract'
          });
          
          reversions.wallets.push({
            currency: transaction.target_currency,
            amount: parseFloat(transaction.target_amount),
            operation: 'add'
          });
        }
        
        // Aplicar limite anual usado
        const amountBrl = parseFloat(transaction.target_amount || transaction.source_amount);
        const applyLimitResult = await clientLimitsService.updateAnnualUsage(
          transaction.client_id,
          amountBrl // Valor positivo para adicionar
        );
        
        if (!applyLimitResult.success) {
          console.error('❌ Erro ao aplicar limite anual:', applyLimitResult.error);
          throw new Error(applyLimitResult.error);
        }
        
        reversions.annual_limit = {
          currency: 'BRL',
          amount: amountBrl,
          operation: 'add'
        };
        
      } else if (transaction.operation_type === 'transfer') {
        // Transferência: subtrair o valor (oposto da reversão)
        const applyTransferResult = await walletsService.updateWalletBalance(
          transaction.client_id,
          transaction.source_currency,
          parseFloat(transaction.source_amount),
          'subtract'
        );
        
        if (!applyTransferResult.success) {
          console.error('❌ Erro ao aplicar transferência:', applyTransferResult.error);
          throw new Error(applyTransferResult.error);
        }
        
        reversions.wallets.push({
          currency: transaction.source_currency,
          amount: parseFloat(transaction.source_amount),
          operation: 'subtract'
        });
        
        // Aplicar limite anual usado
        const amountBrl = parseFloat(transaction.source_amount);
        const applyLimitResult = await clientLimitsService.updateAnnualUsage(
          transaction.client_id,
          amountBrl // Valor positivo para adicionar
        );
        
        if (!applyLimitResult.success) {
          console.error('❌ Erro ao aplicar limite anual:', applyLimitResult.error);
          throw new Error(applyLimitResult.error);
        }
        
        reversions.annual_limit = {
          currency: 'BRL',
          amount: amountBrl,
          operation: 'add'
        };
        
      } else if (transaction.operation_type === 'external_deposit') {
        // Depósito externo: aplicar adicionando o valor
        const applyDepositResult = await walletsService.updateWalletBalance(
          transaction.client_id,
          transaction.target_currency,
          parseFloat(transaction.target_amount),
          'add'
        );
        
        if (!applyDepositResult.success) {
          console.error('❌ Erro ao aplicar depósito externo:', applyDepositResult.error);
          throw new Error(applyDepositResult.error);
        }
        
        reversions.wallets.push({
          currency: transaction.target_currency,
          amount: parseFloat(transaction.target_amount),
          operation: 'add'
        });
        
        // Aplicar limite anual usado (se aplicável)
        const amountBrl = parseFloat(transaction.target_amount);
        const applyLimitResult = await clientLimitsService.updateAnnualUsage(
          transaction.client_id,
          amountBrl // Valor positivo para adicionar
        );
        
        if (!applyLimitResult.success) {
          console.error('❌ Erro ao aplicar limite anual:', applyLimitResult.error);
          throw new Error(applyLimitResult.error);
        }
        
        reversions.annual_limit = {
          currency: 'BRL',
          amount: amountBrl,
          operation: 'add'
        };
      }
      
      console.log('✅ Aplicações de saldo realizadas:', reversions);
    }
    
    // 3. Atualizar dados da transação
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (source_amount !== undefined) updates.source_amount = source_amount;
    if (target_amount !== undefined) updates.target_amount = target_amount;
    if (exchange_rate !== undefined) updates.exchange_rate = exchange_rate;
    if (base_rate !== undefined) updates.base_rate = base_rate;
    if (final_rate !== undefined) updates.final_rate = final_rate;
    if (markup_percentage !== undefined) updates.markup_percentage = markup_percentage;
    if (fee_amount !== undefined) updates.fee_amount = fee_amount;
    if (beneficiary_name !== undefined) updates.beneficiary_name = beneficiary_name;
    if (beneficiary_account !== undefined) updates.beneficiary_account = beneficiary_account;
    if (beneficiary_bank_name !== undefined) updates.beneficiary_bank_name = beneficiary_bank_name;
    if (beneficiary_iban !== undefined) updates.beneficiary_iban = beneficiary_iban;
    if (beneficiary_swift_bic !== undefined) updates.beneficiary_swift_bic = beneficiary_swift_bic;
    if (transfer_method !== undefined) updates.transfer_method = transfer_method;
    if (attachment_url_1 !== undefined) updates.attachment_url_1 = attachment_url_1;
    if (attachment_url_2 !== undefined) updates.attachment_url_2 = attachment_url_2;
    updates.updated_at = new Date().toISOString();
    
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('operations_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Erro ao atualizar transação:', updateError);
      throw updateError;
    }
    
    console.log('✅ Transação atualizada com sucesso:', {
      id: updatedTransaction.id,
      status: updatedTransaction.status,
      reversions: reversions,
      walletAdjustments: walletAdjustments
    });
    
    let responseMessage = 'Transação atualizada com sucesso';
    if (walletAdjustments) {
      responseMessage = 'Transação atualizada e saldos ajustados com sucesso';
    } else if (reversions) {
      if (reversions.action === 'revert') {
        responseMessage = 'Transação cancelada/falhou e saldos revertidos com sucesso';
      } else if (reversions.action === 'execute') {
        responseMessage = 'Transação executada/pendente e saldos aplicados com sucesso';
      }
    }
    
    const response = {
      success: true,
      message: responseMessage,
      data: updatedTransaction
    };
    
    if (walletAdjustments) {
      response.walletAdjustments = walletAdjustments;
    }
    
    if (reversions) {
      response.reversions = reversions;
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Erro na atualização da transação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;