const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAdmin } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const walletsService = require('../../services/walletsService');
const emailService = require('../../services/emailService');
const softDeleteService = require('../../services/softDeleteService');
const { generateUniqueAccountNumber } = require('../../utils/accountNumberGenerator');

const router = express.Router();

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads/attachments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `attachment-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Apenas PDF, JPG e PNG são aceitos.'));
    }
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        profiles:profiles(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const clientsWithUserCount = await Promise.all(clients.map(async (client) => {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id);

      return {
        ...client,
        user_count: count || 0
      };
    }));

    res.json({
      success: true,
      data: clientsWithUserCount
    });

  } catch (error) {
    console.error('List clients error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (clientError) {
      throw clientError;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, user_name, user_cpf, role, created_at')
      .eq('client_id', id);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const userIds = profiles?.map(p => p.id) || [];
    let usersWithEmail = [];

    if (userIds.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      usersWithEmail = profiles?.map(profile => {
        const authUser = authUsers?.users.find(u => u.id === profile.id);
        return {
          id: profile.id,
          user_name: profile.user_name,
          user_cpf: profile.user_cpf,
          email: authUser?.email || 'N/A',
          role: profile.role,
          created_at: profile.created_at
        };
      }) || [];
    }

    res.json({
      success: true,
      data: {
        ...client,
        users: usersWithEmail
      }
    });

  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, cnpj, annual_transaction_limit_usdt } = req.body;

    if (!name || !cnpj) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'name and cnpj are required'
      });
    }

    // Generate unique account number
    const accountNumber = await generateUniqueAccountNumber();
    console.log(`🏦 Generated account number ${accountNumber} for client ${name}`);

    const { data: client, error } = await supabase
      .from('clients')
      .insert([{
        name,
        cnpj,
        annual_transaction_limit_usdt: annual_transaction_limit_usdt || 1000000,
        active: true,
        account_number: accountNumber
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'CNPJ already exists',
          message: 'A client with this CNPJ already exists'
        });
      }
      throw error;
    }

    // Criar carteiras automaticamente para o novo cliente
    try {
      console.log(`🏦 Creating wallets for new client: ${client.name} (${client.id})`);
      
      const currencies = ['USD', 'EUR', 'GBP', 'USDT', 'BRL', 'USDC'];
      const walletPromises = currencies.map(currency => {
        return walletsService.createWallet(client.id, currency, 0);
      });
      
      const walletResults = await Promise.all(walletPromises);
      const successfulWallets = walletResults.filter(result => result.success);
      
      console.log(`✅ Created ${successfulWallets.length}/${currencies.length} wallets for client ${client.name}`);
      
      if (successfulWallets.length < currencies.length) {
        console.warn(`⚠️ Some wallets failed to create for client ${client.name}`);
      }
    } catch (walletError) {
      console.error('❌ Error creating wallets for new client:', walletError);
      // Não falhar a criação do cliente se as carteiras falharem
    }

    // Enviar notificação para o board sobre novo cliente
    try {
      const userInfo = {
        name: req.user.name || 'Administrador',
        email: req.user.email,
        role: req.user.role
      };
      
      await emailService.sendClientNotification('created', {
        ...client,
        created_at: new Date().toISOString()
      }, userInfo);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar notificação de cliente:', emailError.message);
      // Não falha a operação por erro de email
    }

    res.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cnpj, annual_transaction_limit_usdt, active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (cnpj !== undefined) updates.cnpj = cnpj;
    if (annual_transaction_limit_usdt !== undefined) updates.annual_transaction_limit_usdt = annual_transaction_limit_usdt;
    if (active !== undefined) updates.active = active;

    const { data: client, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Enviar notificação para o board sobre atualização de cliente
    try {
      const userInfo = {
        name: req.user.name || 'Administrador',
        email: req.user.email,
        role: req.user.role
      };
      
      await emailService.sendClientNotification('updated', {
        ...client,
        updated_at: new Date().toISOString()
      }, userInfo);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar notificação de cliente:', emailError.message);
      // Não falha a operação por erro de email
    }

    res.json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🗑️ Deleting client and cascade deleting users: ${id}`);

    // Buscar dados do cliente antes de deletar para notificação
    const { data: clientData, error: clientFetchError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (clientFetchError) {
      console.error('❌ Error fetching client data:', clientFetchError);
      return res.status(500).json({
        success: false,
        error: 'Error fetching client data',
        message: clientFetchError.message
      });
    }

    // Primeiro, buscar todos os usuários do cliente
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, user_name')
      .eq('client_id', id);

    if (usersError) {
      console.error('❌ Error fetching client users:', usersError);
      return res.status(500).json({
        success: false,
        error: 'Error fetching client users',
        message: usersError.message
      });
    }

    console.log(`👥 Found ${users.length} users for client ${id}`);

    // Excluir todos os usuários do cliente em cascata
    if (users.length > 0) {
      console.log(`🗑️ Cascade deleting ${users.length} users...`);
      
      for (const user of users) {
        try {
          console.log(`🗑️ Deleting user: ${user.user_name || user.id} (${user.id})`);

          // Excluir o perfil do usuário
          const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

          if (profileError) {
            console.error(`❌ Error deleting user profile ${user.id}:`, profileError);
            continue; // Continuar com os outros usuários
          }

          // Excluir o usuário do Supabase Auth
          const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

          if (authError) {
            console.error(`❌ Error deleting user from auth ${user.id}:`, authError);
            continue; // Continuar com os outros usuários
          }

          console.log(`✅ User deleted successfully: ${user.user_name || user.id}`);
        } catch (userError) {
          console.error(`❌ Error deleting user ${user.id}:`, userError);
          // Continuar com os outros usuários mesmo se um falhar
        }
      }
    }

    // Excluir todas as carteiras do cliente
    console.log(`💰 Deleting wallets for client ${id}`);
    const { error: walletsError } = await supabase
      .from('wallets')
      .delete()
      .eq('client_id', id);

    if (walletsError) {
      console.error('❌ Error deleting client wallets:', walletsError);
      return res.status(500).json({
        success: false,
        error: 'Error deleting client wallets',
        message: walletsError.message
      });
    }

    // Excluir todas as operações do cliente
    console.log(`📊 Deleting operations for client ${id}`);
    const { error: operationsError } = await supabase
      .from('operations_history')
      .delete()
      .eq('client_id', id);

    if (operationsError) {
      console.error('❌ Error deleting client operations:', operationsError);
      return res.status(500).json({
        success: false,
        error: 'Error deleting client operations',
        message: operationsError.message
      });
    }

    // Excluir todos os beneficiários do cliente
    console.log(`👤 Deleting beneficiaries for client ${id}`);
    const { error: beneficiariesError } = await supabase
      .from('beneficiaries')
      .delete()
      .eq('client_id', id);

    if (beneficiariesError) {
      console.error('❌ Error deleting client beneficiaries:', beneficiariesError);
      return res.status(500).json({
        success: false,
        error: 'Error deleting client beneficiaries',
        message: beneficiariesError.message
      });
    }

    // Excluir todos os markups do cliente
    console.log(`📈 Deleting markups for client ${id}`);
    const { error: markupsError } = await supabase
      .from('client_markups')
      .delete()
      .eq('client_id', id);

    if (markupsError) {
      console.error('❌ Error deleting client markups:', markupsError);
      return res.status(500).json({
        success: false,
        error: 'Error deleting client markups',
        message: markupsError.message
      });
    }

    // Finalmente, excluir o cliente
    console.log(`🏢 Deleting client ${id}`);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting client:', error);
      return res.status(500).json({
        success: false,
        error: 'Error deleting client',
        message: error.message
      });
    }

    console.log(`✅ Client and all related data deleted successfully: ${id}`);

    // Enviar notificação para o board sobre deleção de cliente
    try {
      const userInfo = {
        name: req.user.name || 'Administrador',
        email: req.user.email,
        role: req.user.role
      };
      
      await emailService.sendClientNotification('deleted', {
        ...clientData,
        deleted_at: new Date().toISOString()
      }, userInfo);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar notificação de cliente:', emailError.message);
      // Não falha a operação por erro de email
    }

    res.json({
      success: true,
      message: `Client and ${users.length} users deleted successfully`,
      deletedUsers: users.length
    });

  } catch (error) {
    console.error('❌ Delete client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.post('/:id/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: clientId } = req.params;
    const { email, password, user_name, user_cpf, role } = req.body;

    if (!email || !password || !user_name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'email, password, and user_name are required'
      });
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      throw authError;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        client_id: clientId,
        user_name,
        user_cpf,
        role: role || 'client'
      })
      .eq('id', authUser.user.id)
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // Buscar dados do cliente para notificação
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    // Enviar notificação para o board sobre novo usuário
    try {
      const userInfo = {
        name: req.user.name || 'Administrador',
        email: req.user.email,
        role: req.user.role
      };
      
      const userData = {
        id: authUser.user.id,
        email: authUser.user.email,
        name: profile.user_name,
        role: profile.role,
        created_at: new Date().toISOString()
      };
      
      await emailService.sendUserNotification('created', userData, clientData, userInfo);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar notificação de usuário:', emailError.message);
      // Não falha a operação por erro de email
    }

    res.json({
      success: true,
      data: {
        id: authUser.user.id,
        email: authUser.user.email,
        user_name: profile.user_name,
        user_cpf: profile.user_cpf,
        client_id: profile.client_id,
        role: profile.role
      }
    });

  } catch (error) {
    console.error('Add user to client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

router.delete('/:clientId/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId, userId } = req.params;

    // Buscar dados do usuário e cliente antes de deletar para notificação
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*, clients(*)')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    if (userProfile.client_id !== clientId) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found in this client'
      });
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw authError;
    }

    // Enviar notificação para o board sobre deleção de usuário
    try {
      const userInfo = {
        name: req.user.name || 'Administrador',
        email: req.user.email,
        role: req.user.role
      };
      
      const userData = {
        id: userId,
        email: userProfile.email || 'N/A',
        name: userProfile.user_name,
        role: userProfile.role,
        deleted_at: new Date().toISOString()
      };
      
      await emailService.sendUserNotification('deleted', userData, userProfile.clients, userInfo);
    } catch (emailError) {
      console.error('⚠️ Erro ao enviar notificação de usuário:', emailError.message);
      // Não falha a operação por erro de email
    }

    res.json({
      success: true,
      message: 'User removed from client successfully'
    });

  } catch (error) {
    console.error('Remove user from client error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para buscar beneficiários do cliente
router.get('/:clientId/beneficiaries', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: beneficiaries, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: beneficiaries || []
    });

  } catch (error) {
    console.error('Get client beneficiaries error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para criar beneficiário do cliente
router.post('/:clientId/beneficiaries', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
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
      beneficiary_account_type,
      crypto_protocol,
      crypto_wallet,
      internal_account_number
    } = req.body;

    if (!beneficiary_name || !transfer_method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'beneficiary_name and transfer_method are required'
      });
    }

    const { data: beneficiary, error } = await supabase
      .from('beneficiaries')
      .insert([{
        client_id: clientId,
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
        beneficiary_account_type,
        crypto_protocol,
        crypto_wallet,
        internal_account_number
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: beneficiary
    });

  } catch (error) {
    console.error('Create client beneficiary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para atualizar beneficiário do cliente
router.put('/:clientId/beneficiaries/:beneficiaryId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId, beneficiaryId } = req.params;
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
      beneficiary_account_type,
      crypto_protocol,
      crypto_wallet,
      internal_account_number
    } = req.body;

    const updates = {};
    if (beneficiary_name !== undefined) updates.beneficiary_name = beneficiary_name;
    if (transfer_method !== undefined) updates.transfer_method = transfer_method;
    if (beneficiary_iban !== undefined) updates.beneficiary_iban = beneficiary_iban;
    if (beneficiary_bic !== undefined) updates.beneficiary_bic = beneficiary_bic;
    if (beneficiary_swift_bic !== undefined) updates.beneficiary_swift_bic = beneficiary_swift_bic;
    if (beneficiary_account_number !== undefined) updates.beneficiary_account_number = beneficiary_account_number;
    if (beneficiary_bank_name !== undefined) updates.beneficiary_bank_name = beneficiary_bank_name;
    if (beneficiary_bank_address !== undefined) updates.beneficiary_bank_address = beneficiary_bank_address;
    if (intermediary_bank_swift !== undefined) updates.intermediary_bank_swift = intermediary_bank_swift;
    if (beneficiary_routing_number !== undefined) updates.beneficiary_routing_number = beneficiary_routing_number;
    if (beneficiary_account_number_ach !== undefined) updates.beneficiary_account_number_ach = beneficiary_account_number_ach;
    if (beneficiary_account_type !== undefined) updates.beneficiary_account_type = beneficiary_account_type;
    if (crypto_protocol !== undefined) updates.crypto_protocol = crypto_protocol;
    if (crypto_wallet !== undefined) updates.crypto_wallet = crypto_wallet;
    if (internal_account_number !== undefined) updates.internal_account_number = internal_account_number;

    const { data: beneficiary, error } = await supabase
      .from('beneficiaries')
      .update(updates)
      .eq('id', beneficiaryId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: beneficiary
    });

  } catch (error) {
    console.error('Update client beneficiary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para excluir beneficiário do cliente
router.delete('/:clientId/beneficiaries/:beneficiaryId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId, beneficiaryId } = req.params;

    const { error } = await supabase
      .from('beneficiaries')
      .delete()
      .eq('id', beneficiaryId)
      .eq('client_id', clientId);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Beneficiary deleted successfully'
    });

  } catch (error) {
    console.error('Delete client beneficiary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para buscar saldos do cliente
router.get('/:clientId/balances', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;

    const { data: wallets, error } = await supabase
      .from('wallets')
      .select('currency, balance')
      .eq('client_id', clientId);

    if (error) {
      throw error;
    }

    // Garantir que todas as moedas principais estejam presentes
    const currencies = ['USD', 'EUR', 'GBP', 'USDT', 'BRL', 'USDC'];
    const balances = currencies.map(currency => {
      const wallet = wallets?.find(w => w.currency === currency);
      return {
        currency,
        balance: wallet?.balance || 0
      };
    });

    res.json({
      success: true,
      data: balances
    });

  } catch (error) {
    console.error('Get client balances error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para buscar transações do cliente
router.get('/:clientId/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const { data: transactions, error } = await supabase
      .from('operations_history')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: transactions || []
    });

  } catch (error) {
    console.error('Get client transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para criar transação do cliente (depósito externo)
router.post('/:clientId/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const {
      operation_type,
      source_currency,
      target_currency,
      source_amount,
      target_amount,
      exchange_rate,
      base_rate,
      final_rate,
      markup_percentage,
      fixed_rate_amount,
      fee_amount,
      status,
      notes,
      attachment_url_1,
      attachment_url_2
    } = req.body;

    if (!operation_type || !source_currency || !source_amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'operation_type, source_currency, and source_amount are required'
      });
    }

    // Verificar se req.user está presente
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication error',
        message: 'User information not found in request'
      });
    }

    // Criar a transação
    console.log('🔍 Creating transaction with data:', {
      user_id: req.user.userId,
      client_id: clientId,
      operation_type,
      source_currency,
      target_currency: target_currency || source_currency,
      source_amount,
      target_amount: target_amount || source_amount,
      exchange_rate: exchange_rate || 1,
      base_rate: base_rate || 1,
      final_rate: final_rate || 1,
      markup_percentage: markup_percentage || 0,
      fixed_rate_amount: fixed_rate_amount || 0,
      fee_amount: fee_amount || 0,
      status: status || 'executed',
      notes,
      attachment_url_1,
      attachment_url_2
    });

    const { data: transaction, error: transactionError } = await supabase
      .from('operations_history')
      .insert([{
        user_id: req.user.userId, // ✅ Adicionar user_id do admin logado
        client_id: clientId,
        operation_type,
        source_currency,
        target_currency: target_currency || source_currency,
        source_amount,
        target_amount: target_amount || source_amount,
        exchange_rate: exchange_rate || 1,
        base_rate: base_rate || 1,
        final_rate: final_rate || 1,
        markup_percentage: markup_percentage || 0,
        fixed_rate_amount: fixed_rate_amount || 0,
        fee_amount: fee_amount || 0,
        status: status || 'executed',
        notes,
        attachment_url_1,
        attachment_url_2
      }])
      .select()
      .single();

    if (transactionError) {
      throw transactionError;
    }

    // Atualizar saldo da carteira baseado no tipo de operação
    try {
      const { operation_type, source_currency, target_currency, source_amount, target_amount } = transaction;
      
      if (operation_type === 'external_deposit') {
        // Para depósitos externos, adicionar o valor à moeda de destino
        const walletResult = await walletsService.updateWalletBalance(
          clientId, 
          target_currency, 
          target_amount, 
          'add'
        );
        
        if (walletResult.success) {
          console.log(`💰 Wallet updated: ${target_currency} +${target_amount}`);
        } else {
          console.error('⚠️ Failed to update wallet:', walletResult.error);
        }
      } else if (operation_type === 'external_withdrawal') {
        // Para saques externos, subtrair o valor da moeda de origem
        const walletResult = await walletsService.updateWalletBalance(
          clientId, 
          source_currency, 
          source_amount, 
          'subtract'
        );
        
        if (walletResult.success) {
          console.log(`💰 Wallet updated: ${source_currency} -${source_amount}`);
        } else {
          console.error('⚠️ Failed to update wallet:', walletResult.error);
        }
      } else if (operation_type === 'withdrawal') {
        // Para saques, subtrair o valor da moeda de origem
        const walletResult = await walletsService.updateWalletBalance(
          clientId, 
          source_currency, 
          source_amount, 
          'subtract'
        );
        
        if (walletResult.success) {
          console.log(`💰 Wallet updated: ${source_currency} -${source_amount}`);
        } else {
          console.error('⚠️ Failed to update wallet:', walletResult.error);
        }
      } else if (operation_type === 'deposit') {
        // Para depósitos, adicionar o valor à moeda de origem
        const walletResult = await walletsService.updateWalletBalance(
          clientId, 
          source_currency, 
          source_amount, 
          'add'
        );
        
        if (walletResult.success) {
          console.log(`💰 Wallet updated: ${source_currency} +${source_amount}`);
        } else {
          console.error('⚠️ Failed to update wallet:', walletResult.error);
        }
      } else if (operation_type === 'transfer') {
        // Para transferências, subtrair da origem e adicionar ao destino
        const fromResult = await walletsService.updateWalletBalance(
          clientId, 
          source_currency, 
          source_amount, 
          'subtract'
        );
        
        const toResult = await walletsService.updateWalletBalance(
          clientId, 
          target_currency, 
          target_amount, 
          'add'
        );
        
        if (fromResult.success && toResult.success) {
          console.log(`💰 Wallet updated: ${source_currency} -${source_amount}, ${target_currency} +${target_amount}`);
        } else {
          console.error('⚠️ Failed to update wallets:', { fromResult, toResult });
        }
      } else if (operation_type === 'conversion') {
        // Para conversões, subtrair da origem e adicionar ao destino
        const fromResult = await walletsService.updateWalletBalance(
          clientId, 
          source_currency, 
          source_amount, 
          'subtract'
        );
        
        const toResult = await walletsService.updateWalletBalance(
          clientId, 
          target_currency, 
          target_amount, 
          'add'
        );
        
        if (fromResult.success && toResult.success) {
          console.log(`💰 Wallet updated: ${source_currency} -${source_amount}, ${target_currency} +${target_amount}`);
        } else {
          console.error('⚠️ Failed to update wallets:', { fromResult, toResult });
        }
      } else if (operation_type === 'internal_transfer') {
        // Para transferências internas, subtrair da origem e adicionar ao destino
        const fromResult = await walletsService.updateWalletBalance(
          clientId, 
          source_currency, 
          source_amount, 
          'subtract'
        );
        
        const toResult = await walletsService.updateWalletBalance(
          clientId, 
          target_currency, 
          target_amount, 
          'add'
        );
        
        if (fromResult.success && toResult.success) {
          console.log(`💰 Wallet updated: ${source_currency} -${source_amount}, ${target_currency} +${target_amount}`);
        } else {
          console.error('⚠️ Failed to update wallets:', { fromResult, toResult });
        }
      }
      
      console.log('🔍 Transaction created successfully, wallet updated');
    } catch (walletError) {
      console.error('⚠️ Wallet update failed:', walletError);
      // Não falhar a transação se a atualização da carteira falhar
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Create client transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para atualizar transação do cliente
router.put('/:clientId/transactions/:transactionId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId, transactionId } = req.params;
    const {
      status,
      notes,
      attachment_url_1,
      attachment_url_2
    } = req.body;

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (attachment_url_1 !== undefined) updates.attachment_url_1 = attachment_url_1;
    if (attachment_url_2 !== undefined) updates.attachment_url_2 = attachment_url_2;

    const { data: transaction, error } = await supabase
      .from('operations_history')
      .update(updates)
      .eq('id', transactionId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Update client transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para upload de arquivos
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const file = req.file;
    
    // Gerar URL pública para o arquivo
    const publicUrl = `/uploads/attachments/${file.filename}`;
    
    res.json({
      success: true,
      data: {
        url: publicUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Se houver erro de validação do multer
    if (error.message && error.message.includes('Tipo de arquivo não permitido')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Endpoint para criar transferência em nome do cliente (admin)
router.post('/:clientId/transfers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      beneficiary_id,
      amount,
      currency,
      payment_reference,
      notes,
      attachment_url_1,
      attachment_url_2
    } = req.body;
    
    // Validação básica
    if (!beneficiary_id || !amount || !currency || !payment_reference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Todos os campos obrigatórios devem ser preenchidos'
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
        message: 'Valor deve ser maior que zero'
      });
    }
    
    // Validar moeda permitida
    const allowedCurrencies = ['USD', 'EUR', 'GBP', 'USDT', 'USDC', 'BRL'];
    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid currency',
        message: 'Moeda não permitida. Use: USD, EUR, GBP, USDT, USDC ou BRL'
      });
    }
    
    // Buscar dados do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single();
    
    if (clientError || !client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found',
        message: 'Cliente não encontrado'
      });
    }
    
    const clientName = client.name;
    
    // Buscar dados do beneficiário
    const { data: beneficiary, error: beneficiaryError } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('id', beneficiary_id)
      .eq('client_id', clientId)
      .single();
    
    if (beneficiaryError || !beneficiary) {
      return res.status(404).json({
        success: false,
        error: 'Beneficiary not found',
        message: 'Beneficiário não encontrado'
      });
    }
    
    // Verificar saldo disponível
    const balanceResult = await walletsService.getWalletBalance(clientId, currency);
    if (!balanceResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to check balance',
        message: 'Erro ao verificar saldo'
      });
    }
    
    const availableBalance = balanceResult.data || 0;
    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance',
        message: `Saldo insuficiente. Disponível: ${currency} ${availableBalance.toFixed(2)}`
      });
    }
    
    // Determinar se é transferência interna ou externa
    const isInternalTransfer = beneficiary.transfer_method === 'INTERNAL';
    
    let destinationClient = null;
    if (isInternalTransfer) {
      // Para transferências internas, buscar o cliente de destino pelo número da conta
      const { data: destinationClientData, error: destError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('account_number', beneficiary.internal_account_number)
        .single();
      
      if (destError || !destinationClientData) {
        return res.status(404).json({
          success: false,
          error: 'Destination client not found',
          message: 'Cliente de destino não encontrado'
        });
      }
      
      destinationClient = destinationClientData;
      
      // Verificar se não está tentando transferir para si mesmo
      if (destinationClient.id === clientId) {
        return res.status(400).json({
          success: false,
          error: 'Self transfer not allowed',
          message: 'Não é possível transferir para si mesmo'
        });
      }
    }
    
    // Criar dados da operação
    const operationData = {
      user_id: req.user.userId, // Admin que está criando a transferência
      client_id: clientId,
      operation_type: 'transfer',
      source_amount: amount,
      source_currency: currency,
      target_amount: amount, // Para transferências simples, mesmo valor
      target_currency: currency,
      status: isInternalTransfer ? 'executed' : 'pending',
      beneficiary_name: beneficiary.beneficiary_name,
      beneficiary_account: beneficiary.beneficiary_account_number || beneficiary.beneficiary_iban || beneficiary.internal_account_number,
      beneficiary_bank_name: beneficiary.beneficiary_bank_name,
      beneficiary_bank_address: beneficiary.beneficiary_bank_address,
      beneficiary_iban: beneficiary.beneficiary_iban,
      beneficiary_swift_bic: beneficiary.beneficiary_swift_bic,
      beneficiary_routing_number: beneficiary.beneficiary_routing_number,
      beneficiary_account_type: beneficiary.beneficiary_account_type,
      intermediary_bank_swift: beneficiary.intermediary_bank_swift,
      crypto_protocol: beneficiary.crypto_protocol,
      crypto_wallet: beneficiary.crypto_wallet,
      internal_account_number: beneficiary.internal_account_number,
      payment_reference: payment_reference,
      notes: notes || null,
      attachment_url_1: attachment_url_1 || null,
      attachment_url_2: attachment_url_2 || null,
      transfer_method: beneficiary.transfer_method,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Adicionar campos específicos para transferências internas
    if (isInternalTransfer && destinationClient) {
      operationData.destination_client_id = destinationClient.id;
      operationData.destination_client_name = destinationClient.name;
    }
    
    // Criar a operação no histórico
    const { data: operation, error: operationError } = await supabase
      .from('operations_history')
      .insert([operationData])
      .select()
      .single();
    
    if (operationError) {
      console.error('Error creating operation:', operationError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create operation',
        message: 'Erro ao criar operação'
      });
    }
    
    // Atualizar saldo da carteira
    const walletResult = await walletsService.updateWalletBalance(
      clientId,
      currency,
      amount,
      'subtract'
    );
    
    if (!walletResult.success) {
      console.error('Error updating wallet:', walletResult.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update wallet',
        message: 'Erro ao atualizar carteira'
      });
    }
    
    // Se for transferência interna, também creditar o destinatário
    if (isInternalTransfer && destinationClient) {
      const destinationWalletResult = await walletsService.updateWalletBalance(
        destinationClient.id,
        currency,
        amount,
        'add'
      );
      
      if (!destinationWalletResult.success) {
        console.error('Error updating destination wallet:', destinationWalletResult.error);
        // Reverter a operação original
        await walletsService.updateWalletBalance(clientId, currency, amount, 'add');
        return res.status(500).json({
          success: false,
          error: 'Failed to update destination wallet',
          message: 'Erro ao atualizar carteira do destinatário'
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        operation_id: operation.id,
        beneficiary: beneficiary.beneficiary_name,
        amount: amount,
        currency: currency,
        status: operation.status,
        transfer_type: isInternalTransfer ? 'internal' : 'external',
        destination_client: isInternalTransfer ? destinationClient.id : null,
        wallet_updated: {
          source: true,
          destination: isInternalTransfer
        }
      },
      message: isInternalTransfer ? 'Transferência interna executada com sucesso' : 'Transferência criada com sucesso'
    });
    
  } catch (error) {
    console.error('Create client transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;

