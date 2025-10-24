const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwapOne Fintech API - Public',
      version: '1.0.0',
      description: 'API pública para clientes do SwapOne Fintech',
      contact: {
        name: 'SwapOne Support',
        email: 'support@swapone.com'
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
          description: 'Token JWT obtido após login'
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
        description: 'Autenticação - Login para obter token de acesso'
      },
      {
        name: 'Public',
        description: 'Endpoints públicos disponíveis'
      }
    ]
  },
  apis: [
    './src/routes/auth-public.js',
    './src/routes/public/quotation.js',
    './src/routes/public/execute-operation.js',
    './src/routes/public/balance.js',
    './src/routes/public/operations.js'
  ]
};

const swaggerSpecPublic = swaggerJsdoc(options);

module.exports = swaggerSpecPublic;

