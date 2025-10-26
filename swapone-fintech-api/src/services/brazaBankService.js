const axios = require('axios');
const brazaRequestsService = require('./brazaRequestsService');

class BrazaBankService {
  constructor() {
    this.baseURL = process.env.BRAZA_BASE_URL;
    this.username = process.env.BRAZA_USERNAME;
    this.password = process.env.BRAZA_PASSWORD;
    this.productId = process.env.BRAZA_PRODUCT_ID;
    this.productIdUsdc = process.env.BRAZA_PRODUCT_ID_USDC || '194';
    this.customerId = process.env.BRAZA_CUSTOMER_ID;
    this.walletId = process.env.BRAZA_WALLET_ID;
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
  }
  
  /**
   * Get product ID based on currency
   * @param {string} currency - Currency code (USDT, USDC, etc.)
   * @returns {number} Product ID for the currency
   */
  getProductId(currency) {
    if (currency === 'USDC') {
      return parseInt(this.productIdUsdc);
    }
    return parseInt(this.productId);
  }

  /**
   * Fazer request para o Braza Bank com logging
   */
  async makeRequest(type, endpoint, payload = null, userId = null, clientId = null, quotationId = null, method = 'POST') {
    const startTime = Date.now();
    let requestData = {
      type,
      endpoint,
      method: method,
      requestPayload: payload,
      requestHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      userId,
      clientId,
      quotationId
    };

    try {
      console.log(`📤 Making ${type} request to Braza Bank: ${endpoint}`);
      
      let response;
      if (method === 'GET') {
        response = await axios.get(`${this.baseURL}${endpoint}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
      } else {
        response = await axios.post(`${this.baseURL}${endpoint}`, payload, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        });
      }

      const duration = Date.now() - startTime;
      
      // Log da request bem-sucedida
      await brazaRequestsService.logRequest({
        ...requestData,
        responseStatus: response.status,
        responseData: response.data,
        responseHeaders: response.headers,
        responseTime: duration
      });

      console.log(`✅ ${type} request successful (${duration}ms)`);
      
      return {
        success: true,
        data: response.data,
        status: response.status
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log da request com erro
      await brazaRequestsService.logRequest({
        ...requestData,
        responseStatus: error.response?.status || null,
        responseData: error.response?.data || null,
        responseHeaders: error.response?.headers || null,
        responseTime: duration,
        error: error.message,
        errorCode: error.code
      });

      console.error(`❌ ${type} request failed (${duration}ms):`, error.message);
      
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  async authenticate() {
    const startTime = Date.now();
    const requestData = {
      type: 'authentication',
      endpoint: '/auth/',
      method: 'POST',
      requestPayload: {
        username: this.username,
        password: '[HIDDEN]'
      },
      requestHeaders: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    try {
      console.log('🔐 Authenticating with Braza Bank...');
      console.log(`   URL: ${this.baseURL}/auth/`);
      console.log(`   Username: ${this.username}`);
      
      const response = await axios.post(`${this.baseURL}/auth/`, {
        username: this.username,
        password: this.password
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      this.refreshToken = response.data.refresh_token;
      this.tokenExpiry = Date.now() + (4 * 60 * 1000);

      console.log('✅ Braza Bank authentication successful');
      console.log(`   Token expires in: ${Math.floor((this.tokenExpiry - Date.now()) / 1000)}s`);
      
      // Log successful authentication request
      await brazaRequestsService.logRequest({
        ...requestData,
        responseStatus: response.status,
        responseData: {
          access_token: '[HIDDEN]',
          refresh_token: '[HIDDEN]',
          token_type: response.data.token_type || 'Bearer'
        },
        responseTime: Date.now() - startTime,
        success: true
      });
      
      return {
        success: true,
        accessToken: this.accessToken,
        refreshToken: this.refreshToken
      };

    } catch (error) {
      console.error('❌ Braza Bank authentication error:');
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Data:`, error.response?.data);
      
      // Log failed authentication request
      await brazaRequestsService.logRequest({
        ...requestData,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
        responseTime: Date.now() - startTime,
        success: false,
        error: error.message
      });
      
      return {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message,
        message: error.response?.data?.message || error.message
      };
    }
  }

  async ensureAuthenticated() {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  async getPreviewQuotation(currency, amount, side, userId = null, clientId = null, quotationId = null) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      const currencyPair = `${currency}:BRL`;

      const productId = this.getProductId(currency);
      
      const payload = {
        currency_amount: currency,
        amount: parseFloat(amount),
        currency: currencyPair,
        side: side,
        product_id: productId
      };

      console.log(`📊 Getting quotation from Braza Bank:`);
      console.log(`   Currency: ${currency}`);
      console.log(`   Amount: ${amount}`);
      console.log(`   Side: ${side}`);
      console.log(`   Pair: ${currencyPair}`);
      console.log(`   Product ID: ${productId}`);
      console.log(`   Payload:`, JSON.stringify(payload, null, 2));

      // Usar o novo método com logging
      const result = await this.makeRequest(
        'preview_quotation',
        '/rates-ttl/v2/order/preview-quotation',
        payload,
        userId,
        clientId,
        quotationId
      );

      if (result.success) {
        console.log('✅ Quotation received from Braza Bank');
        return {
          success: true,
          data: {
            id: result.data.id,
            final_quotation: result.data.final_quotation,
            fgn_quantity: result.data.fgn_quantity,
            brl_quantity: result.data.brl_quantity,
            quote: result.data.quote,
            vet: result.data.vet,
            iof: result.data.iof,
            fees_amount: result.data.fees_amount
          }
        };
      } else {
        return result;
      }

    } catch (error) {
      console.error('❌ Braza Bank quotation error:');
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Message: ${error.message}`);
      console.error(`   Data:`, error.response?.data);
      
      // Se for erro 401 (não autorizado), tenta autenticar novamente UMA VEZ
      if (error.response?.status === 401 && this.accessToken) {
        console.log('🔄 Token expired, re-authenticating...');
        this.accessToken = null;
        this.tokenExpiry = null;
        
        // Tenta autenticar novamente
        const authResult = await this.authenticate();
        if (authResult.success) {
          console.log('✅ Re-authentication successful, retrying quotation...');
          return this.getPreviewQuotation(currency, amount, side);
        } else {
          return {
            success: false,
            status: 401,
            error: 'Braza Bank authentication failed',
            message: `Failed to authenticate with Braza Bank: ${authResult.message}`,
            details: authResult.error
          };
        }
      }

      // Se for erro 503 (Service Unavailable), retorna erro sem fallback
      if (error.response?.status === 503) {
        console.log('⚠️ Braza Bank service unavailable - returning error without fallback');
        return {
          success: false,
          status: 503,
          error: 'Service temporarily unavailable',
          message: 'Braza Bank service is temporarily unavailable. Please try again later.',
          brazaError: error.response?.data
        };
      }

      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data || error.message,
        message: error.response?.data?.detail || error.response?.data?.message || error.message,
        brazaError: error.response?.data
      };
    }
  }


  async executeOrder(quotationId) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      console.log(`🚀 Executing order: ${quotationId}`);

      const response = await axios.post(
        `${this.baseURL}/rates-ttl/v2/order/${quotationId}/execute-order`,
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Order executed successfully');

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Braza Bank execute order error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.executeOrder(quotationId);
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async listClients(offset = 0, limit = 25) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      console.log(`📋 Listing Braza Bank clients (offset: ${offset}, limit: ${limit})`);

      const response = await axios.get(
        `${this.baseURL}/trader-api/client/list?offset=${offset}&limit=${limit}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      console.log(`✅ Found ${response.data.count} Braza Bank clients`);

      return {
        success: true,
        data: response.data.results,
        count: response.data.count
      };

    } catch (error) {
      console.error('❌ Braza Bank list clients error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.listClients(offset, limit);
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async getClientInfo(brazaId) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      console.log(`🔍 Getting Braza Bank client info for ID: ${brazaId}`);

      const response = await axios.get(
        `${this.baseURL}/trader-api/client/${brazaId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      console.log(`✅ Braza Bank client info retrieved for ID: ${brazaId}`);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Braza Bank get client info error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.getClientInfo(brazaId);
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  async getClientBalance(cpfCnpj) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      console.log(`💰 Getting balance for client: ${cpfCnpj}`);

      const encodedCpfCnpj = encodeURIComponent(cpfCnpj);
      const response = await axios.get(
        `${this.baseURL}/trader-api/client/list?search=${encodedCpfCnpj}&offset=0&limit=2500`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      if (response.data.count > 0 && response.data.results.length > 0) {
        const client = response.data.results[0];
        console.log(`✅ Balance retrieved: ${client.saldo} BRL for ${client.nome}`);
        
        return {
          success: true,
          data: {
            balance: client.saldo,
            balanceBRL: client.saldo,
            clientId: client.id,
            clientName: client.nome,
            cpfCnpj: client.cpf_cnpj
          }
        };
      }

      console.log('⚠️  Client not found in Braza Bank');
      return {
        success: false,
        error: 'Client not found'
      };

    } catch (error) {
      console.error('❌ Braza Bank get balance error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.getClientBalance(cpfCnpj);
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Executar ordem no Braza Bank usando o UUID retornado pelo preview-quotation
   */
  async executeOrder(brazaOrderId, userId = null, clientId = null, quotationId = null) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      console.log(`🚀 Executing order in Braza Bank: ${brazaOrderId}`);

      const payload = {}; // Payload vazio conforme especificação
      const endpoint = `/rates-ttl/v2/order/${brazaOrderId}/execute-order`;

      const result = await this.makeRequest('execute_order', endpoint, payload, userId, clientId, quotationId);

      if (result.success) {
        console.log(`✅ Order executed successfully in Braza Bank: ${brazaOrderId}`);
        return {
          success: true,
          data: result.data,
          brazaOrderId: brazaOrderId
        };
      } else {
        console.error(`❌ Failed to execute order in Braza Bank: ${brazaOrderId}`);
        return result;
      }

    } catch (error) {
      console.error('❌ Braza Bank execute order error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.executeOrder(brazaOrderId, userId, clientId, quotationId);
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Buscar detalhes de uma ordem pelo UUID no Braza Bank
   */
  async getOrderById(brazaOrderId, userId = null, clientId = null, quotationId = null) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      console.log(`🔍 Getting order details from Braza Bank: ${brazaOrderId}`);

      const endpoint = `/trader-api/order/${brazaOrderId}`;
      const result = await this.makeRequest('get_order', endpoint, null, userId, clientId, quotationId, 'GET');

      if (result.success) {
        console.log(`✅ Order details retrieved successfully: ${brazaOrderId}`);
        return {
          success: true,
          data: result.data,
          brazaOrderId: brazaOrderId
        };
      } else {
        console.error(`❌ Failed to get order details: ${brazaOrderId}`);
        return result;
      }

    } catch (error) {
      console.error('❌ Braza Bank get order error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.getOrderById(brazaOrderId, userId, clientId, quotationId);
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Executar brokerage no Braza Bank após get_order
   */
  async executeBrokerage(brazaOrderId, finalQuotation, userId = null, clientId = null, quotationId = null) {
    try {
      await this.ensureAuthenticated();

      if (!this.accessToken) {
        throw new Error('Failed to authenticate with Braza Bank');
      }

      console.log(`🏦 Executing brokerage in Braza Bank for order: ${brazaOrderId}`);

      const payload = {
        contract_rate: 0,
        customer: process.env.BRAZA_CUSTOMER_ID || "32822",
        order: brazaOrderId,
        rate: parseFloat(finalQuotation),
        cod_carteira: process.env.BRAZA_CARTEIRA_CODE || "622"
      };

      console.log(`📊 Brokerage payload:`, payload);

      const endpoint = `/trader-api/brokerage`;
      const result = await this.makeRequest('brokerage', endpoint, payload, userId, clientId, quotationId);

      if (result.success) {
        console.log(`✅ Brokerage executed successfully for order: ${brazaOrderId}`);
        return {
          success: true,
          data: result.data,
          brazaOrderId: brazaOrderId
        };
      } else {
        console.error(`❌ Failed to execute brokerage for order: ${brazaOrderId}`);
        return result;
      }

    } catch (error) {
      console.error('❌ Braza Bank brokerage error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        this.accessToken = null;
        return this.executeBrokerage(brazaOrderId, finalQuotation, userId, clientId, quotationId);
      }

      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }
}

const brazaBankService = new BrazaBankService();

module.exports = brazaBankService;

