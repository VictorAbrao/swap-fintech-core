const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireClientOrAbove } = require('../middleware/auth');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * @swagger
 * /api/beneficiaries:
 *   get:
 *     summary: Listar beneficiários do cliente
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de beneficiários
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
 *                       beneficiary_name:
 *                         type: string
 *                       transfer_method:
 *                         type: string
 *                       beneficiary_iban:
 *                         type: string
 *                       beneficiary_swift_bic:
 *                         type: string
 *                       beneficiary_routing_number:
 *                         type: string
 *                       created_at:
 *                         type: string
 */
router.get('/', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 Beneficiaries endpoint - User ID:', userId);
    
    // Buscar client_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    console.log('🔍 Profile query result:', { profile, profileError });
    
    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError);
      return res.status(400).json({
        success: false,
        error: 'Profile not found',
        message: 'Perfil do usuário não encontrado'
      });
    }
    
    const clientId = profile.client_id;
    
    // Buscar beneficiários do cliente
    const { data: beneficiaries, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching beneficiaries:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Erro ao buscar beneficiários'
      });
    }
    
    res.json({
      success: true,
      data: beneficiaries || []
    });
    
  } catch (error) {
    console.error('Beneficiaries fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/beneficiaries:
 *   post:
 *     summary: Criar novo beneficiário
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - beneficiary_name
 *               - transfer_method
 *             properties:
 *               beneficiary_name:
 *                 type: string
 *                 description: Nome do beneficiário
 *               transfer_method:
 *                 type: string
 *                 enum: [SEPA, SWIFT, ACH]
 *                 description: Método de transferência
 *               beneficiary_iban:
 *                 type: string
 *                 description: IBAN (para SEPA)
 *               beneficiary_bic:
 *                 type: string
 *                 description: BIC/SWIFT (para SEPA, opcional)
 *               beneficiary_swift_bic:
 *                 type: string
 *                 description: SWIFT/BIC Code (para SWIFT)
 *               beneficiary_account_number:
 *                 type: string
 *                 description: Account Number (para SWIFT)
 *               beneficiary_bank_name:
 *                 type: string
 *                 description: Bank Name (para SWIFT)
 *               beneficiary_bank_address:
 *                 type: string
 *                 description: Bank Address (para SWIFT)
 *               intermediary_bank_swift:
 *                 type: string
 *                 description: Intermediary Bank SWIFT (opcional)
 *               beneficiary_routing_number:
 *                 type: string
 *                 description: Routing Number (para ACH)
 *               beneficiary_account_number_ach:
 *                 type: string
 *                 description: Account Number (para ACH)
 *               beneficiary_account_type:
 *                 type: string
 *                 description: Account Type (para ACH)
 *     responses:
 *       201:
 *         description: Beneficiário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      beneficiary_name,
      transfer_method,
      beneficiary_iban,
      beneficiary_bic,
      beneficiary_swift_bic,
      beneficiary_account_number,
      beneficiary_bank_name,
      beneficiary_bank_address,
      intermediary_bank_swift,
      beneficiary_routing_number,
      beneficiary_account_number_ach,
      beneficiary_account_type
    } = req.body;
    
    // Validação básica
    if (!beneficiary_name || !transfer_method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Nome do beneficiário e método de transferência são obrigatórios'
      });
    }
    
    if (!['SEPA', 'SWIFT', 'ACH'].includes(transfer_method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transfer method',
        message: 'Método de transferência inválido'
      });
    }
    
    // Buscar client_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile not found',
        message: 'Perfil do usuário não encontrado'
      });
    }
    
    const clientId = profile.client_id;
    
    // Preparar dados do beneficiário
    const beneficiaryData = {
      client_id: clientId,
      beneficiary_name,
      transfer_method,
      beneficiary_iban: beneficiary_iban || null,
      beneficiary_bic: beneficiary_bic || null,
      beneficiary_swift_bic: beneficiary_swift_bic || null,
      beneficiary_account_number: beneficiary_account_number || null,
      beneficiary_bank_name: beneficiary_bank_name || null,
      beneficiary_bank_address: beneficiary_bank_address || null,
      intermediary_bank_swift: intermediary_bank_swift || null,
      beneficiary_routing_number: beneficiary_routing_number || null,
      beneficiary_account_number_ach: beneficiary_account_number_ach || null,
      beneficiary_account_type: beneficiary_account_type || null
    };
    
    // Inserir beneficiário
    const { data, error } = await supabase
      .from('beneficiaries')
      .insert([beneficiaryData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating beneficiary:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Erro ao criar beneficiário'
      });
    }
    
    res.status(201).json({
      success: true,
      data,
      message: 'Beneficiário criado com sucesso'
    });
    
  } catch (error) {
    console.error('Beneficiary creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/beneficiaries/{id}:
 *   delete:
 *     summary: Deletar beneficiário
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do beneficiário
 *     responses:
 *       200:
 *         description: Beneficiário deletado com sucesso
 *       404:
 *         description: Beneficiário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    // Buscar client_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile not found',
        message: 'Perfil do usuário não encontrado'
      });
    }
    
    const clientId = profile.client_id;
    
    // Deletar beneficiário (apenas do cliente do usuário)
    const { error } = await supabase
      .from('beneficiaries')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);
    
    if (error) {
      console.error('Error deleting beneficiary:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Erro ao deletar beneficiário'
      });
    }
    
    res.json({
      success: true,
      message: 'Beneficiário deletado com sucesso'
    });
    
  } catch (error) {
    console.error('Beneficiary deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;

/**
 * @swagger
 * /api/beneficiaries:
 *   get:
 *     summary: Listar beneficiários do cliente
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de beneficiários
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
 *                       beneficiary_name:
 *                         type: string
 *                       transfer_method:
 *                         type: string
 *                       beneficiary_iban:
 *                         type: string
 *                       beneficiary_swift_bic:
 *                         type: string
 *                       beneficiary_routing_number:
 *                         type: string
 *                       created_at:
 *                         type: string
 */
router.get('/', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log('🔍 Beneficiaries endpoint - User ID:', userId);
    
    // Buscar client_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    console.log('🔍 Profile query result:', { profile, profileError });
    
    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError);
      return res.status(400).json({
        success: false,
        error: 'Profile not found',
        message: 'Perfil do usuário não encontrado'
      });
    }
    
    const clientId = profile.client_id;
    
    // Buscar beneficiários do cliente
    const { data: beneficiaries, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching beneficiaries:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Erro ao buscar beneficiários'
      });
    }
    
    res.json({
      success: true,
      data: beneficiaries || []
    });
    
  } catch (error) {
    console.error('Beneficiaries fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/beneficiaries:
 *   post:
 *     summary: Criar novo beneficiário
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - beneficiary_name
 *               - transfer_method
 *             properties:
 *               beneficiary_name:
 *                 type: string
 *                 description: Nome do beneficiário
 *               transfer_method:
 *                 type: string
 *                 enum: [SEPA, SWIFT, ACH]
 *                 description: Método de transferência
 *               beneficiary_iban:
 *                 type: string
 *                 description: IBAN (para SEPA)
 *               beneficiary_bic:
 *                 type: string
 *                 description: BIC/SWIFT (para SEPA, opcional)
 *               beneficiary_swift_bic:
 *                 type: string
 *                 description: SWIFT/BIC Code (para SWIFT)
 *               beneficiary_account_number:
 *                 type: string
 *                 description: Account Number (para SWIFT)
 *               beneficiary_bank_name:
 *                 type: string
 *                 description: Bank Name (para SWIFT)
 *               beneficiary_bank_address:
 *                 type: string
 *                 description: Bank Address (para SWIFT)
 *               intermediary_bank_swift:
 *                 type: string
 *                 description: Intermediary Bank SWIFT (opcional)
 *               beneficiary_routing_number:
 *                 type: string
 *                 description: Routing Number (para ACH)
 *               beneficiary_account_number_ach:
 *                 type: string
 *                 description: Account Number (para ACH)
 *               beneficiary_account_type:
 *                 type: string
 *                 description: Account Type (para ACH)
 *     responses:
 *       201:
 *         description: Beneficiário criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      beneficiary_name,
      transfer_method,
      beneficiary_iban,
      beneficiary_bic,
      beneficiary_swift_bic,
      beneficiary_account_number,
      beneficiary_bank_name,
      beneficiary_bank_address,
      intermediary_bank_swift,
      beneficiary_routing_number,
      beneficiary_account_number_ach,
      beneficiary_account_type
    } = req.body;
    
    // Validação básica
    if (!beneficiary_name || !transfer_method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Nome do beneficiário e método de transferência são obrigatórios'
      });
    }
    
    if (!['SEPA', 'SWIFT', 'ACH'].includes(transfer_method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transfer method',
        message: 'Método de transferência inválido'
      });
    }
    
    // Buscar client_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile not found',
        message: 'Perfil do usuário não encontrado'
      });
    }
    
    const clientId = profile.client_id;
    
    // Preparar dados do beneficiário
    const beneficiaryData = {
      client_id: clientId,
      beneficiary_name,
      transfer_method,
      beneficiary_iban: beneficiary_iban || null,
      beneficiary_bic: beneficiary_bic || null,
      beneficiary_swift_bic: beneficiary_swift_bic || null,
      beneficiary_account_number: beneficiary_account_number || null,
      beneficiary_bank_name: beneficiary_bank_name || null,
      beneficiary_bank_address: beneficiary_bank_address || null,
      intermediary_bank_swift: intermediary_bank_swift || null,
      beneficiary_routing_number: beneficiary_routing_number || null,
      beneficiary_account_number_ach: beneficiary_account_number_ach || null,
      beneficiary_account_type: beneficiary_account_type || null
    };
    
    // Inserir beneficiário
    const { data, error } = await supabase
      .from('beneficiaries')
      .insert([beneficiaryData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating beneficiary:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Erro ao criar beneficiário'
      });
    }
    
    res.status(201).json({
      success: true,
      data,
      message: 'Beneficiário criado com sucesso'
    });
    
  } catch (error) {
    console.error('Beneficiary creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /api/beneficiaries/{id}:
 *   delete:
 *     summary: Deletar beneficiário
 *     tags: [Beneficiaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do beneficiário
 *     responses:
 *       200:
 *         description: Beneficiário deletado com sucesso
 *       404:
 *         description: Beneficiário não encontrado
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authenticateToken, requireClientOrAbove, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    
    // Buscar client_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('client_id')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return res.status(400).json({
        success: false,
        error: 'Profile not found',
        message: 'Perfil do usuário não encontrado'
      });
    }
    
    const clientId = profile.client_id;
    
    // Deletar beneficiário (apenas do cliente do usuário)
    const { error } = await supabase
      .from('beneficiaries')
      .delete()
      .eq('id', id)
      .eq('client_id', clientId);
    
    if (error) {
      console.error('Error deleting beneficiary:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: 'Erro ao deletar beneficiário'
      });
    }
    
    res.json({
      success: true,
      message: 'Beneficiário deletado com sucesso'
    });
    
  } catch (error) {
    console.error('Beneficiary deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
