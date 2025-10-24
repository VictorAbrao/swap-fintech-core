require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const accountsRoutes = require('./routes/accounts');
const arbitrageRoutes = require('./routes/arbitrage');
const docsRoutes = require('./routes/docs');
const operationsRoutes = require('./routes/operations');
const publicClientsRoutes = require('./routes/public/clients');
const publicQuotationRoutes = require('./routes/public/quotation');
const publicMarkupRoutes = require('./routes/public/markup');
const publicExecuteOperationRoutes = require('./routes/public/execute-operation');
const publicBalanceRoutes = require('./routes/public/balance');
const publicOperationsRoutes = require('./routes/public/operations');
const publicArbitrageRoutes = require('./routes/public/arbitrage');
const { router: publicWebhookRoutes } = require('./routes/public/webhook');
const publicUploadRoutes = require('./routes/public/upload');
const publicValidateAccountRoutes = require('./routes/public/validate-account');
const adminMarkupRoutes = require('./routes/admin/markup');
const adminUsersRoutes = require('./routes/admin/users');
const adminWebhooksRoutes = require('./routes/admin/webhooks');
const adminBrazaRequestsRoutes = require('./routes/admin/brazaRequests');
const adminBrazaRoutes = require('./routes/admin/braza');
const adminTransactionsRoutes = require('./routes/admin/transactions');
const adminClientsRoutes = require('./routes/admin/clients');
const adminClientMarkupsRoutes = require('./routes/admin/client-markups');
const adminFxRatesRoutes = require('./routes/admin/fx-rates');
const adminOperationsRoutes = require('./routes/admin/operations');
const adminKpisRoutes = require('./routes/admin/kpis');
const publicFxRatesRoutes = require('./routes/public/fx-rates');
const beneficiariesRoutes = require('./routes/beneficiaries');
const transfersRoutes = require('./routes/transfers');
const walletsRoutes = require('./routes/wallets');
const brlBalanceRoutes = require('./routes/brlBalance');
const debugOperationsRoutes = require('./routes/debugOperations');
const updateOperationsRoutes = require('./routes/updateOperations');
const debugAccountsRoutes = require('./routes/debugAccounts');
const testAccountsRoutes = require('./routes/testAccounts');
const checkWalletsRoutes = require('./routes/checkWallets');

const app = express();
const PORT = process.env.PORT || 5002;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for testing)
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: [
    'http://localhost:5002', 
    'http://72.60.61.249:5002', 
    'http://localhost:5001', 
    'http://72.60.61.249:5001',
    'http://app.swapone.global',
    'https://app.swapone.global',
    'http://app.swapone.global:5001',
    'https://app.swapone.global:5001',
    'http://api.swapcambio.com',
    'https://api.swapcambio.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Headers para Swagger
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// Swagger configurations
const swaggerPublic = require('./config/swagger-public');
const swaggerAdmin = require('./config/swagger-admin');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/arbitrage', arbitrageRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/public', publicQuotationRoutes);
app.use('/api/public', publicClientsRoutes);
app.use('/api/public', publicMarkupRoutes);
app.use('/api/public', publicExecuteOperationRoutes);
app.use('/api/public', publicBalanceRoutes);
app.use('/api/public', publicOperationsRoutes);
app.use('/api/public/arbitrage', publicArbitrageRoutes);
app.use('/api/public', publicWebhookRoutes);
app.use('/api/public', publicUploadRoutes);
app.use('/api/public', publicValidateAccountRoutes);
app.use('/api/public/fx-rates', publicFxRatesRoutes);
app.use('/api/admin/markup', adminMarkupRoutes);
app.use('/api/admin/fx-rates', adminFxRatesRoutes);
app.use('/api/admin/operations', adminOperationsRoutes);
app.use('/api/admin/kpis', adminKpisRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/webhooks', adminWebhooksRoutes);
app.use('/api/admin/braza-requests', adminBrazaRequestsRoutes);
app.use('/api/admin/braza', adminBrazaRoutes);
app.use('/api/admin/transactions', adminTransactionsRoutes);
app.use('/api/admin/clients', adminClientsRoutes);
app.use('/api/admin/clients', adminClientMarkupsRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/transfers', transfersRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/brl-balance', brlBalanceRoutes);
app.use('/api/debug', debugOperationsRoutes);
app.use('/api/update-operations', updateOperationsRoutes);
app.use('/api/debug-accounts', debugAccountsRoutes);
app.use('/api/test-accounts', testAccountsRoutes);
app.use('/api/check-wallets', checkWalletsRoutes);

// Swagger Public (Para clientes) - APENAS LOGIN
app.get('/swagger-public.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerPublic);
});

app.use('/api-docs', swaggerUi.serveFiles(swaggerPublic, {}), swaggerUi.setup(swaggerPublic, {
  customSiteTitle: 'SwapOne API - Public',
  customCss: '.swagger-ui .topbar { display: none }',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    url: '/swagger-public.json'
  }
}));

// Swagger Admin (Completo - Para administradores)
app.get('/swagger-admin.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerAdmin);
});

app.use('/admin/api-docs', swaggerUi.serveFiles(swaggerAdmin, {}), swaggerUi.setup(swaggerAdmin, {
  customSiteTitle: 'SwapOne API - Admin',
  customCss: '.swagger-ui .topbar { display: none; } .swagger-ui .info .title { color: #e74c3c; }',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    url: '/swagger-admin.json'
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SwapOne Fintech API',
    version: '1.0.0',
    documentation: `/api-docs`,
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      accounts: '/api/accounts',
      transfers: '/api/transfers',
      arbitrage: '/api/arbitrage'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SwapOne Fintech API running on port ${PORT}`);
  console.log(`📚 Public API Docs (Clientes): http://72.60.61.249:${PORT}/api-docs`);
  console.log(`🔒 Admin API Docs (Completa): http://72.60.61.249:${PORT}/admin/api-docs`);
  console.log(`🔍 Health Check: http://72.60.61.249:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;


module.exports = app;

