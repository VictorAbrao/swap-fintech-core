# 🔑 Como Pegar a Service Role Key

## 📍 URL Direta

```
https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/settings/api
```

## 👀 O que Procurar

Na página de **Settings → API**, você verá duas chaves:

### 1. anon (public) ✅ JÁ TEMOS
```
Esta chave é pública e segura para usar no frontend
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbmNhem1reGhzY2hsaXpjamRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NzAwMDUsImV4cCI6MjA3NjU0NjAwNX0.UWuodAKKIO0Un7eaU4Oa1NwrtOjd8PW1JQo4nVIHqnA
```

### 2. service_role (secret) ⚠️ PRECISAMOS DESTA

```
Esta chave é SECRETA e tem acesso total ao banco
Ela aparece escondida como: ••••••••••••••••••••••
```

**Para revelar:**
1. Clicar no botão **"Reveal"** ao lado de service_role
2. A chave completa será mostrada
3. Clicar em **"Copy"** para copiar

A chave começa com: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbmNhem1reGhzY2hsaXpjamRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6...`

**ENVIE ESSA CHAVE** e eu atualizo o .env e executo o script para alterar o role do admin!

---

## ⚠️ IMPORTANTE

A **service_role key**:
- ✅ Permite criar/alterar usuários
- ✅ Permite executar qualquer operação no banco
- ⚠️ Nunca deve ser exposta no frontend
- ⚠️ Apenas para uso no backend/scripts

---

**Aguardando você enviar a service_role key!** 🔑



