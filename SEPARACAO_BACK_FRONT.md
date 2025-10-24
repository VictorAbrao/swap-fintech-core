# Separação do Projeto em Backend e Frontend

Este documento explica como o projeto foi separado da estrutura monorepo original para duas pastas distintas.

## ❓ Por que Separar?

A separação de backend e frontend traz vários benefícios:

1. **Organização**: Código mais limpo e organizado
2. **Deploy Independente**: Backend e frontend podem ser deployados separadamente
3. **Escalabilidade**: Mais fácil escalar cada parte independentemente
4. **Colaboração**: Times diferentes podem trabalhar em cada parte
5. **Clareza**: Fica claro o que é backend e o que é frontend

## 📁 Estrutura Antes (Monorepo)

```
swapone-fintech-core-16012/
├── supabase/              # Backend
│   ├── config.toml
│   ├── migrations/
│   └── functions/
├── src/                   # Frontend
│   ├── components/
│   ├── pages/
│   └── ...
├── public/
├── package.json
└── vite.config.ts
```

## 📁 Estrutura Depois (Separado)

```
swapone-fintech-one/
├── swapone-fintech-back/         # BACKEND ✅
│   ├── config.toml
│   ├── migrations/
│   ├── functions/
│   ├── package.json
│   └── README.md
│
├── swapone-fintech-front/        # FRONTEND ✅
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── swapone-fintech-core-16012/   # Original (backup)
└── README.md                      # Documentação principal
```

## 🔧 Backend (swapone-fintech-back)

### O que foi movido:
- Pasta `supabase/` completa
  - `config.toml` - Configuração do projeto
  - `migrations/` - Todas as migrações SQL
  - `functions/` - Edge Functions (apply-arbitrage, finalize-transfer)

### O que foi adicionado:
- `package.json` - Scripts para gerenciar Supabase CLI
- `README.md` - Documentação completa do backend

### Scripts disponíveis:
```bash
npm run supabase:login        # Login no Supabase
npm run supabase:link         # Conectar ao projeto
npm run supabase:status       # Ver status
npm run db:push               # Aplicar migrations
npm run db:pull               # Baixar schema
npm run migration:new         # Criar nova migration
npm run functions:deploy      # Deploy das Edge Functions
```

## 🎨 Frontend (swapone-fintech-front)

### O que foi movido:
- Toda a estrutura do React/Vite
  - `src/` - Código fonte completo
  - `public/` - Assets estáticos
  - `package.json` - Dependências originais
  - `vite.config.ts` - Configuração do Vite
  - `tailwind.config.ts` - Configuração do Tailwind
  - `tsconfig.json` - Configuração do TypeScript
  - Todos os arquivos de configuração

### O que NÃO foi movido:
- Pasta `supabase/` (foi para o backend)
- `node_modules/` (deve ser reinstalado)
- `dist/` (gerado pelo build)

### O que foi adicionado:
- `README.md` - Documentação completa do frontend

## 🚀 Como Trabalhar com a Nova Estrutura

### Desenvolvimento do Backend:

```bash
cd swapone-fintech-back

# Primeira vez
npm run supabase:login
npm run supabase:link

# Criar nova migration
npm run migration:new nome_da_migration

# Aplicar migrations
npm run db:push

# Deploy das functions
npm run functions:deploy
```

### Desenvolvimento do Frontend:

```bash
cd swapone-fintech-front

# Primeira vez
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Preview do build
npm run preview
```

## 🔗 Como Backend e Frontend se Comunicam

O frontend se comunica com o backend via **Supabase Client**:

```typescript
import { supabase } from '@/integrations/supabase/client'

const { data, error } = await supabase
  .from('accounts')
  .select('*')
```

A conexão é feita através das configurações em:
- `src/integrations/supabase/`

Usando as credenciais:
- **URL**: `https://fopuckodfcsksuzvhgxu.supabase.co`
- **Anon Key**: (configurado no projeto)

## 📦 Deploy Separado

### Backend (Supabase):
O backend já está hospedado no Supabase Cloud. Para fazer mudanças:

```bash
cd swapone-fintech-back

# Aplicar migrations
npm run db:push

# Deploy das functions
npm run functions:deploy
```

### Frontend:
Pode ser deployado em qualquer plataforma:

**Vercel:**
```bash
cd swapone-fintech-front
npm run build
vercel deploy
```

**Netlify:**
```bash
cd swapone-fintech-front
npm run build
netlify deploy --prod
```

**Hosting próprio:**
```bash
cd swapone-fintech-front
npm run build
# Copie a pasta dist/ para seu servidor
```

## ✅ Vantagens da Separação

### Para o Backend:
- Migrations versionadas e organizadas
- Edge Functions isoladas
- Fácil de fazer backup do schema
- Scripts dedicados para operações do Supabase

### Para o Frontend:
- Build mais rápido (não processa arquivos do backend)
- Dependências isoladas
- Fácil de versionar
- Deploy independente

### Para o Projeto:
- Repositórios Git separados (se necessário)
- Times podem trabalhar independentemente
- CI/CD separado para cada parte
- Melhor organização de permissões

## 🔄 Sincronização

### Backend para Frontend:
Quando o backend muda, o frontend precisa saber:

1. **Novas tabelas**: Atualizar queries no frontend
2. **Novas functions**: Atualizar chamadas no frontend
3. **Mudanças de schema**: Atualizar tipos TypeScript

### Frontend para Backend:
Quando o frontend precisa de novos recursos:

1. **Novas queries**: Verificar políticas RLS
2. **Novos dados**: Criar migrations
3. **Nova lógica**: Criar Edge Functions

## 📚 Documentação Criada

1. **README.md** (raiz) - Visão geral do projeto
2. **swapone-fintech-back/README.md** - Documentação do backend
3. **swapone-fintech-front/README.md** - Documentação do frontend
4. **GUIA_VISUALIZAR_TABELAS_SUPABASE.md** - Como visualizar as tabelas
5. **SEPARACAO_BACK_FRONT.md** (este arquivo) - Explicação da separação

## 🛠️ Manutenção

### Backup Original:
A pasta `swapone-fintech-core-16012/` foi mantida como backup. Você pode:
- Mantê-la para referência
- Deletá-la se tiver certeza que a separação funcionou
- Usá-la para comparar em caso de dúvidas

### Recomendação:
```bash
# Após confirmar que tudo está funcionando, você pode remover:
# rm -rf swapone-fintech-core-16012/
```

## 💡 Dicas

1. **Sempre trabalhe nas pastas separadas** (back e front)
2. **Não modifique o original** (core-16012) - é seu backup
3. **Use Git separadamente** para cada pasta (se necessário)
4. **Mantenha a documentação atualizada**
5. **Teste localmente antes de fazer deploy**

## 📞 Suporte

Se tiver dúvidas:
- Backend: Consulte `swapone-fintech-back/README.md`
- Frontend: Consulte `swapone-fintech-front/README.md`
- Tabelas: Consulte `GUIA_VISUALIZAR_TABELAS_SUPABASE.md`

---

**Data da Separação**: Outubro 2025  
**Versão**: 1.0


