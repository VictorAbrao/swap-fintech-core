const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/:clientId/markups', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    console.log(`🔍 [MARKUPS] Getting markups for client: ${clientId}`);

    const { data: markups, error } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', clientId)
      .order('from_currency')
      .order('to_currency');

    console.log(`📊 [MARKUPS] Query result: ${markups?.length || 0} markups, error: ${error?.message || 'none'}`);

    if (error) {
      console.error(`❌ [MARKUPS] Database error:`, error);
      throw error;
    }

    if (!markups || markups.length === 0) {
      console.log(`🔄 [MARKUPS] No markups found, creating new ones for client: ${clientId}`);
      // Create markups manually instead of using RPC
      const currencies = ['USD', 'EUR', 'GBP', 'USDT'];
      const markupsToCreate = [];
      
      for (const fromCurrency of currencies) {
        for (const toCurrency of currencies) {
          if (fromCurrency !== toCurrency) {
            markupsToCreate.push({
              client_id: clientId,
              from_currency: fromCurrency,
              to_currency: toCurrency,
              markup_percentage: 0.005, // 0.5% default
              fixed_rate_amount: 0.00, // 0.00 in target currency default
              active: true
            });
          }
        }
      }
      
      console.log(`📊 [MARKUPS] Creating ${markupsToCreate.length} markups...`);
      
      const { data: createdMarkups, error: createError } = await supabase
        .from('client_markups')
        .insert(markupsToCreate)
        .select();
      
      if (createError) {
        console.error(`❌ [MARKUPS] Create error:`, createError);
        throw createError;
      }
      
      console.log(`✅ [MARKUPS] Created ${createdMarkups.length} markups successfully`);
      
      const grouped = {
        USDT: createdMarkups.filter(m => m.from_currency === 'USDT'),
        USD: createdMarkups.filter(m => m.from_currency === 'USD'),
        EUR: createdMarkups.filter(m => m.from_currency === 'EUR'),
        GBP: createdMarkups.filter(m => m.from_currency === 'GBP')
      };

      console.log(`📊 [MARKUPS] Sending response with ${createdMarkups.length} markups`);
      return res.json({
        success: true,
        data: {
          markups: createdMarkups,
          grouped: grouped
        }
      });
    }

    console.log(`📊 [MARKUPS] Processing ${markups.length} existing markups...`);
    const grouped = {
      USDT: markups.filter(m => m.from_currency === 'USDT'),
      USD: markups.filter(m => m.from_currency === 'USD'),
      EUR: markups.filter(m => m.from_currency === 'EUR'),
      GBP: markups.filter(m => m.from_currency === 'GBP')
    };

    console.log(`📊 [MARKUPS] Grouped: USDT(${grouped.USDT.length}), USD(${grouped.USD.length}), EUR(${grouped.EUR.length}), GBP(${grouped.GBP.length})`);

    console.log(`✅ [MARKUPS] Sending response with ${markups.length} markups`);
    res.json({
      success: true,
      data: {
        markups: markups,
        grouped: grouped
      }
    });

  } catch (error) {
    console.error('Get client markups error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.put('/:clientId/markups/:markupId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId, markupId } = req.params;
    const { markup_percentage, fixed_rate_amount, active } = req.body;

    const updates = {};
    if (markup_percentage !== undefined) updates.markup_percentage = markup_percentage;
    if (fixed_rate_amount !== undefined) updates.fixed_rate_amount = fixed_rate_amount;
    if (active !== undefined) updates.active = active;

    const { data, error } = await supabase
      .from('client_markups')
      .update(updates)
      .eq('id', markupId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Update client markup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/:clientId/markups', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { from_currency, to_currency, markup_percentage, fixed_rate_amount } = req.body;

    if (!from_currency || !to_currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'from_currency and to_currency are required'
      });
    }

    const { data, error } = await supabase
      .from('client_markups')
      .insert([{
        client_id: clientId,
        from_currency,
        to_currency,
        markup_percentage: markup_percentage || 0,
        fixed_rate_amount: fixed_rate_amount || 0,
        active: true
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Create client markup error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

