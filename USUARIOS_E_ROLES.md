# 👥 Usuários e Roles - SwapOne Fintech

## 🎯 Sistema de Roles Implementado

O sistema possui 3 níveis de acesso:

1. **admin** - Administradores (acesso total)
2. **ops** - Operadores (acesso intermediário)
3. **client** - Clientes (acesso básico)

## 🛡️ Middleware de Autorização

### Já Implementado em `src/middleware/auth.js`:

```javascript
// Verificar se é admin
const requireAdmin = authorizeRoles('admin');

// Verificar se é admin ou ops
const requireAdminOrOps = authorizeRoles('admin', 'ops');

// Verificar se é cliente ou superior
const requireClientOrAbove = authorizeRoles('admin', 'ops', 'client');
```

## 👤 Usuários Existentes

### 🔐 Usuário ADMIN

```
Email: admin@swapone.com
Senha: admin123
Role Atual: client (❌ PRECISA ALTERAR PARA "admin")
```

**⚠️ AÇÃO NECESSÁRIA:**
Alterar o role de `client` para `admin` no Supabase Dashboard

### 👤 Usuário CLIENTE 1

```
Email: teste@swapone.com
Senha: 123456
Role: client ✅
```

### 👤 Usuário CLIENTE 2 (A CRIAR)

```
Email: cliente@swapone.com
Senha: cliente123
Role: client
```

**Status:** ❌ Precisa ser criado manualmente

---

## 📝 Como Configurar no Supabase Dashboard

### Passo 1: Alterar admin@swapone.com para role "admin"

1. Acessar: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/editor
2. Selecionar tabela **profiles**
3. Encontrar a linha onde `id` corresponde ao usuário `admin@swapone.com`
   - Para descobrir o ID, ir em Authentication → Users
   - Copiar o UUID do usuário admin@swapone.com
4. Na tabela profiles, editar o campo **role**:
   - De: `client`
   - Para: `admin`
5. Salvar

### Passo 2: Criar usuário cliente@swapone.com

1. Ir para: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/auth/users
2. Clicar em **"Add user"** → **"Create new user"**
3. Preencher:
   - Email: `cliente@swapone.com`
   - Password: `cliente123`
   - ✅ Auto Confirm User (marcar)
4. Clicar em **"Create user"**
5. **COPIAR O UUID** do usuário criado

### Passo 3: Criar perfil para cliente@swapone.com

1. Ir para: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/editor
2. Selecionar tabela **profiles**
3. Clicar em **"Insert row"**
4. Preencher:
   - `id`: (UUID copiado do passo 2)
   - `client_id`: `00000000-0000-0000-0000-000000000001`
   - `role`: `client`
   - `twofa_enabled`: `false`
5. Salvar

---

## 🧪 Testar Roles

### Teste 1: Login como Admin

```bash
curl -X POST http://72.60.61.249:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@swapone.com",
    "password": "admin123"
  }'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "token": "...",
  "user": {
    "id": "...",
    "email": "admin@swapone.com",
    "role": "admin",  ← Deve ser "admin" após alterar no Supabase
    "client_id": null,
    "twofa_enabled": false
  }
}
```

### Teste 2: Login como Cliente

```bash
curl -X POST http://72.60.61.249:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@swapone.com",
    "password": "cliente123"
  }'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "token": "...",
  "user": {
    "id": "...",
    "email": "cliente@swapone.com",
    "role": "client",  ← Deve ser "client"
    "client_id": "00000000-0000-0000-0000-000000000001",
    "twofa_enabled": false
  }
}
```

---

## 🔒 Protegendo Rotas

### Exemplo: Proteger Painel Administrativo

No futuro, adicionar proteção nas rotas:

```javascript
// No server.js ou nas rotas específicas
const { requireAdmin } = require('./middleware/auth');

// Apenas admins podem acessar
app.get('/admin/api-docs', requireAdmin, swaggerUi.setup(...));

// Ou no frontend (AdminPanel.tsx)
const { user } = useAuth();

if (user.role !== 'admin') {
  return <Navigate to="/dashboard" />;
}
```

---

## 📊 Resumo de Acesso

### Swagger Público (`/api-docs`)
- ✅ Todos (sem autenticação para visualizar)
- ✅ Apenas endpoint de login exposto

### Swagger Admin (`/admin/api-docs`)
- ✅ Todos (sem proteção ainda)
- 🔄 **TODO**: Adicionar `requireAdmin`

### Painel Administrativo (`/admin-panel`)
- ✅ Protegido por `ProtectedRoute` (requer login)
- 🔄 **TODO**: Adicionar verificação de role admin

### Dashboard (`/dashboard`)
- ✅ Protegido por `ProtectedRoute`
- ✅ Acessível por qualquer usuário autenticado

---

## ✅ Checklist de Configuração

- [ ] Alterar role de admin@swapone.com de "client" para "admin"
- [ ] Criar usuário cliente@swapone.com
- [ ] Criar perfil para cliente@swapone.com com role "client"
- [ ] Testar login como admin (verificar role no token)
- [ ] Testar login como cliente
- [ ] (Opcional) Proteger `/admin/api-docs` com requireAdmin
- [ ] (Opcional) Proteger `/admin-panel` por role no frontend

---

## 🎯 Resultado Final

Após configuração:

| Email | Senha | Role | Acesso |
|-------|-------|------|--------|
| admin@swapone.com | admin123 | **admin** | Total |
| teste@swapone.com | 123456 | client | Cliente |
| cliente@swapone.com | cliente123 | client | Cliente |

---

## 📝 Notas Importantes

1. **JWT Token**: Contém o `role` do usuário
2. **Middleware**: Já implementado e pronto para uso
3. **Frontend**: Pode verificar `user.role` do `useAuth()`
4. **Backend**: Usar middlewares `requireAdmin`, `requireAdminOrOps`, etc.

---

**Criado**: 20/10/2025 21:10
**Status**: ⚠️ Configuração manual necessária no Supabase
**Middleware**: ✅ Implementado
**Usuários**: ⏳ Aguardando criação manual



