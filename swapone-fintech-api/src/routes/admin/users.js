require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const emailService = require('../../services/emailService');

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * @swagger
 * /admin/users:
 *   post:
 *     summary: Criar novo usuário
 *     tags: [Admin - Usuários]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "usuario@exemplo.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "senha123"
 *               name:
 *                 type: string
 *                 example: "João Silva"
 *               role:
 *                 type: string
 *                 enum: [client, ops, admin]
 *                 example: "client"
 *               braza_id:
 *                 type: number
 *                 example: 32822
 *               cpf_cnpj:
 *                 type: string
 *                 example: "123.456.789-00"
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuário criado com sucesso"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "uuid-do-usuario"
 *                     email:
 *                       type: string
 *                       example: "usuario@exemplo.com"
 *                     role:
 *                       type: string
 *                       example: "client"
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email já está em uso"
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 */
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role, braza_id, cpf_cnpj } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, senha, nome e role são obrigatórios'
      });
    }

    if (!['client', 'ops', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role deve ser: client, ops ou admin'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    const { data: users, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (users && users.users) {
      const existingUser = users.users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email já está em uso'
        });
      }
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        braza_id,
        cpf_cnpj
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar usuário na autenticação'
      });
    }

    let profileData;
    
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (existingProfile) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', authData.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return res.status(500).json({
          success: false,
          message: 'Erro ao atualizar perfil do usuário'
        });
      }
      
      profileData = updatedProfile;
    } else {
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          role
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        
        await supabase.auth.admin.deleteUser(authData.user.id);
        
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar perfil do usuário'
        });
      }
      
      profileData = newProfile;
    }

    // Enviar email de criação de usuário
    try {
      console.log('📧 Enviando email de criação de usuário para:', email);
      
      const emailResult = await emailService.sendUserCreationEmail(email, {
        userName: name,
        email: email,
        password: password,
        role: role,
        clientName: req.body.clientName || null,
        loginUrl: process.env.FRONTEND_URL || 'https://app.swapone.global:5001/login'
      });

      if (emailResult.success) {
        console.log('✅ Email de criação enviado com sucesso:', emailResult.messageId);
      } else {
        console.warn('⚠️ Falha ao enviar email de criação:', emailResult.error);
        // Não falhar a criação do usuário se o email falhar
      }
    } catch (emailError) {
      console.error('❌ Erro ao enviar email de criação:', emailError);
      // Não falhar a criação do usuário se o email falhar
    }

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        name: authData.user.user_metadata?.name || name,
        role: profileData.role,
        braza_id: authData.user.user_metadata?.braza_id || null,
        cpf_cnpj: authData.user.user_metadata?.cpf_cnpj || null,
        created_at: authData.user.created_at
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Excluir usuário
 *     tags: [Admin - Usuários]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do usuário a ser excluído
 *         example: "uuid-do-usuario"
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Usuário excluído com sucesso"
 *       404:
 *         description: Usuário não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Usuário não encontrado"
 *       401:
 *         description: Não autorizado
 *       403:
 *         description: Acesso negado (não é admin)
 *       500:
 *         description: Erro interno do servidor
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID do usuário é obrigatório'
      });
    }

    console.log(`🗑️ Deleting user: ${id}`);

    // Primeiro, verificar se o usuário existe
    const { data: existingUser, error: fetchError } = await supabase.auth.admin.getUserById(id);
    
    if (fetchError || !existingUser.user) {
      console.log(`❌ User not found: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Excluir o perfil do usuário da tabela profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (profileError) {
      console.error('❌ Error deleting user profile:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir perfil do usuário'
      });
    }

    // Excluir o usuário do Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('❌ Error deleting user from auth:', authError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao excluir usuário do sistema de autenticação'
      });
    }

    console.log(`✅ User deleted successfully: ${id}`);

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
