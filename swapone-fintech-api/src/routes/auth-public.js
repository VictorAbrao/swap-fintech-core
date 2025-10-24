const express = require('express');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login e obter token JWT
 *     description: Endpoint de autenticação para obter token de acesso à API
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
 *                 description: Email de login do usuário
 *                 example: cliente@swapone.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Senha do usuário
 *                 example: cliente123
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
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   description: Token JWT para autenticação nas próximas requisições
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "uuid-do-usuario"
 *                     email:
 *                       type: string
 *                       example: "cliente@swapone.com"
 *                     role:
 *                       type: string
 *                       example: "client"
 *                       description: Perfil do usuário (client, admin, ops)
 *                     client_id:
 *                       type: string
 *                       example: "uuid-do-cliente"
 *                     twofa_enabled:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Dados inválidos ou faltando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing credentials"
 *                 message:
 *                   type: string
 *                   example: "Email and password are required"
 *       401:
 *         description: Credenciais inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid credentials"
 *                 message:
 *                   type: string
 *                   example: "Email or password is incorrect"
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 message:
 *                   type: string
 */

// Este arquivo é apenas para documentação do Swagger Público
// A rota real está em ./auth.js

module.exports = router;



