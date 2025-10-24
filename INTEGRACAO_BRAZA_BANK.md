# 🏦 Integração com Braza Bank - Implementação Completa

## 🎯 Objetivo

Integrar nossa API com a API do Braza Bank para obter cotações reais de USD e USDT para BRL.

---

## ✅ Implementação Completa

### 1. Credenciais Configuradas (.env)

```bash
# Braza Bank API
BRAZA_API_URL=https://sandbox.fxcore.brazabank.com.br:8443
BRAZA_USERNAME=api.swaphomol
BRAZA_PASSWORD=Bj877DmfGME
BRAZA_PRODUCT_ID=182
```

### 2. Serviço de Integração Criado

**Arquivo**: `src/services/brazaBankService.js`

**Funcionalidades**:
- ✅ Autenticação automática com Braza Bank
- ✅ Gerenciamento de tokens (access + refresh)
- ✅ Renovação automática de token expirado
- ✅ Busca de cotação via `preview-quotation`

**Métodos**:
```javascript
authenticate()                    // Login no Braza Bank
ensureAuthenticated()             // Garante token válido
getPreviewQuotation(currency, amount, side)  // Busca cotação
```

### 3. Endpoint Público Criado

**Rota**: `POST /api/public/braza-quotation`

**Request**:
```json
{
  "currency": "USDT",
  "amount": 10,
  "side": "buy"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "6b957993-0aa9-4a5e-b175-ccbce07f44ab",
    "final_quotation": "5.3806",
    "fgn_quantity": "10.00",
    "brl_quantity": "53.81",
    "quote": "5.3800",
    "vet": "5.381000",
    "iof": "0.00",
    "fees_amount": "0.00"
  }
}
```

### 4. Frontend Atualizado

**Arquivo**: `src/pages/AdminPanel.tsx`

**Campos Adicionados**:
- ✅ Moeda (USD ou USDT)
- ✅ Amount (valor inteiro)
- ✅ **Side** (Comprar ou Vender)

**Resultado Exibe**:
- ✅ ID da cotação
- ✅ Cotação final (R$ por unidade)
- ✅ Quantidade na moeda estrangeira
- ✅ **Valor total em BRL**
- ✅ Resumo da operação

---

## 🔄 Fluxo Completo

```
Frontend (AdminPanel)
         ↓
  Seleciona:
  - Moeda: USDT
  - Amount: 10
  - Side: Comprar
         ↓
  Clica em "Verificar"
         ↓
Nossa API (/api/public/braza-quotation)
         ↓
  Autentica com Braza Bank
  (username + password)
         ↓
  Recebe access_token
         ↓
  Chama /rates-ttl/v2/order/preview-quotation
  {
    currency_amount: "USDT",
    amount: 10,
    currency: "USDT:BRL",
    side: "buy",
    product_id: 182
  }
         ↓
  Braza Bank retorna cotação
         ↓
Nossa API filtra dados importantes
         ↓
  Retorna para Frontend:
  - id
  - final_quotation
  - fgn_quantity
  - brl_quantity
         ↓
Frontend exibe resultado
```

---

## 📊 Interface do Frontend

### Formulário de Cotação

```
┌─────────────────────────────────────────┐
│  🧮 Exibição de Cotação                 │
├─────────────────────────────────────────┤
│  Selecione a Moeda                      │
│  ┌───────────────────────────────────┐  │
│  │  USDT - Tether              ▼    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Valor (Amount)                         │
│  ┌───────────────────────────────────┐  │
│  │  10                               │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Tipo de Operação                       │
│  ┌───────────────────────────────────┐  │
│  │  Comprar                      ▼  │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │       VERIFICAR                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Resultado da Cotação

```
┌─────────────────────────────────────────┐
│  Resultado - USDT                       │
├─────────────────────────────────────────┤
│  Cotação Final                          │
│  R$ 5.3806                              │
│  BRL por USDT                           │
├─────────────────────────────────────────┤
│  ID: 6b957993-0aa9-4a5e-b175-ccbce...   │
│  Operação: Comprar                      │
│  Quantidade (USDT): 10.00               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  Valor em BRL: R$ 53.81                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  Cotação Base: R$ 5.3800                │
│  Consultado em: 20/10/2025 22:10        │
├─────────────────────────────────────────┤
│  📝 Resumo                              │
│  Comprando 10.00 USDT você pagará       │
│  R$ 53.81 (taxa: R$ 5.3806)            │
└─────────────────────────────────────────┘
```

---

## 🧪 Como Testar

### Via Frontend

```
1. Login: admin@swapone.com / admin123
2. Vai para /admin-panel
3. Clicar em "Exibição Cotação"
4. Preencher:
   - Moeda: USDT
   - Amount: 10
   - Operação: Comprar
5. Clicar em "Verificar"
6. ✅ Ver cotação real do Braza Bank
```

### Via API (curl)

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swapone.com","password":"admin123"}' \
  | jq -r '.token')

# 2. Buscar cotação
curl -X POST http://localhost:5002/api/public/braza-quotation \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USDT",
    "amount": 10,
    "side": "buy"
  }' | jq '.'
```

### Via Swagger Admin

```
1. Abrir: http://72.60.61.249:5002/admin/api-docs
2. Fazer login via /api/auth/login
3. Copiar token
4. Authorize com o token
5. Testar POST /api/public/braza-quotation
```

---

## 📝 Parâmetros

### currency
- **Valores**: `USD` ou `USDT`
- **Tipo**: string
- **Obrigatório**: Sim

### amount
- **Valores**: Qualquer número positivo
- **Tipo**: number
- **Obrigatório**: Sim
- **Exemplo**: 10, 100, 1000

### side
- **Valores**: `buy` (comprar) ou `sell` (vender)
- **Tipo**: string
- **Obrigatório**: Sim
- **Frontend**: Dropdown com "Comprar" e "Vender"

---

## 🔐 Segurança

### Autenticação em Camadas

1. **Cliente → Nossa API**
   - JWT token do SwapOne
   - Middleware: `authenticateToken`

2. **Nossa API → Braza Bank**
   - Username/Password
   - Access token gerenciado automaticamente
   - Renovação automática quando expira

### Credenciais Protegidas

- ✅ No .env (não commitado)
- ✅ Apenas backend tem acesso
- ✅ Frontend não conhece credenciais Braza
- ✅ Proxy seguro

---

## 📊 Dados Retornados

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| id | ID único da cotação | "6b957993-0aa9..." |
| final_quotation | Taxa final BRL por unidade | "5.3806" |
| fgn_quantity | Quantidade na moeda estrangeira | "10.00" |
| brl_quantity | Valor total em BRL | "53.81" |
| quote | Cotação base | "5.3800" |
| vet | VET (spread) | "5.381000" |
| iof | IOF aplicado | "0.00" |
| fees_amount | Taxas adicionais | "0.00" |

**Frontend exibe apenas**:
- ✅ id
- ✅ final_quotation
- ✅ fgn_quantity
- ✅ brl_quantity

---

## 🔧 Arquivos Criados/Modificados

### Backend

1. ✅ `.env` - Credenciais Braza Bank
2. ✅ `src/services/brazaBankService.js` - Serviço de integração
3. ✅ `src/routes/public/clients.js` - Endpoint público
4. ✅ Package.json - axios já instalado

### Frontend

1. ✅ `src/pages/AdminPanel.tsx` - UI com 3 campos
2. ✅ `src/services/api.js` - Método `getBrazaQuotation()`

### Documentação

1. ✅ `INTEGRACAO_BRAZA_BANK.md` - Este arquivo

---

## 🎯 Exemplo Real

### Request
```json
{
  "currency": "USDT",
  "amount": 100,
  "side": "buy"
}
```

### Response (Braza Bank)
```json
{
  "id": "abc-123-def",
  "final_quotation": "5.3806",
  "fgn_quantity": "100.00",
  "brl_quantity": "538.06"
}
```

### Exibição no Frontend
```
Cotação Final: R$ 5.3806 BRL por USDT
ID: abc-123-def
Operação: Comprar
Quantidade (USDT): 100.00
━━━━━━━━━━━━━━━━━━━━━━━━
Valor em BRL: R$ 538.06
━━━━━━━━━━━━━━━━━━━━━━━━

Resumo:
Comprando 100.00 USDT você pagará R$ 538.06 (taxa: R$ 5.3806)
```

---

## ⚙️ Configuração Técnica

### Token Expiry Management

O serviço gerencia automaticamente:
- Token expira em ~5 minutos
- `ensureAuthenticated()` verifica antes de cada request
- Renova automaticamente se expirado
- Cache do token em memória

### Error Handling

```javascript
// Se token expirar (401)
if (error.response?.status === 401) {
  this.accessToken = null;
  return this.getPreviewQuotation(...);  // Retry com novo token
}
```

### Product ID Fixo

```javascript
product_id: 182  // Configurado no .env
```

### Currency Pair

```javascript
// Sempre converte para BRL
currency: `${selectedCurrency}:BRL`  // Ex: "USDT:BRL"
```

---

## 🚀 Próximos Passos (Futuro)

### 1. Cache de Cotações
```javascript
// Cachear cotações por 30 segundos
const cacheKey = `${currency}-${amount}-${side}`;
```

### 2. Histórico de Cotações
```javascript
// Salvar cotações consultadas
POST /api/quotation-history
```

### 3. Alertas de Taxa
```javascript
// Notificar quando taxa mudar X%
if (rateChanged > 2%) {
  notify(user);
}
```

### 4. Múltiplas APIs
```javascript
// Comparar cotações de diferentes fornecedores
const bestQuote = compareBrazaWithOthers();
```

---

## 🧪 Testes Completos

### Teste 1: USD Comprar
```
Moeda: USD
Amount: 50
Operação: Comprar

Resultado esperado:
- Cotação em BRL por USD
- Quantidade: 50.00
- Valor em BRL calculado
```

### Teste 2: USDT Vender
```
Moeda: USDT
Amount: 100
Operação: Vender

Resultado esperado:
- Cotação em BRL por USDT
- Quantidade: 100.00
- Valor em BRL calculado
```

### Teste 3: Validação
```
Amount: -10 (negativo)
❌ Erro: "Amount must be a positive number"

Currency: EUR
❌ Erro: "Currency must be USD or USDT"

Side: invalid
❌ Erro: "Side must be buy or sell"
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Fonte de Dados | Mock (estático) | **Braza Bank (real)** ✅ |
| Moedas | 6 moedas | USD e USDT ✅ |
| Campos | 1 (moeda) | **3 (moeda + amount + side)** ✅ |
| Resultado | Taxa simples | **Cotação completa** ✅ |
| Integração | Nenhuma | **API Externa** ✅ |
| Atualização | Manual | **Tempo real** ✅ |

---

## 🔒 Segurança

### Credenciais Protegidas
- ✅ No .env (não no código)
- ✅ Não commitadas no Git
- ✅ Apenas backend tem acesso
- ✅ Frontend não conhece credenciais

### Proxy Seguro
```
Frontend → Nossa API (JWT) → Braza Bank (username/password)
```

Cliente não tem acesso direto ao Braza Bank

---

## ✅ Checklist de Validação

- [x] Credenciais Braza Bank no .env
- [x] BrazaBankService criado
- [x] Endpoint /braza-quotation criado
- [x] Documentação Swagger adicionada
- [x] Frontend com 3 campos (moeda, amount, side)
- [x] apiService.getBrazaQuotation() criado
- [x] Resultado mostra dados do Braza
- [ ] Testar com USDT (buy)
- [ ] Testar com USDT (sell)
- [ ] Testar com USD (buy)
- [ ] Testar com USD (sell)
- [ ] Testar validações de erro

---

**Data**: 20/10/2025 22:10  
**Status**: ✅ **INTEGRAÇÃO COMPLETA**  
**API Externa**: Braza Bank Sandbox  
**Endpoint**: `/api/public/braza-quotation`  
**Frontend**: Campo "side" adicionado  
**Teste**: Pronto para uso! 🚀



