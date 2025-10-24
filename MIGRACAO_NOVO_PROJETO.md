# Migração para Novo Projeto Supabase

O projeto foi configurado para usar o novo projeto Supabase:

**Projeto Antigo**: `fopuckodfcsksuzvhgxu`  
**Projeto Novo**: `sfncazmkxhschlizcjdg` ✅

---

## ⚠️ IMPORTANTE: Buscar Chave do Novo Projeto

Você precisa buscar a **anon key** do novo projeto e atualizar o arquivo `.env`.

### 📍 Como Buscar a Chave:

1. **Acesse o Dashboard**
   - URL: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg

2. **Vá em Settings**
   - No menu lateral, clique no ícone de **engrenagem** (⚙️)
   - Ou clique em **Settings**

3. **Clique em API**
   - No submenu de Settings, clique em **API**

4. **Copie a Chave**
   - Procure por **"Project API keys"**
   - Copie a chave **`anon`** / **`public`**
   - Ela parece com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

5. **Atualize o .env**
   ```bash
   # Edite o arquivo
   nano /root/swapone-fintech-one/swapone-fintech-front/.env
   
   # Substitua "PRECISA_BUSCAR_NO_DASHBOARD" pela chave real
   VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGci...SUA_CHAVE_AQUI"
   ```

---

## 🗄️ Aplicar Migrations no Novo Projeto

O novo projeto precisa ter as mesmas tabelas. Você tem duas opções:

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Fazer login
supabase login

# 3. Ir para a pasta do backend
cd /root/swapone-fintech-one/swapone-fintech-back

# 4. Linkar ao novo projeto
supabase link --project-ref sfncazmkxhschlizcjdg

# 5. Aplicar todas as migrations
supabase db push

# 6. Verificar
supabase db diff
```

### Opção 2: Via SQL Editor no Dashboard

1. Acesse: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg
2. Clique em **SQL Editor** no menu lateral
3. Execute cada arquivo SQL da pasta `migrations/` na ordem:

```bash
# Ordem dos arquivos:
1. 20251020142958_50559d91-bbee-45af-b191-0c8737bba078.sql
2. 20251020143433_9efb8c62-c623-451b-9ada-b114da0187e7.sql
3. 20251020143639_730a01b5-606d-457c-af56-fee3e249884c.sql
4. 20251020144811_0d0e4d9e-d2d6-4bd4-93ea-f5da3e3144bc.sql
5. 20251020150058_d5ec878e-2332-414e-b071-4819a545e6ba.sql
6. 20251020172946_cd665eed-96be-4621-a668-8cae10074d84.sql
```

Copie o conteúdo de cada arquivo e execute no SQL Editor.

---

## 📁 Arquivos Atualizados

### Backend:
✅ `/root/swapone-fintech-one/swapone-fintech-back/config.toml`
```toml
project_id = "sfncazmkxhschlizcjdg"
```

### Frontend:
✅ `/root/swapone-fintech-one/swapone-fintech-front/.env`
```env
VITE_SUPABASE_PROJECT_ID="sfncazmkxhschlizcjdg"
VITE_SUPABASE_URL="https://sfncazmkxhschlizcjdg.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="PRECISA_BUSCAR_NO_DASHBOARD"
```

⚠️ **LEMBRE-SE**: Substitua `PRECISA_BUSCAR_NO_DASHBOARD` pela chave real!

---

## 🚀 Próximos Passos

### 1. Buscar a Chave Anon
- Acesse: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/settings/api
- Copie a **anon key**
- Atualize o arquivo `.env`

### 2. Aplicar Migrations
```bash
cd /root/swapone-fintech-one/swapone-fintech-back
supabase login
supabase link --project-ref sfncazmkxhschlizcjdg
supabase db push
```

### 3. Deploy das Edge Functions (se necessário)
```bash
cd /root/swapone-fintech-one/swapone-fintech-back
supabase functions deploy apply-arbitrage
supabase functions deploy finalize-transfer
```

### 4. Testar o Frontend
```bash
cd /root/swapone-fintech-one/swapone-fintech-front
npm install
npm run dev
```

---

## 🔍 Verificar se Funcionou

### Testar Conexão:
```bash
# No frontend, criar um arquivo de teste
cat > /tmp/test-supabase.js << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://sfncazmkxhschlizcjdg.supabase.co',
  'SUA_ANON_KEY_AQUI'
)

const { data, error } = await supabase
  .from('clients')
  .select('*')

console.log('Data:', data)
console.log('Error:', error)
EOF
```

### Verificar no Dashboard:
1. Acesse: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg
2. Clique em **Table Editor**
3. Veja se as tabelas aparecem:
   - clients
   - profiles
   - accounts
   - beneficiaries
   - transfers
   - arbitrage_rates
   - manuals
   - audit_logs
   - user_roles

---

## 📊 Comparação

| Item | Projeto Antigo | Projeto Novo |
|------|---------------|--------------|
| **Project ID** | fopuckodfcsksuzvhgxu | sfncazmkxhschlizcjdg ✅ |
| **URL** | https://fopuckodfcsksuzvhgxu.supabase.co | https://sfncazmkxhschlizcjdg.supabase.co ✅ |
| **Backend Config** | ✅ Atualizado | |
| **Frontend .env** | ✅ Atualizado (falta anon key) | |
| **Migrations** | ❌ Precisa aplicar | |
| **Edge Functions** | ❌ Precisa fazer deploy | |

---

## ❓ Problemas Comuns

### "Invalid API key"
- Verifique se copiou a **anon key** correta
- Certifique-se que não tem espaços extras

### "Table does not exist"
- Aplique as migrations com `supabase db push`
- Ou execute os arquivos SQL manualmente

### "Project not found"
- Verifique se você tem acesso ao projeto `sfncazmkxhschlizcjdg`
- Faça login no dashboard para confirmar

---

## 📞 Links Úteis

- **Dashboard do Projeto**: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg
- **API Settings**: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/settings/api
- **Table Editor**: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/editor
- **SQL Editor**: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/sql

---

**Status**: Configuração parcialmente concluída  
**Próximo Passo**: Buscar anon key e aplicar migrations  
**Data**: Outubro 2025

