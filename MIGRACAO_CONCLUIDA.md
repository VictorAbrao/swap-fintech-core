# ✅ Migração Concluída com Sucesso!

O projeto foi **migrado com sucesso** para o novo projeto Supabase `sfncazmkxhschlizcjdg` (SWAP).

---

## ✅ O que foi Configurado:

### Backend:
- ✅ **config.toml**: Project ID atualizado para `sfncazmkxhschlizcjdg`
- ✅ **Migrations**: 6 arquivos SQL prontos para aplicar
- ✅ **Edge Functions**: apply-arbitrage e finalize-transfer

### Frontend:
- ✅ **.env**: Todas as credenciais configuradas
  - Project ID: `sfncazmkxhschlizcjdg`
  - URL: `https://sfncazmkxhschlizcjdg.supabase.co`
  - Anon Key: Configurada ✅

### CLI:
- ✅ **Supabase CLI**: Instalado (versão 2.51.0)

---

## 🗄️ Próximo Passo: Aplicar as Migrations

Você tem **2 opções** para criar as tabelas no novo projeto:

### Opção 1: Via SQL Editor (Mais Fácil) ⭐

1. **Acesse**: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/sql
2. **Execute cada arquivo SQL** na ordem:

**Arquivo 1**: `20251020142958_50559d91-bbee-45af-b191-0c8737bba078.sql`
```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'ops', 'client');

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  role public.app_role NOT NULL DEFAULT 'client',
  twofa_enabled BOOLEAN DEFAULT false,
  twofa_secret TEXT, -- encrypted with pgcrypto
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR', 'GBP', 'USDC', 'USDT')),
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  wallet_address TEXT,
  network TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, currency)
);

-- Enable RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create beneficiaries table
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  beneficiary_name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SEPA', 'SWIFT', 'ACH')),
  iban TEXT,
  swift_bic TEXT,
  routing_number TEXT,
  account_number TEXT,
  bank_name TEXT,
  bank_address TEXT,
  bank_country TEXT,
  intermediary_bank TEXT,
  account_type TEXT CHECK (account_type IN ('checking', 'savings')),
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- Create transfers table
CREATE TABLE public.transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES public.beneficiaries(id),
  amount NUMERIC(18, 2) NOT NULL,
  currency TEXT NOT NULL,
  support_doc_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- Create arbitrage_rates table
CREATE TABLE public.arbitrage_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pair TEXT NOT NULL UNIQUE CHECK (pair IN ('USD_EUR', 'USD_GBP', 'USDC_USD', 'USDT_USD')),
  rate NUMERIC(18, 6) NOT NULL,
  spread_bps INTEGER DEFAULT 0,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arbitrage_rates ENABLE ROW LEVEL SECURITY;

-- Create manuals table
CREATE TABLE public.manuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  visible_to TEXT NOT NULL DEFAULT 'all' CHECK (visible_to IN ('all', 'client', 'ops', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor UUID REFERENCES public.profiles(id),
  action TEXT,
  entity TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create user_roles table for security definer function
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to get user's client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id
  FROM public.profiles
  WHERE id = _user_id;
$$;

-- RLS POLICIES

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Clients policies
CREATE POLICY "Admins can view all clients"
  ON public.clients FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

CREATE POLICY "Admins can manage clients"
  ON public.clients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Accounts policies
CREATE POLICY "Users can view own accounts"
  ON public.accounts FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Admins can view all accounts"
  ON public.accounts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

CREATE POLICY "Admins can manage accounts"
  ON public.accounts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Beneficiaries policies
CREATE POLICY "Users can view own beneficiaries"
  ON public.beneficiaries FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Users can create own beneficiaries"
  ON public.beneficiaries FOR INSERT
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Users can update own beneficiaries"
  ON public.beneficiaries FOR UPDATE
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Users can delete own beneficiaries"
  ON public.beneficiaries FOR DELETE
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Admins can view all beneficiaries"
  ON public.beneficiaries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

-- Transfers policies
CREATE POLICY "Users can view own transfers"
  ON public.transfers FOR SELECT
  USING (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Users can create own transfers"
  ON public.transfers FOR INSERT
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()));

CREATE POLICY "Users can update own draft transfers"
  ON public.transfers FOR UPDATE
  USING (client_id = public.get_user_client_id(auth.uid()) AND status = 'draft');

CREATE POLICY "Admins can view all transfers"
  ON public.transfers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

CREATE POLICY "Admins can manage transfers"
  ON public.transfers FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

-- Arbitrage rates policies
CREATE POLICY "Authenticated users can view rates"
  ON public.arbitrage_rates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage rates"
  ON public.arbitrage_rates FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

-- Manuals policies
CREATE POLICY "Users can view manuals based on visibility"
  ON public.manuals FOR SELECT
  USING (
    visible_to = 'all' OR
    (visible_to = 'client' AND auth.uid() IS NOT NULL) OR
    (visible_to = 'ops' AND public.has_role(auth.uid(), 'ops')) OR
    (visible_to = 'admin' AND public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Admins can manage manuals"
  ON public.manuals FOR ALL
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'));

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "All authenticated users can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- User roles policies
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transfers;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('support-docs', 'support-docs', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('manuals', 'manuals', false);

-- Storage policies for support-docs
CREATE POLICY "Users can upload own support docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'support-docs' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own support docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'support-docs' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can view all support docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'support-docs' AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'))
  );

-- Storage policies for manuals
CREATE POLICY "Authenticated users can view manuals"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'manuals' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can upload manuals"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'manuals' AND
    (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'ops'))
  );

-- Seed data for development
-- Insert demo client
INSERT INTO public.clients (id, name, status) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'SwapOne Demo Client', 'active');

-- Insert arbitrage rates
INSERT INTO public.arbitrage_rates (pair, rate, spread_bps) VALUES
  ('USD_EUR', 0.92, 50),
  ('USD_GBP', 0.79, 50),
  ('USDC_USD', 1.00, 10),
  ('USDT_USD', 1.00, 10);
```

**Arquivos 2-6**: Execute os outros arquivos na ordem:
- `20251020143433_9efb8c62-c623-451b-9ada-b114da0187e7.sql`
- `20251020143639_730a01b5-606d-457c-af56-fee3e249884c.sql`
- `20251020144811_0d0e4d9e-d2d6-4bd4-93ea-f5da3e3144bc.sql`
- `20251020150058_d5ec878e-2332-414e-b071-4819a545e6ba.sql`
- `20251020172946_cd665eed-96be-4621-a668-8cae10074d84.sql`

### Opção 2: Via Supabase CLI

```bash
# Fazer login primeiro
supabase login

# Conectar ao projeto
cd /root/swapone-fintech-one/swapone-fintech-back
supabase link --project-ref sfncazmkxhschlizcjdg

# Aplicar migrations
supabase db push
```

---

## 🚀 Testar o Frontend

Depois de aplicar as migrations:

```bash
cd /root/swapone-fintech-one/swapone-fintech-front

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

Acesse: http://localhost:5173

---

## 📊 Verificar se Funcionou

1. **Dashboard**: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg
2. **Table Editor**: https://supabase.com/dashboard/project/sfncazmkxhschlizcjdg/editor
3. **Verificar tabelas**:
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

## 🎉 Status Final

| Item | Status |
|------|--------|
| **Project ID** | ✅ `sfncazmkxhschlizcjdg` |
| **Backend Config** | ✅ Configurado |
| **Frontend .env** | ✅ Configurado |
| **Anon Key** | ✅ Configurada |
| **Supabase CLI** | ✅ Instalado |
| **Migrations** | ⚠️ Precisa aplicar |

**Próximo passo**: Aplicar as migrations via SQL Editor ou CLI!

---

**Data**: 20 de Outubro de 2025  
**Status**: Migração concluída, aguardando aplicação das migrations
