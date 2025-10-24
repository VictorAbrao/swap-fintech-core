# Guia: Como Visualizar Tabelas no Supabase

Este guia mostra diferentes formas de visualizar e gerenciar as tabelas do banco de dados Supabase do projeto SwapOne Fintech.

## Informações do Projeto

- **Project ID**: `fopuckodfcsksuzvhgxu`
- **URL do Projeto**: `https://fopuckodfcsksuzvhgxu.supabase.co`

---

## Método 1: Dashboard Web do Supabase (Recomendado) ⭐

Esta é a forma mais fácil e visual de trabalhar com o banco de dados.

### Passo a Passo:

1. **Acesse o Dashboard**
   - URL: https://supabase.com/dashboard
   - Faça login com sua conta Supabase

2. **Selecione o Projeto**
   - Na lista de projetos, encontre e clique em: `fopuckodfcsksuzvhgxu`
   - Ou busque por "SwapOne" se você nomeou o projeto

3. **Abra o Table Editor**
   - No menu lateral esquerdo, clique no ícone de tabela 🗂️
   - Ou clique em **"Table Editor"**

4. **Visualize as Tabelas**
   - No menu lateral esquerdo, você verá todas as tabelas:
     - `clients` - Clientes da plataforma
     - `profiles` - Perfis de usuários
     - `accounts` - Contas em diferentes moedas
     - `beneficiaries` - Beneficiários para transferências
     - `transfers` - Histórico de transferências
     - `arbitrage_rates` - Taxas de câmbio
     - `manuals` - Documentação do sistema
     - `audit_logs` - Logs de auditoria
     - `user_roles` - Roles dos usuários

5. **Interagir com os Dados**
   - **Ver dados**: Clique em uma tabela para ver todos os registros
   - **Adicionar**: Botão "Insert row" para adicionar novo registro
   - **Editar**: Clique em uma célula para editar
   - **Deletar**: Selecione linha(s) e clique no ícone de lixeira
   - **Filtrar**: Use os filtros no topo das colunas
   - **Ordenar**: Clique no nome da coluna

---

## Método 2: SQL Editor

Para queries SQL mais complexas:

### Passo a Passo:

1. No dashboard do Supabase, clique em **"SQL Editor"** no menu lateral
2. Digite sua query SQL
3. Clique em "Run" ou pressione `Ctrl+Enter`

### Exemplos de Queries Úteis:

```sql
-- Ver todos os clientes
SELECT * FROM clients;

-- Ver contas com saldo
SELECT * FROM accounts WHERE balance > 0;

-- Ver transferências pendentes
SELECT * FROM transfers WHERE status = 'pending_review';

-- Ver todas as contas de um cliente específico
SELECT 
  c.name as cliente,
  a.currency,
  a.balance
FROM accounts a
JOIN clients c ON a.client_id = c.id
WHERE c.name = 'SwapOne Demo Client';

-- Ver últimas transferências com detalhes
SELECT 
  t.id,
  c.name as cliente,
  t.amount,
  t.currency,
  t.status,
  t.created_at
FROM transfers t
JOIN clients c ON t.client_id = c.id
ORDER BY t.created_at DESC
LIMIT 10;

-- Ver taxas de câmbio atuais
SELECT 
  pair,
  rate,
  spread_bps,
  updated_at
FROM arbitrage_rates;

-- Contar transferências por status
SELECT 
  status,
  COUNT(*) as total
FROM transfers
GROUP BY status;

-- Ver logs de auditoria recentes
SELECT 
  al.action,
  al.entity,
  p.role as user_role,
  al.created_at
FROM audit_logs al
LEFT JOIN profiles p ON al.actor = p.id
ORDER BY al.created_at DESC
LIMIT 20;
```

---

## Método 3: Supabase CLI (Linha de Comando)

Para desenvolvedores que preferem trabalhar no terminal:

### Instalação:

```bash
# Via npm
npm install -g supabase

# Via brew (macOS)
brew install supabase/tap/supabase

# Via scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Configuração:

```bash
# 1. Fazer login
supabase login

# 2. Conectar ao projeto (execute na pasta back)
cd swapone-fintech-back
supabase link --project-ref fopuckodfcsksuzvhgxu

# 3. Ver status
supabase status
```

### Comandos Úteis:

```bash
# Ver estrutura do banco
supabase db dump --data-only

# Baixar schema atual
supabase db pull

# Aplicar migrations locais
supabase db push

# Resetar banco local
supabase db reset

# Criar nova migration
supabase migration new nome_da_migration

# Ver diferenças
supabase db diff
```

---

## Método 4: Via Código (Programaticamente)

Para acessar os dados via JavaScript/TypeScript:

### Setup:

```bash
npm install @supabase/supabase-js
```

### Exemplo de Código:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fopuckodfcsksuzvhgxu.supabase.co'
const supabaseAnonKey = 'YOUR_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const { data: clients, error } = await supabase
  .from('clients')
  .select('*')

console.log(clients)

const { data: accounts, error: accountsError } = await supabase
  .from('accounts')
  .select(`
    *,
    clients (
      name,
      status
    )
  `)
  .eq('currency', 'USD')

console.log(accounts)

const { data: transfers, error: transfersError } = await supabase
  .from('transfers')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)

console.log(transfers)
```

---

## Método 5: Ferramentas de Terceiros

### DBeaver (Gratuito)

1. Baixe: https://dbeaver.io/download/
2. Crie nova conexão PostgreSQL
3. Configure:
   - **Host**: db.fopuckodfcsksuzvhgxu.supabase.co
   - **Port**: 5432
   - **Database**: postgres
   - **User**: postgres
   - **Password**: [sua senha do projeto]

### pgAdmin (Gratuito)

1. Baixe: https://www.pgadmin.org/download/
2. Adicione novo servidor com as mesmas configurações acima

### TablePlus (Pago, mas tem trial)

1. Baixe: https://tableplus.com/
2. Crie nova conexão PostgreSQL
3. Configure com as informações acima

---

## Onde Encontrar as Credenciais

### No Dashboard Supabase:

1. Acesse seu projeto
2. Clique em **Settings** (engrenagem) no menu lateral
3. Clique em **Database**
4. Role até **Connection Info**

Você verá:
- **Host**
- **Database name**
- **Port**
- **User**
- **Password** (clique em "Show" para revelar)

### Connection String:

```
postgresql://postgres:[YOUR-PASSWORD]@db.fopuckodfcsksuzvhgxu.supabase.co:5432/postgres
```

---

## Dicas e Boas Práticas

### Para Visualização Rápida:
- Use o **Dashboard Web** (Método 1) - É o mais rápido e intuitivo

### Para Queries Complexas:
- Use o **SQL Editor** (Método 2) - Salve suas queries favoritas

### Para Desenvolvimento Local:
- Use a **Supabase CLI** (Método 3) - Ideal para migrations e testes

### Para Integração em App:
- Use o **Cliente Supabase** (Método 4) - Com TypeScript para type safety

### Para Análise de Dados:
- Use **DBeaver ou pgAdmin** (Método 5) - Ferramentas profissionais

---

## Estrutura Completa das Tabelas

### clients
```
id          | UUID
name        | TEXT
status      | TEXT (active/inactive)
created_at  | TIMESTAMPTZ
```

### profiles
```
id              | UUID (FK auth.users)
client_id       | UUID (FK clients)
role            | ENUM (admin/ops/client)
twofa_enabled   | BOOLEAN
twofa_secret    | TEXT
created_at      | TIMESTAMPTZ
```

### accounts
```
id              | UUID
client_id       | UUID (FK clients)
currency        | TEXT (USD/EUR/GBP/BRL/USDC/USDT)
balance         | NUMERIC(18,2)
wallet_address  | TEXT
network         | TEXT
created_at      | TIMESTAMPTZ
```

### beneficiaries
```
id                  | UUID
client_id           | UUID (FK clients)
beneficiary_name    | TEXT
type                | TEXT (SEPA/SWIFT/ACH)
iban                | TEXT
swift_bic           | TEXT
routing_number      | TEXT
account_number      | TEXT
bank_name           | TEXT
bank_address        | TEXT
bank_country        | TEXT
intermediary_bank   | TEXT
account_type        | TEXT
additional_data     | JSONB
created_at          | TIMESTAMPTZ
```

### transfers
```
id                | UUID
client_id         | UUID (FK clients)
account_id        | UUID (FK accounts)
beneficiary_id    | UUID (FK beneficiaries)
amount            | NUMERIC(18,2)
currency          | TEXT
support_doc_url   | TEXT
status            | TEXT
created_at        | TIMESTAMPTZ
```

### arbitrage_rates
```
id           | UUID
pair         | TEXT (USD_EUR/USD_GBP/USDC_USD/USDT_USD)
rate         | NUMERIC(18,6)
spread_bps   | INTEGER
updated_by   | UUID (FK profiles)
updated_at   | TIMESTAMPTZ
```

---

## Precisa de Ajuda?

- Documentação Supabase: https://supabase.com/docs
- Discord da Supabase: https://discord.supabase.com
- Stack Overflow: Tag `supabase`

---

**Projeto**: SwapOne Fintech  
**Data**: Outubro 2025  
**Versão**: 1.0


