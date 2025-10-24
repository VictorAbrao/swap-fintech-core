# 🧪 Teste de Login - Instruções

## ✅ Status da API

A API está **funcionando corretamente**! Testado em: 20/10/2025 20:08

```bash
curl 'http://72.60.61.249:5002/api/auth/login' \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"admin@swapone.com","password":"admin123"}'

# Resposta:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "e6533471-7316-434e-8a9b-a8ee9f2603f0",
    "email": "admin@swapone.com",
    "role": "client",
    "client_id": null,
    "twofa_enabled": false
  }
}
```

## 🔍 Como Testar no Frontend

### Passo 1: Abrir o Console do Browser
1. Acesse: http://72.60.61.249:5001/login
2. Pressione **F12** para abrir o DevTools
3. Vá para a aba **Console**

### Passo 2: Fazer Login
1. Digite as credenciais:
   - **Email**: `admin@swapone.com`
   - **Senha**: `admin123`
2. Clique em **Continue**
3. **Observe o console** para ver se há erros

### Passo 3: Verificar Network
1. Na aba **Network** do DevTools
2. Filtre por **Fetch/XHR**
3. Procure pela requisição para `/api/auth/login`
4. Verifique:
   - Status: Deve ser **200**
   - Response: Deve conter `success: true` e `token`

### Passo 4: Verificar LocalStorage
1. Na aba **Application** (Chrome) ou **Storage** (Firefox)
2. Expanda **Local Storage**
3. Clique em `http://72.60.61.249:5001`
4. Procure por **auth_token** - deve conter o JWT

## 🐛 Problemas Comuns

### Erro: "CORS"
**Causa**: API bloqueando requisições do frontend

**Solução**: 
```bash
# Verificar se a API está aceitando origin do frontend
curl -v 'http://72.60.61.249:5002/api/auth/login' \
  -H 'Origin: http://72.60.61.249:5001' \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"admin@swapone.com","password":"admin123"}' 2>&1 | grep "Access-Control"

# Deve retornar:
# Access-Control-Allow-Origin: http://72.60.61.249:5001
# Access-Control-Allow-Credentials: true
```

### Erro: "Network Error"
**Causa**: API não está rodando

**Solução**:
```bash
# Verificar se a API está online
curl http://72.60.61.249:5002/health

# Deve retornar:
# {"status":"OK","timestamp":"...","uptime":...}
```

### Erro: "Invalid credentials"
**Causa**: Email ou senha incorretos

**Solução**:
- Usar: `admin@swapone.com` / `admin123`
- OU: `teste@swapone.com` / `123456`

### Não redireciona após login
**Causa**: Hook useAuth não está atualizando o estado

**Debug**:
```javascript
// Abrir console e executar:
localStorage.getItem('auth_token')

// Se retornar o token, mas não redireciona:
// 1. Verificar se o Dashboard está verificando autenticação
// 2. Recarregar a página (F5)
```

## 📊 Fluxo Esperado

```
1. Usuário digita email/senha
   ↓
2. Frontend chama apiService.login()
   ↓
3. API autentica no Supabase
   ↓
4. API gera JWT token
   ↓
5. API retorna token + dados do usuário
   ↓
6. Frontend salva token no localStorage
   ↓
7. Frontend atualiza estado (user, session)
   ↓
8. Frontend redireciona para /dashboard
   ↓
9. Dashboard busca dados via API
   (usando o token no header Authorization)
```

## 🧰 Ferramentas de Debug

### 1. Verificar Estado do Auth
```javascript
// No console do browser:
const token = localStorage.getItem('auth_token');
console.log('Token:', token);

// Decodificar token (sem validar assinatura):
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload:', payload);
```

### 2. Testar Endpoint Manualmente
```javascript
// No console do browser:
fetch('http://72.60.61.249:5002/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'admin@swapone.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

### 3. Verificar Dashboard
```javascript
// No console do browser (após login):
const token = localStorage.getItem('auth_token');

fetch('http://72.60.61.249:5002/api/dashboard/summary', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log('Dashboard:', data))
.catch(err => console.error('Error:', err));
```

## 📝 Logs Importantes

### Logs da API (Terminal)
```bash
# Ver logs em tempo real:
cd /root/swapone-fintech-one/swapone-fintech-api
# Os logs aparecem automaticamente (nodemon)

# Procurar por:
# ✅ "Login successful" - Login OK
# ❌ "Login error" - Erro no login
# ✅ "Dashboard summary" - Dashboard OK
```

### Logs do Frontend (Browser Console)
```
# Procurar por:
✅ "Sign in successful"
❌ "Sign in error"
✅ "Dashboard data loaded"
❌ "Dashboard error"
```

## 🎯 Teste Completo

Execute este teste passo a passo:

```bash
# 1. Verificar API está rodando
curl http://72.60.61.249:5002/health
# ✅ Esperado: {"status":"OK",...}

# 2. Testar login na API
curl -s 'http://72.60.61.249:5002/api/auth/login' \
  -H 'Content-Type: application/json' \
  --data-raw '{"email":"admin@swapone.com","password":"admin123"}' \
  | grep -o '"success":[^,]*'
# ✅ Esperado: "success":true

# 3. Verificar frontend está rodando
curl -s http://72.60.61.249:5001 | grep -o "<title>[^<]*"
# ✅ Esperado: <title>SwapOne ou similar

# 4. Abrir no browser e fazer login
# http://72.60.61.249:5001/login

# 5. Verificar token foi salvo
# F12 → Application → Local Storage → auth_token

# 6. Verificar dashboard carrega
# http://72.60.61.249:5001/dashboard
```

## 💡 Dicas

1. **Sempre verificar o console do browser** - Lá aparecem os erros mais detalhados
2. **Usar aba Network** - Mostra todas as requisições e respostas
3. **Limpar localStorage** - Se tiver problemas, limpe o cache:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
4. **Verificar CORS** - Se houver erro de CORS, a API precisa ser reiniciada
5. **Token expira em 24h** - Após 24h, fazer login novamente

## 📞 Suporte

Se após todos esses testes ainda não funcionar:

1. Copiar **todos os erros** do console
2. Copiar a **resposta da aba Network**
3. Copiar os **logs da API** (terminal)
4. Enviar para análise

---

**Última atualização**: 20/10/2025 20:08
**Status**: ✅ API Funcionando | 🔄 Frontend em teste



