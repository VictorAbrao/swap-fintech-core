# 🔧 INSTRUÇÕES: Alterar Role do Admin

## ⚠️ PROBLEMA ATUAL

O usuário `admin@swapone.com` está com **role = "client"** no banco de dados.

**Evidência:**
```json
{
  "user": {
    "email": "admin@swapone.com",
    "role": "client"  ← ERRADO! Deveria ser "admin"
  }
}
```

**Resultado:**
- ❌ Admin vai para `/dashboard` (como cliente)
- ❌ Não vai para `/admin-panel`

---

## ✅ SOLUÇÃO: Alterar no Supabase

### 📝 Passo a Passo

#### 1️⃣ Acessar Supabase Dashboard

```
URL: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg
```

#### 2️⃣ Ir para SQL Editor

```
Menu lateral → SQL Editor
ou
https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/sql
```

#### 3️⃣ Criar Nova Query

```
Clicar em "+ New query"
```

#### 4️⃣ Copiar e Colar este SQL

```sql
-- Atualizar role para admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'e6533471-7316-434e-8a9b-a8ee9f2603f0';

-- Verificar se atualizou
SELECT id, role, client_id, created_at
FROM public.profiles
WHERE id = 'e6533471-7316-434e-8a9b-a8ee9f2603f0';
```

#### 5️⃣ Executar (Run)

```
Clicar no botão "Run" ou pressionar Ctrl+Enter
```

#### 6️⃣ Verificar Resultado

**Esperado:**
```
id: e6533471-7316-434e-8a9b-a8ee9f2603f0
role: admin  ← ✅ Deve mostrar "admin"
client_id: null
```

---

## 🧪 Testar Após Alterar

### 1. Fazer Login Novamente

```bash
curl -X POST http://72.60.61.249:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swapone.com","password":"admin123"}'
```

**Verificar Response:**
```json
{
  "success": true,
  "token": "...",
  "user": {
    "email": "admin@swapone.com",
    "role": "admin"  ← ✅ Deve ser "admin" agora!
  }
}
```

### 2. Testar no Frontend

```
1. Abrir: http://72.60.61.249:5001/login
2. Email: admin@swapone.com
3. Senha: admin123
4. Clicar em "Continue"
5. ✅ Deve ir para: http://72.60.61.249:5001/admin-panel
```

---

## 🎯 Alternativa: Via Table Editor

Se preferir interface visual:

#### 1️⃣ Ir para Table Editor
```
Menu lateral → Table Editor → profiles
ou
https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/editor
```

#### 2️⃣ Encontrar o Registro
```
Na tabela "profiles":
- Procurar linha onde id = e6533471-7316-434e-8a9b-a8ee9f2603f0
- Ou filtrar por email (se houver coluna email)
```

#### 3️⃣ Editar o Campo "role"
```
1. Clicar na célula do campo "role"
2. Mudar de: client
3. Para: admin
4. Pressionar Enter
```

#### 4️⃣ Salvar
```
Alterações são salvas automaticamente
```

---

## 📋 Checklist de Validação

Após alterar o role:

- [ ] Executar SQL no Supabase
- [ ] Ver resultado: `role = 'admin'`
- [ ] Fazer logout do frontend (se logado)
- [ ] Limpar localStorage: `localStorage.clear()`
- [ ] Fazer login novamente
- [ ] Verificar se vai para `/admin-panel`
- [ ] Verificar se não tem botão "Voltar ao Dashboard"

---

## 🔍 Debug: Verificar Role Atual

### Via SQL
```sql
SELECT 
  p.id, 
  u.email, 
  p.role, 
  p.client_id
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'admin@swapone.com';
```

### Via API
```bash
# 1. Fazer login
curl -X POST http://72.60.61.249:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swapone.com","password":"admin123"}'

# 2. Copiar o token
export TOKEN="seu_token"

# 3. Verificar perfil
curl http://72.60.61.249:5002/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## ❓ Troubleshooting

### Problema: Ainda vai para /dashboard

**Causa**: Role ainda é "client"

**Solução**:
1. Verificar se executou o SQL corretamente
2. Limpar cache do browser (Ctrl+Shift+Del)
3. Limpar localStorage: 
   ```javascript
   localStorage.clear();
   location.reload();
   ```
4. Fazer login novamente

### Problema: SQL não funcionou

**Verificar**:
```sql
-- Ver se o ID está correto
SELECT * FROM auth.users WHERE email = 'admin@swapone.com';

-- Ver o profile atual
SELECT * FROM public.profiles WHERE id = 'ID_DO_ADMIN';
```

---

## 📄 Arquivo SQL Pronto

Criado o arquivo: `ALTERAR_ADMIN_ROLE.sql`

Você pode:
1. Abrir o arquivo
2. Copiar o SQL
3. Colar no SQL Editor do Supabase
4. Executar

---

**IMPORTANTE**: Após alterar o role no Supabase, você DEVE:
1. Fazer logout (se estiver logado)
2. Limpar localStorage
3. Fazer login novamente
4. Aí sim vai para `/admin-panel` ✅

---

**Arquivo SQL**: `ALTERAR_ADMIN_ROLE.sql`  
**ID do Admin**: `e6533471-7316-434e-8a9b-a8ee9f2603f0`  
**Role Atual**: `client` ❌  
**Role Desejado**: `admin` ✅



