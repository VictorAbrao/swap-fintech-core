# 🔑 Como Pegar a Service Role Key do Supabase

## 📋 Passo a Passo

### 1️⃣ Acessar o Projeto no Supabase

```
https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg
```

### 2️⃣ Ir para Settings → API

```
Menu lateral → Settings (⚙️) → API
ou
https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/settings/api
```

### 3️⃣ Localizar "Project API keys"

Na seção **Project API keys**, você verá:

```
┌─────────────────────────────────────────────┐
│ Project API keys                            │
├─────────────────────────────────────────────┤
│ anon (public)                               │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    │
│ [Copy]                                      │
├─────────────────────────────────────────────┤
│ service_role (secret) ⚠️                    │
│ ••••••••••••••••••••••••••••••••••••••••    │
│ [Reveal] [Copy]                             │
└─────────────────────────────────────────────┘
```

### 4️⃣ Revelar a Service Role Key

```
1. Clicar em [Reveal] ao lado de "service_role"
2. A chave completa será exibida
3. Clicar em [Copy] para copiar
```

### 5️⃣ Atualizar o .env

```bash
# Editar o arquivo
nano /root/swapone-fintech-one/swapone-fintech-api/.env

# Substituir esta linha:
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Por:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  (sua chave real)

# Salvar: Ctrl+O, Enter, Ctrl+X
```

### 6️⃣ Executar Script para Alterar Role

```bash
cd /root/swapone-fintech-one/swapone-fintech-api
node scripts/setup-users.js
```

**Resultado Esperado:**
```
🚀 Configurando usuários do sistema...

1️⃣ Atualizando admin@swapone.com para role ADMIN...
  ✅ admin@swapone.com agora tem role: ADMIN
  📧 Email: admin@swapone.com
  🔑 Senha: admin123
  👤 ID: e6533471-7316-434e-8a9b-a8ee9f2603f0

...
```

---

## 🎯 OU: Fazer Manualmente no Table Editor

Se preferir usar interface visual:

### 1️⃣ Acessar Table Editor
```
https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/editor
```

### 2️⃣ Selecionar Tabela "profiles"
```
Menu lateral → Tables → profiles
```

### 3️⃣ Encontrar o Registro do Admin
```
Na tabela, procurar por:
- id = e6533471-7316-434e-8a9b-a8ee9f2603f0

Dica: Usar Ctrl+F para buscar
```

### 4️⃣ Editar o Campo "role"
```
1. Clicar na célula do campo "role"
2. Apagar "client"
3. Digitar "admin"
4. Pressionar Enter
```

### 5️⃣ Verificar
```
✅ role agora deve mostrar: admin
```

---

## ✅ Após Alterar

### 1. Limpar Cache

No browser, abrir console (F12) e executar:
```javascript
localStorage.clear();
location.reload();
```

### 2. Fazer Login Novamente

```
http://72.60.61.249:5001/login
Email: admin@swapone.com
Senha: admin123
```

### 3. Verificar Redirecionamento

```
✅ Deve ir para: http://72.60.61.249:5001/admin-panel
❌ NÃO deve ir para: http://72.60.61.249:5001/dashboard
```

---

## 🔍 Verificação Visual

### ANTES (role = "client")
```
Login admin@swapone.com
         ↓
    /dashboard  ❌
```

### DEPOIS (role = "admin")
```
Login admin@swapone.com
         ↓
   /admin-panel  ✅
```

---

## 📝 Resumo

**Opção 1 - Rápida (SQL Editor):**
1. Ir para SQL Editor
2. Colar SQL do arquivo `ALTERAR_ADMIN_ROLE.sql`
3. Executar
4. ✅ Pronto!

**Opção 2 - Visual (Table Editor):**
1. Ir para Table Editor → profiles
2. Encontrar admin@swapone.com
3. Editar role: "client" → "admin"
4. ✅ Pronto!

**Opção 3 - Automática (Script):**
1. Pegar Service Role Key
2. Atualizar .env
3. Executar `node scripts/setup-users.js`
4. ✅ Pronto!

---

## ⚠️ IMPORTANTE

**A Service Role Key é SECRETA!**
- ⚠️ Nunca compartilhar
- ⚠️ Nunca commitar no Git
- ⚠️ Apenas para uso servidor (backend)
- ✅ Já está no .gitignore

---

**Arquivo SQL**: `ALTERAR_ADMIN_ROLE.sql`  
**ID do Admin**: `e6533471-7316-434e-8a9b-a8ee9f2603f0`  
**Role Atual**: `client` ❌  
**Role Desejado**: `admin` ✅  

**Escolha a opção mais fácil para você e execute!** 🚀



