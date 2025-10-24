# 📚 Documentação Swagger Dupla - SwapOne Fintech

## 🎯 Objetivo

Separar a documentação da API em **2 Swagger diferentes**:

1. **Swagger Público** - Para clientes verem endpoints disponíveis
2. **Swagger Admin** - Completo, apenas para desenvolvedores/administradores

## 📋 URLs de Acesso

### 🌐 Swagger Público (Clientes)
```
http://72.60.61.249:5002/api-docs
```

**Conteúdo:**
- ✅ Endpoint de login apenas
- ✅ POST /api/auth/login

**Não Inclui:**
- ❌ Endpoints públicos
- ❌ Dashboard interno
- ❌ Gestão de contas
- ❌ Transferências
- ❌ Arbitragem

---

### 🔒 Swagger Admin (Completo)
```
http://72.60.61.249:5002/admin/api-docs
```

**Conteúdo:**
- ✅ TODOS os endpoints
- ✅ Autenticação
- ✅ Dashboard
- ✅ Contas
- ✅ Transferências
- ✅ Arbitragem
- ✅ Endpoints públicos
- ✅ Endpoints administrativos

---

## 📁 Estrutura de Arquivos

### Configurações Swagger

```
swapone-fintech-api/
├── src/
│   ├── config/
│   │   ├── swagger-public.js    # Config Swagger Público
│   │   └── swagger-admin.js     # Config Swagger Admin
│   ├── routes/
│   │   ├── auth.js              # Autenticação (ambos)
│   │   ├── dashboard.js         # Dashboard (só admin)
│   │   ├── accounts.js          # Contas (só admin)
│   │   ├── transfers.js         # Transferências (só admin)
│   │   ├── arbitrage.js         # Arbitragem (só admin)
│   │   └── public/
│   │       └── clients.js       # Endpoints públicos
│   └── server.js                # Configuração dos 2 Swagger
```

---

## 🔌 Endpoints Públicos Criados

### 1. **GET /api/public/clients**
Lista todos os clientes cadastrados

**Request:**
```bash
curl http://72.60.61.249:5002/api/public/clients \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "client@example.com",
      "name": "John Doe",
      "registeredAt": "2025-10-15T10:30:00Z"
    }
  ],
  "total": 4
}
```

---

### 2. **POST /api/public/quotation**
Calcula cotação entre moedas

**Request:**
```bash
curl -X POST http://72.60.61.249:5002/api/public/quotation \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "USD",
    "to": "EUR",
    "amount": 1000
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "amount": 1000,
    "result": 920,
    "exchangeRate": 0.92,
    "timestamp": "2025-10-20T20:30:00Z"
  }
}
```

**Moedas Suportadas:**
- USD, EUR, GBP, BRL, USDC, USDT

---

## 🔧 Configuração Técnica

### swagger-public.js

```javascript
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwapOne Fintech API - Public',
      version: '1.0.0',
      description: 'API pública para clientes'
    },
    tags: [
      { name: 'Authentication' },
      { name: 'Public' }
    ]
  },
  apis: [
    './src/routes/public/*.js',
    './src/routes/auth.js'
  ]
};
```

### swagger-admin.js

```javascript
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SwapOne Fintech API - Admin',
      version: '1.0.0',
      description: 'API completa para administradores'
    },
    tags: [
      { name: 'Authentication' },
      { name: 'Dashboard' },
      { name: 'Accounts' },
      { name: 'Transfers' },
      { name: 'Arbitrage' },
      { name: 'Admin' },
      { name: 'Public' }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/routes/public/*.js',
    './src/routes/admin/*.js'
  ]
};
```

### server.js

```javascript
// Swagger Public
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerPublic, {
  customSiteTitle: 'SwapOne API - Public'
}));

// Swagger Admin
app.use('/admin/api-docs', swaggerUi.serve);
app.get('/admin/api-docs', swaggerUi.setup(swaggerAdmin, {
  customSiteTitle: 'SwapOne API - Admin'
}));
```

---

## 🎨 Diferenças Visuais

### Swagger Público
- **Título:** SwapOne API - Public
- **Cor:** Padrão (verde)
- **Seções:** Authentication, Public
- **Endpoints:** ~5 endpoints

### Swagger Admin
- **Título:** SwapOne API - Admin
- **Cor:** Vermelho (indicando admin)
- **Seções:** Todas as tags
- **Endpoints:** ~20+ endpoints

---

## 🔐 Segurança

### Autenticação
Ambos os Swagger usam Bearer Token (JWT):

```javascript
// Header em todas as requisições
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Controle de Acesso

**Público (/api/public/*):**
- ✅ Qualquer usuário autenticado (client ou admin)
- Middleware: `authenticateToken, requireClientOrAbove`

**Admin (/api/dashboard, /api/accounts, etc):**
- ✅ Apenas usuários com role específica
- Middleware: `authenticateToken, requireAdmin` (futuro)

---

## 🧪 Como Testar

### Teste Completo

```bash
# 1. Fazer login
curl -X POST http://72.60.61.249:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swapone.com","password":"admin123"}'

# Salvar o token retornado
export TOKEN="seu_token_aqui"

# 2. Testar endpoint público - Listar clientes
curl http://72.60.61.249:5002/api/public/clients \
  -H "Authorization: Bearer $TOKEN"

# 3. Testar endpoint público - Calcular cotação
curl -X POST http://72.60.61.249:5002/api/public/quotation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"from":"USD","to":"EUR","amount":1000}'

# 4. Acessar Swagger Público
# Browser: http://72.60.61.249:5002/api-docs

# 5. Acessar Swagger Admin
# Browser: http://72.60.61.249:5002/admin/api-docs
```

### Via Swagger UI

**Swagger Público:**
1. Abrir: http://72.60.61.249:5002/api-docs
2. Clicar em "Authorize" (🔓)
3. Colar: `Bearer seu_token_aqui`
4. Testar endpoints disponíveis

**Swagger Admin:**
1. Abrir: http://72.60.61.249:5002/admin/api-docs
2. Clicar em "Authorize" (🔓)
3. Colar: `Bearer seu_token_aqui`
4. Ver TODOS os endpoints disponíveis

---

## 📊 Comparação

| Aspecto | Swagger Público | Swagger Admin |
|---------|-----------------|---------------|
| **URL** | `/api-docs` | `/admin/api-docs` |
| **Audience** | Clientes | Desenvolvedores/Admin |
| **Endpoints** | 5 endpoints | 20+ endpoints |
| **Tags** | 2 (Auth, Public) | 7+ (todas) |
| **Cor** | Verde | Vermelho |
| **Acesso** | Todos | Interno |
| **JSON** | `/swagger-public.json` | `/swagger-admin.json` |

---

## 🚀 Benefícios

### Para Clientes (Público)
1. ✅ Documentação clara e simples
2. ✅ Apenas endpoints relevantes
3. ✅ Não sobrecarrega com informação desnecessária
4. ✅ Foco em funcionalidades públicas

### Para Desenvolvedores (Admin)
1. ✅ Documentação completa
2. ✅ Todos os endpoints disponíveis
3. ✅ Facilita desenvolvimento e debug
4. ✅ Centraliza toda a informação técnica

### Para o Projeto
1. ✅ Melhor organização
2. ✅ Separação de responsabilidades
3. ✅ Mais profissional
4. ✅ Fácil manutenção

---

## 🔄 Fluxo de Uso

### Cliente Vendo Documentação

```
1. Cliente recebe link: http://72.60.61.249:5002/api-docs
2. Abre no browser
3. Vê apenas:
   - Como fazer login
   - Como listar clientes
   - Como calcular cotação
4. Testa diretamente no Swagger UI
```

### Desenvolvedor Consultando API

```
1. Dev acessa: http://72.60.61.249:5002/admin/api-docs
2. Vê todos os endpoints
3. Consulta parâmetros, responses
4. Testa integração completa
5. Exporta collection (OpenAPI)
```

---

## 📝 Endpoints por Swagger

### 🌐 Swagger Público
```
POST   /api/auth/login
```

### 🔒 Swagger Admin
```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/dashboard/summary
GET    /api/dashboard/statistics
GET    /api/dashboard/exchange-rates
GET    /api/accounts
GET    /api/accounts/:id
GET    /api/accounts/:id/balance
GET    /api/accounts/:id/transactions
GET    /api/transfers
POST   /api/transfers
GET    /api/arbitrage/rates
GET    /api/public/clients
POST   /api/public/quotation
```

---

## 🎯 Próximos Passos

### 1. Proteção de Rota Admin
```javascript
// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Aplicar no Swagger Admin
app.get('/admin/api-docs', requireAdmin, swaggerUi.setup(...));
```

### 2. Versionamento
```
/api/v1/public/clients
/api/v2/public/clients
```

### 3. Rate Limiting Diferenciado
```javascript
// Público: 100 req/min
// Admin: 1000 req/min
```

### 4. Analytics
```javascript
// Rastrear uso de cada endpoint
// Dashboard de métricas
```

---

## 💡 Dicas

1. **Compartilhar Público**: Enviar link `/api-docs` para clientes
2. **Manter Admin Privado**: Não compartilhar `/admin/api-docs`
3. **Atualizar Documentação**: Sempre documentar novos endpoints
4. **Testar Swagger**: Validar que ambos funcionam após mudanças
5. **Exportar OpenAPI**: Usar para gerar clients automáticos

---

**Criado**: 20/10/2025 20:35
**Status**: ✅ Implementado e funcional
**URLs Públicas**: 
- http://72.60.61.249:5002/api-docs
- http://72.60.61.249:5002/admin/api-docs

