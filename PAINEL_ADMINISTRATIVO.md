# 🛡️ Painel Administrativo - SwapOne Fintech

## 📋 Visão Geral

O Painel Administrativo é uma área exclusiva com funcionalidades específicas para gestão e operações administrativas.

## ✨ Funcionalidades

### 1. 📊 Listagem de Clientes

Visualização de todos os clientes cadastrados na plataforma.

**Informações Exibidas:**
- **#** - Número sequencial
- **Nome** - Nome completo do cliente
- **Email** - Email de cadastro
- **Data de Cadastro** - Data de registro na plataforma

**Recursos:**
- Lista em formato de tabela responsiva
- Dados atualizados em tempo real
- Interface limpa e organizada

### 2. 🧮 Cálculo de Cotação

Calculadora de câmbio entre diferentes moedas.

**Moedas Suportadas:**
- 💵 USD - US Dollar
- 💶 EUR - Euro
- 💷 GBP - British Pound
- 💰 BRL - Brazilian Real
- 🪙 USDC - USD Coin
- 🪙 USDT - Tether

**Funcionalidades:**
- Seleção de moeda de origem e destino
- Campo para inserir valor
- Cálculo automático da conversão
- Exibição de taxa de câmbio
- Horário da cotação
- Resumo detalhado da operação

**Resultado Exibido:**
- Valor original na moeda de origem
- Valor convertido na moeda de destino
- Taxa de câmbio aplicada
- Timestamp da cotação
- Resumo textual da operação

## 🚀 Como Acessar

### Via Dashboard

1. Fazer login: http://72.60.61.249:5001/login
2. No Dashboard, clicar no botão **"Admin Panel"** (🛡️) no header
3. Será redirecionado para: http://72.60.61.249:5001/admin-panel

### Via URL Direta

```
http://72.60.61.249:5001/admin-panel
```

**Nota**: Requer autenticação (login prévio)

## 🎨 Interface

### Layout Principal

```
┌─────────────────────────────────────────────────┐
│  Header: Logo + Voltar ao Dashboard            │
├─────────────────────────────────────────────────┤
│  Título: Painel Administrativo                  │
│  Subtítulo: Gerencie clientes e calcule...     │
├──────────────────┬──────────────────────────────┤
│  📊 Listagem de  │  🧮 Cálculo de              │
│     Clientes     │     Cotação                  │
│  (Card clicável) │  (Card clicável)             │
├──────────────────┴──────────────────────────────┤
│  Conteúdo do Menu Selecionado                  │
│  (Tabela de clientes OU Calculadora)           │
└─────────────────────────────────────────────────┘
```

### Menu de Clientes

Quando selecionado, exibe:

```
┌─────────────────────────────────────────────────┐
│  📊 Clientes Cadastrados                        │
├──────────────────────────────────────────────────┤
│  #  │  Nome        │  Email               │ Data│
├──────────────────────────────────────────────────┤
│  1  │  Admin User  │  📧 admin@...        │ ... │
│  2  │  Test User   │  📧 teste@...        │ ... │
│  3  │  John Doe    │  📧 client1@...      │ ... │
│  4  │  Jane Smith  │  📧 client2@...      │ ... │
└─────────────────────────────────────────────────┘
```

### Menu de Cotação

Quando selecionado, exibe:

```
┌─────────────────────────────────────────────────┐
│  🧮 Calculadora de Cotação                      │
├─────────────────────────────────────────────────┤
│  De (Origem)     Para (Destino)     Valor      │
│  ┌───────────┐   ┌───────────┐   ┌─────────┐  │
│  │    USD    ▼│   │    EUR    ▼│   │ 1000   │  │
│  └───────────┘   └───────────┘   └─────────┘  │
│                                                 │
│  [🧮 Calcular Cotação]                         │
├─────────────────────────────────────────────────┤
│  📊 Resultado da Cotação                        │
│  Valor Original: 1,000.00 USD                   │
│  Valor Convertido: 920.00 EUR                   │
│  Taxa: 1 USD = 0.92 EUR                         │
│  Horário: 20/10/2025 20:30                      │
└─────────────────────────────────────────────────┘
```

## 🔐 Segurança

- **Rota Protegida**: Requer autenticação via JWT
- **ProtectedRoute**: Implementado no App.tsx
- **Redirecionamento**: Sem login → /login
- **Futura**: Adicionar verificação de role (apenas admin)

## 📁 Arquivos Criados

### Frontend

1. **`src/pages/AdminPanel.tsx`**
   - Componente principal do painel
   - Gestão de estado local
   - Integração com API

2. **`src/App.tsx`** (modificado)
   - Nova rota: `/admin-panel`
   - Protegida com ProtectedRoute

3. **`src/pages/Dashboard.tsx`** (modificado)
   - Botão "Admin Panel" no header
   - Ícone Shield para identificação

## 🔄 Fluxo de Uso

### Listar Clientes

```
1. Acessar /admin-panel
2. Menu "Listagem de Clientes" selecionado por padrão
3. Ver tabela com todos os clientes
4. Informações carregadas via API (mock por enquanto)
```

### Calcular Cotação

```
1. Acessar /admin-panel
2. Clicar em "Cálculo de Cotação"
3. Selecionar moeda de origem (ex: USD)
4. Selecionar moeda de destino (ex: EUR)
5. Inserir valor (ex: 1000)
6. Clicar em "Calcular Cotação"
7. Ver resultado com:
   - Valor convertido
   - Taxa de câmbio
   - Horário da cotação
   - Resumo da operação
```

## 🎯 Dados Mockados

### Clientes (Temporário)

```javascript
[
  {
    id: 1,
    email: "admin@swapone.com",
    name: "Admin User",
    registeredAt: "2025-10-15"
  },
  {
    id: 2,
    email: "teste@swapone.com",
    name: "Test User",
    registeredAt: "2025-10-18"
  },
  {
    id: 3,
    email: "client1@example.com",
    name: "John Doe",
    registeredAt: "2025-10-19"
  },
  {
    id: 4,
    email: "client2@example.com",
    name: "Jane Smith",
    registeredAt: "2025-10-20"
  }
]
```

### Taxas de Câmbio (Da API)

Usa `apiService.getExchangeRates()` que retorna taxas atualizadas por hora.

## 🔗 Integração com API

### Endpoints Usados

1. **`GET /api/dashboard/exchange-rates`**
   - Usado para cálculo de cotação
   - Retorna taxas atualizadas

2. **`GET /api/auth/me`** (futuro)
   - Verificar role do usuário
   - Permitir acesso apenas admin

## 📊 Diferenças do Admin Antigo

| Recurso | Admin Antigo | Admin Panel Novo |
|---------|--------------|------------------|
| Layout | 5 tabs (Clients, Balances, etc.) | 2 menus simples |
| Foco | Gestão completa | Listagem + Cotação |
| Menu | TabsList com 5 opções | 2 cards clicáveis |
| Integração Supabase | Direto | Via API REST |
| Complexidade | Alto | Baixo (focado) |

## 🚀 Próximos Passos

### 1. Integração Real com API

```typescript
// Criar endpoint na API
GET /api/admin/clients
Response: [
  {
    id: string,
    email: string,
    name: string,
    registeredAt: string
  }
]
```

### 2. Proteção por Role

```typescript
// Middleware na API
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};

// Frontend
const { user } = useAuth();
if (user.role !== 'admin') {
  return <Navigate to="/dashboard" />;
}
```

### 3. Exportação de Dados

- Botão para exportar lista de clientes (CSV/Excel)
- Histórico de cotações realizadas
- Relatórios gerenciais

### 4. Filtros e Busca

- Buscar clientes por email/nome
- Filtrar por data de cadastro
- Ordenação customizada

## 🧪 Como Testar

### Teste Completo

```bash
# 1. Fazer login
URL: http://72.60.61.249:5001/login
Email: admin@swapone.com
Senha: admin123

# 2. Acessar Dashboard
✅ Ver botão "Admin Panel" no header

# 3. Clicar em "Admin Panel"
✅ Redireciona para /admin-panel

# 4. Ver Listagem de Clientes
✅ Ver 4 clientes mockados
✅ Colunas: #, Nome, Email, Data

# 5. Clicar em "Cálculo de Cotação"
✅ Ver formulário de cotação

# 6. Calcular Cotação
De: USD
Para: EUR  
Valor: 1000
✅ Ver resultado: ~920 EUR
✅ Ver taxa: 1 USD = 0.92 EUR
✅ Ver resumo da operação

# 7. Voltar ao Dashboard
✅ Clicar em "Voltar ao Dashboard"
```

## 📝 Notas Técnicas

### State Management

```typescript
const [activeMenu, setActiveMenu] = useState<"clients" | "quotation">("clients");
const [clients, setClients] = useState<any[]>([]);
const [quotationResult, setQuotationResult] = useState<any>(null);
```

### Cálculo de Cotação

```typescript
// 1. Buscar taxas da API
const rates = await apiService.getExchangeRates();

// 2. Converter para USD (se necessário)
let result = amount;
if (from !== "USD") {
  result = result * rates[from];
}

// 3. Converter de USD para moeda destino
if (to !== "USD") {
  result = result / rates[to];
}

// 4. Calcular taxa de câmbio
const exchangeRate = rates[to] / rates[from];
```

### Responsividade

- Mobile: Cards empilhados verticalmente
- Desktop: Cards lado a lado
- Tabela: Scroll horizontal em mobile

---

**Criado**: 20/10/2025 20:25
**Rota**: `/admin-panel`
**Status**: ✅ Funcional
**Integração API**: 🔄 Parcial (taxas OK, clientes mockados)



