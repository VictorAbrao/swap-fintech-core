const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * @swagger
 * /api/admin/kpis:
 *   get:
 *     summary: Obter KPIs financeiros detalhados
 *     tags: [Admin KPIs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de início (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Data de fim (YYYY-MM-DD)
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filtrar por moeda específica
 *       - in: query
 *         name: clientId
 *         schema:
 *           type: string
 *         description: Filtrar por cliente específico
 *     responses:
 *       200:
 *         description: KPIs obtidos com sucesso
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
 *                     totalProfit:
 *                       type: number
 *                       description: Lucro total em USD
 *                     totalVolume:
 *                       type: number
 *                       description: Volume total movimentado em USD
 *                     totalOperations:
 *                       type: number
 *                       description: Total de operações
 *                     profitByCurrency:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           currency:
 *                             type: string
 *                           profit:
 *                             type: number
 *                           volume:
 *                             type: number
 *                           operations:
 *                             type: number
 *                     profitByClient:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           clientId:
 *                             type: string
 *                           clientName:
 *                             type: string
 *                           profit:
 *                             type: number
 *                           volume:
 *                             type: number
 *                           operations:
 *                             type: number
 *                     monthlyTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           profit:
 *                             type: number
 *                           volume:
 *                             type: number
 *                           operations:
 *                             type: number
 *                     topClients:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           clientId:
 *                             type: string
 *                           clientName:
 *                             type: string
 *                           profit:
 *                             type: number
 *                           volume:
 *                             type: number
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, currency, clientId } = req.query;
    
    // Definir período padrão (últimos 30 dias se não especificado)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);
    
    const start = startDate ? new Date(startDate) : defaultStartDate;
    const end = endDate ? new Date(endDate) : defaultEndDate;
    
    console.log(`📊 Buscando KPIs de ${start.toISOString()} até ${end.toISOString()}`);
    
    // Construir query base
    let query = supabase
      .from('operations_history')
      .select(`
        id,
        operation_type,
        source_currency,
        target_currency,
        source_amount,
        target_amount,
        markup_percentage,
        fee_amount,
        final_rate,
        base_rate,
        created_at,
        client_id,
        clients!inner(name)
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .eq('status', 'executed');
    
    // Aplicar filtros
    if (currency) {
      query = query.or(`source_currency.eq.${currency},target_currency.eq.${currency}`);
    }
    
    if (clientId) {
      query = query.eq('client_id', clientId);
    }
    
    const { data: operations, error } = await query;
    
    if (error) {
      console.error('❌ Erro ao buscar operações:', error);
      throw error;
    }
    
    console.log(`📊 Encontradas ${operations?.length || 0} operações executadas`);
    
    // Taxas de câmbio para conversão (simuladas - em produção viria de API)
    const exchangeRates = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      BRL: 0.19,
      USDC: 1.0,
      USDT: 1.0
    };
    
    // Calcular métricas
    const metrics = calculateKPIs(operations || [], exchangeRates);
    
    res.json({
      success: true,
      data: {
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        filters: {
          currency: currency || null,
          clientId: clientId || null
        },
        ...metrics
      }
    });
    
  } catch (error) {
    console.error('KPIs error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to fetch KPIs data'
    });
  }
});

/**
 * Calcular KPIs baseado nas operações
 */
function calculateKPIs(operations, exchangeRates) {
  let totalProfit = 0;
  let totalVolume = 0;
  let totalOperations = operations.length;
  
  const profitByCurrency = {};
  const profitByClient = {};
  const monthlyData = {};
  
  // Processar cada operação
  operations.forEach(op => {
    const clientName = op.clients?.name || 'Cliente Desconhecido';
    
    // Calcular lucro baseado no markup e taxa fixa
    let profit = 0;
    let volume = 0;
    
    if (op.operation_type === 'fx_trade' || op.operation_type === 'arbitrage') {
      // Para FX Trade e Arbitragem, lucro vem do markup aplicado
      const markupPercentage = parseFloat(op.markup_percentage) || 0;
      const sourceAmount = parseFloat(op.source_amount) || 0;
      const baseRate = parseFloat(op.base_rate) || 1;
      const finalRate = parseFloat(op.final_rate) || 1;
      
      // Lucro = (taxa_cliente - taxa_base) * valor_origem (em BRL)
      profit = (finalRate - baseRate) * sourceAmount;
      volume = parseFloat(op.target_amount) || 0;
      
      // NÃO converter para USD - lucro já está em BRL
    } else if (op.operation_type === 'transfer') {
      // Para transferências, lucro vem da taxa fixa
      const feeAmount = parseFloat(op.fee_amount) || 0;
      profit = feeAmount;
      volume = parseFloat(op.source_amount) || 0;
      
      // NÃO converter para USD - valores já estão na moeda correta
    }
    
    // Acumular totais
    totalProfit += profit;
    totalVolume += volume;
    
    // Agrupar por moeda
    const currency = op.source_currency;
    if (!profitByCurrency[currency]) {
      profitByCurrency[currency] = {
        currency,
        profit: 0,
        volume: 0,
        operations: 0
      };
    }
    profitByCurrency[currency].profit += profit;
    profitByCurrency[currency].volume += volume;
    profitByCurrency[currency].operations += 1;
    
    // Agrupar por cliente
    if (!profitByClient[op.client_id]) {
      profitByClient[op.client_id] = {
        clientId: op.client_id,
        clientName,
        profit: 0,
        volume: 0,
        operations: 0
      };
    }
    profitByClient[op.client_id].profit += profit;
    profitByClient[op.client_id].volume += volume;
    profitByClient[op.client_id].operations += 1;
    
    // Agrupar por mês
    const month = new Date(op.created_at).toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        profit: 0,
        volume: 0,
        operations: 0
      };
    }
    monthlyData[month].profit += profit;
    monthlyData[month].volume += volume;
    monthlyData[month].operations += 1;
  });
  
  // Converter objetos para arrays e ordenar
  const profitByCurrencyArray = Object.values(profitByCurrency)
    .sort((a, b) => b.profit - a.profit);
  
  const profitByClientArray = Object.values(profitByClient)
    .sort((a, b) => b.profit - a.profit);
  
  const monthlyTrend = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month));
  
  const topClients = profitByClientArray.slice(0, 10);
  
  return {
    totalProfit: Math.round(totalProfit * 100) / 100,
    totalVolume: Math.round(totalVolume * 100) / 100,
    totalOperations,
    profitByCurrency: profitByCurrencyArray,
    profitByClient: profitByClientArray,
    monthlyTrend,
    topClients
  };
}

module.exports = router;
