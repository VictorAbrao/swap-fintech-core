# 🔧 Solução: "Account not found" no Frontend

## 🔍 Problema Identificado

O erro "Account not found" aparece quando você tenta acessar uma página de conta (ex: `/account/usd`) mas há um problema na integração entre frontend e API.

## ✅ API está Funcionando

```bash
# Teste confirmado:
curl 'http://72.60.61.249:5002/api/accounts' \
  -H 'Authorization: Bearer TOKEN'

# Retorna:
{
  "success": true,
  "data": [
    {"id":"account-usd","currency":"USD","balance":100000,...},
    {"id":"account-eur","currency":"EUR","balance":84996.6,...},
    ...
  ]
}
```

## 🐛 Possíveis Causas

### 1. Token Não Está Sendo Enviado
O frontend não está incluindo o token JWT nas requisições.

**Solução:**
```javascript
// Verificar se o token está salvo
localStorage.getItem('auth_token')

// Se não houver token, fazer login primeiro
// http://72.60.61.249:5001/login
```

### 2. Token Expirado
O token JWT expira em 24 horas.

**Solução:**
```javascript
// Limpar localStorage e fazer login novamente
localStorage.removeItem('auth_token');
window.location.href = '/login';
```

### 3. CORS ou Network Error
A requisição não está chegando à API.

**Verificar:**
- Abrir DevTools (F12)
- Aba Network
- Procurar requisição para `/api/accounts`
- Ver se tem erro CORS ou network

### 4. Rota Acessada Diretamente (Sem Login)
Tentando acessar `/account/usd` sem fazer login primeiro.

**Fluxo Correto:**
```
1. Acessar /login
2. Fazer login com admin@swapone.com / admin123
3. Será redirecionado para /dashboard
4. Clicar em uma conta para ir para /account/usd
```

## 🔧 Debug Passo a Passo

### 1. Verificar Token
```javascript
// Abrir console (F12) e executar:
const token = localStorage.getItem('auth_token');
console.log('Token existe?', !!token);
console.log('Token:', token);

// Se não houver token:
window.location.href = '/login';
```

### 2. Testar API Manualmente
```javascript
// No console do browser:
const token = localStorage.getItem('auth_token');

fetch('http://72.60.61.249:5002/api/accounts', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Response:', data);
  if (data.success) {
    console.log('✅ API funcionando!');
    console.log('Contas:', data.data);
  } else {
    console.log('❌ Erro na API:', data);
  }
})
.catch(err => {
  console.error('❌ Erro de rede:', err);
});
```

### 3. Verificar Logs do Console
Com os novos logs adicionados, o console mostrará:

```javascript
// Logs esperados:
API Response: { success: true, data: [...] }
Looking for accountId: usd
Checking account account-usd: { matchesId: true, ... }
Found account: { id: "account-usd", currency: "USD", ... }

// Se der erro:
Account not found. Looking for: usd
Available accounts: [{ id: "account-usd", currency: "USD" }, ...]
```

## 🎯 Solução Rápida

### Opção 1: Limpar e Relogar
```javascript
// No console do browser (F12):
localStorage.clear();
window.location.href = '/login';

// Fazer login novamente:
// Email: admin@swapone.com
// Senha: admin123
```

### Opção 2: Acessar via Dashboard
```
1. Ir para: http://72.60.61.249:5001/login
2. Fazer login
3. No dashboard, clicar em uma das contas
4. Será redirecionado corretamente para /account/usd
```

### Opção 3: Verificar se o Service está Funcionando
```javascript
// No console do browser:
import apiService from '@/services/api';

// Testar login
apiService.login('admin@swapone.com', 'admin123')
  .then(response => {
    console.log('Login response:', response);
    if (response.success) {
      console.log('✅ Login OK!');
      console.log('Token salvo:', localStorage.getItem('auth_token'));
    }
  });

// Testar buscar contas
apiService.getAccounts()
  .then(response => {
    console.log('Accounts response:', response);
  });
```

## 📊 Verificação Completa

Execute este checklist:

```bash
# 1. API está rodando?
curl http://72.60.61.249:5002/health
# ✅ Esperado: {"status":"OK"}

# 2. Pode fazer login?
curl -s 'http://72.60.61.249:5002/api/auth/login' \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"admin@swapone.com","password":"admin123"}' \
  | grep -o '"success":[^,]*'
# ✅ Esperado: "success":true

# 3. Token funciona para buscar contas?
TOKEN="SEU_TOKEN_AQUI"
curl -s "http://72.60.61.249:5002/api/accounts" \
  -H "Authorization: Bearer $TOKEN" \
  | grep -o '"success":[^,]*'
# ✅ Esperado: "success":true

# 4. Frontend está rodando?
curl -s http://72.60.61.249:5001 | grep -o "<title>[^<]*"
# ✅ Esperado: <title>...
```

## 🔄 Fluxo Correto de Uso

```
┌─────────────────────────────────────────────┐
│ 1. Abrir http://72.60.61.249:5001/login    │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 2. Fazer login (admin@swapone.com/admin123)│
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 3. Token salvo no localStorage              │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 4. Redirecionado para /dashboard           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 5. Dashboard busca dados (usa token)       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 6. Clicar em conta → /account/usd           │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│ 7. Página Account busca dados (usa token)  │
└─────────────────────────────────────────────┘
```

## 🛡️ Proteção de Rotas (TODO)

Atualmente as rotas **não estão protegidas**, então você pode acessar `/account/usd` diretamente sem login. Isso causa o erro "Account not found" porque não há token.

**Solução futura:**
```typescript
// ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

// App.tsx
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>
```

## 📞 Se Ainda Não Funcionar

Copie e envie:

1. **Console logs** (F12 → Console)
2. **Network tab** (F12 → Network → Filtrar por "accounts")
3. **Token** (se existir):
   ```javascript
   localStorage.getItem('auth_token')
   ```
4. **Erro exato** mostrado na tela

---

**Atualizado**: 20/10/2025 20:14
**Status**: Logs de debug adicionados para facilitar troubleshooting



