const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwapOne Fintech API - Admin',
      version: '1.0.0',
      description: 'API completa para administradores do SwapOne Fintech - Documentação interna',
      contact: {
        name: 'SwapOne Development',
        email: 'dev@swapone.com'
      }
    },
    servers: [
      {
        url: 'https://api.swapcambio.com',
        description: 'Production Server'
      },
      {
        url: 'http://72.60.61.249:5002',
        description: 'IP Server'
      },
      {
        url: 'http://localhost:5002',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT com role admin'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Autenticação e gestão de sessão'
      },
      {
        name: 'Dashboard',
        description: 'Endpoints do dashboard'
      },
      {
        name: 'Accounts',
        description: 'Gestão de contas'
      },
      {
        name: 'Transfers',
        description: 'Gestão de transferências'
      },
      {
        name: 'Arbitrage',
        description: 'Taxas de arbitragem'
      },
      {
        name: 'Admin',
        description: 'Endpoints administrativos (requer role admin)'
      },
      {
        name: 'Public',
        description: 'Endpoints públicos'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/routes/public/*.js',
    './src/routes/admin/*.js'
  ]
};

const swaggerSpecAdmin = swaggerJsdoc(options);

module.exports = swaggerSpecAdmin;



