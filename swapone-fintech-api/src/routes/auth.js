const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken } = require('../middleware/auth');
const brazaBankService = require('../services/brazaBankService');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login e obter token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: teste@swapone.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     client_id:
 *                       type: string
 *       401:
 *         description: Credenciais inválidas
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    // Autenticar com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, clients(*)')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        error: 'Profile not found',
        message: 'User profile not found'
      });
    }

    // clients(*) pode retornar um array ou objeto, pegar o primeiro elemento se for array
    const clientData = Array.isArray(profile.clients) && profile.clients.length > 0 
      ? profile.clients[0] 
      : (typeof profile.clients === 'object' && profile.clients !== null ? profile.clients : null);

    // Buscar dados do Braza Bank se o usuário tiver braza_id
    let brazaData = null;
    if (clientData?.braza_id) {
      try {
        brazaData = await brazaBankService.getClientInfo(clientData.braza_id);
      } catch (error) {
        console.log('Could not fetch Braza Bank data for user:', data.user.email);
      }
    }

    // Gerar JWT token
    const token = jwt.sign(
      {
        userId: data.user.id,
        email: data.user.email,
        role: profile.role,
        clientId: profile.client_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Preparar dados completos do usuário
    const userData = {
      id: data.user.id,
      email: data.user.email,
      role: profile.role,
      client_id: profile.client_id,
      client_name: clientData?.name,
      user_name: profile.user_name,
      twofa_enabled: profile.twofa_enabled,
      created_at: data.user.created_at,
      last_sign_in_at: data.user.last_sign_in_at,
      // Dados do cliente
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        cpf_cnpj: clientData.cnpj,
        braza_id: clientData.braza_id,
        created_at: clientData.created_at
      } : null,
      // Dados do Braza Bank
      braza_data: brazaData,
      // Metadados do usuário
      user_metadata: data.user.user_metadata || {}
    };

    res.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process login'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obter informações do usuário logado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informações do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     client_id:
 *                       type: string
 *       401:
 *         description: Token inválido
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, clients(*)')
      .eq('id', req.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({
        error: 'Profile not found',
        message: 'User profile not found'
      });
    }

    // clients(*) pode retornar um array ou objeto, pegar o primeiro elemento se for array
    const clientData = Array.isArray(profile.clients) && profile.clients.length > 0 
      ? profile.clients[0] 
      : (typeof profile.clients === 'object' && profile.clients !== null ? profile.clients : null);
    
    if (!clientData && profile.client_id) {
      console.log('⚠️ Client data not found in profile for user:', req.user.email, 'client_id:', profile.client_id);
    }

    // Buscar dados do Braza Bank se o usuário tiver braza_id
    let brazaData = null;
    if (clientData?.braza_id) {
      try {
        brazaData = await brazaBankService.getClientInfo(clientData.braza_id);
      } catch (error) {
        console.log('Could not fetch Braza Bank data for user:', req.user.email);
      }
    }

    // Preparar dados completos do usuário
    const userData = {
      id: req.user.id,
      email: req.user.email,
      role: profile.role,
      client_id: profile.client_id,
      client_name: clientData?.name,
      user_name: profile.user_name,
      twofa_enabled: profile.twofa_enabled,
      created_at: req.user.created_at,
      last_sign_in_at: req.user.last_sign_in_at,
      // Dados do cliente
      client: clientData ? {
        id: clientData.id,
        name: clientData.name,
        cpf_cnpj: clientData.cnpj,
        braza_id: clientData.braza_id,
        created_at: clientData.created_at
      } : null,
      // Dados do Braza Bank
      braza_data: brazaData,
      // Metadados do usuário
      user_metadata: req.user.user_metadata || {}
    };

    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user information'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Fazer logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Com Supabase, o logout é feito no frontend
    // Aqui podemos adicionar lógica adicional se necessário
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar token JWT
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       401:
 *         description: Token inválido
 */
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    // Gerar novo token
    const newToken = jwt.sign(
      {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        clientId: req.user.client_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to refresh token'
    });
  }
});

module.exports = router;
