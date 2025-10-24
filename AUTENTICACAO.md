# 🔐 Sistema de Autenticação - SwapOne Fintech

## Visão Geral

O sistema usa **autenticação JWT** via nossa API Node.js, que por sua vez autentica os usuários no Supabase Auth.

## Fluxo de Autenticação

```
Frontend                  API (Node.js)                Supabase
   |                           |                            |
   |-- POST /auth/login ------>|                            |
   |   (email, password)       |                            |
   |                           |-- signInWithPassword ----->|
   |                           |                            |
   |                           |<----- user data -----------|
   |                           |                            |
   |                           |-- query profiles table --->|
   |                           |<----- profile data --------|
   |                           |                            |
   |                           |-- generate JWT token       |
   |<--- JWT + user data ------|                            |
   |                           |                            |
   |-- Salva token no          |                            |
   |   localStorage            |                            |
   |                           |                            |
   |-- Futuras requisições --> |                            |
   |   Header: Authorization   |                            |
   |   Bearer {JWT}            |                            |
```

## Componentes

### 1. **Frontend (`useAuth.tsx`)**

Gerencia o estado de autenticação no frontend:

- **Estado Local**: Mantém `user`, `session`, e `loading`
- **Persistência**: Usa `localStorage` para salvar o token JWT
- **Verificação**: Ao carregar, verifica se existe token válido via `/api/auth/me`
- **Login**: Chama nossa API e salva o token retornado
- **Logout**: Limpa o token e o estado local

```typescript
interface User {
  id: string;
  email: string;
  role: string;
  client_id: string | null;
  twofa_enabled: boolean;
}

interface Session {
  user: User;
  access_token: string;
}
```

### 2. **API Service (`api.js`)**

Gerencia todas as requisições HTTP:

- **Token Management**: Salva/remove token do localStorage
- **Request Interceptor**: Adiciona automaticamente o header `Authorization: Bearer {token}`
- **Error Handling**: Trata erros de autenticação
- **Endpoints**: 
  - `login()` - Faz login e salva o token
  - `logout()` - Remove o token
  - `getProfile()` - Verifica token e retorna dados do usuário

### 3. **API Backend (`/api/auth`)**

Endpoints de autenticação:

#### `POST /api/auth/login`
```json
Request:
{
  "email": "admin@swapone.com",
  "password": "admin123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@swapone.com",
    "role": "client",
    "client_id": null,
    "twofa_enabled": false
  }
}
```

#### `GET /api/auth/me`
```json
Request Headers:
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@swapone.com",
      "role": "client",
      "client_id": null,
      "twofa_enabled": false
    }
  }
}
```

#### `POST /api/auth/logout`
```json
Request Headers:
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. **Middleware de Autenticação (`auth.js`)**

Protege rotas da API:

```javascript
// Verifica token JWT
const decoded = jwt.verify(token, JWT_SECRET);

// Adiciona dados do usuário à request
req.user = {
  id: decoded.userId,
  email: decoded.email,
  role: decoded.role,
  client_id: decoded.clientId,
  twofa_enabled: decoded.twofa_enabled
};
```

## Usuários de Teste

### Admin
- **Email**: `admin@swapone.com`
- **Senha**: `admin123`
- **Role**: `client`
- **Saldos**: 
  - USD: $100,000
  - EUR: €85,000
  - GBP: £45,000
  - BRL: R$500,000
  - USDC: $25,000
  - USDT: $15,000

### Teste
- **Email**: `teste@swapone.com`
- **Senha**: `123456`
- **Role**: `client`
- **Saldos**: 
  - USD: $25,000
  - EUR: €15,000
  - GBP: £8,000
  - BRL: R$120,000
  - USDC: $5,000
  - USDT: $3,000

## Segurança

### JWT Token
- **Secret**: Definido em `JWT_SECRET` (.env)
- **Expiração**: 24 horas (configurável via `JWT_EXPIRES_IN`)
- **Payload**: Contém apenas dados essenciais (userId, email, role, clientId)

### Headers de Segurança
A API usa Helmet.js com:
- CORS configurado
- Rate limiting (100 requisições/minuto por IP)
- Content Security Policy
- XSS Protection

### Validação
- Todos os endpoints validam presença e formato dos parâmetros
- Senhas são validadas via Supabase Auth (bcrypt)
- Tokens são verificados a cada requisição protegida

## Como Testar

### 1. Via Frontend
```bash
# Acessar
http://72.60.61.249:5001/login

# Fazer login com:
Email: admin@swapone.com
Senha: admin123
```

### 2. Via API (curl)
```bash
# Login
curl -X POST http://72.60.61.249:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@swapone.com","password":"admin123"}'

# Salvar o token da resposta e usar nas próximas requisições
export TOKEN="seu_token_aqui"

# Verificar perfil
curl http://72.60.61.249:5002/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Dashboard
curl http://72.60.61.249:5002/api/dashboard/summary \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Via Swagger
```bash
# Acessar documentação
http://72.60.61.249:5002/api-docs

# 1. Fazer login via /api/auth/login
# 2. Copiar o token retornado
# 3. Clicar no botão "Authorize" (cadeado verde)
# 4. Colar: Bearer {seu_token}
# 5. Testar outros endpoints
```

## Troubleshooting

### "Token inválido"
- Verificar se o token não expirou (24h)
- Verificar se o header está correto: `Authorization: Bearer {token}`
- Fazer login novamente para obter novo token

### "User not found"
- Verificar se o usuário existe no Supabase
- Verificar se o perfil existe na tabela `profiles`

### "CORS error"
- Verificar se o frontend está rodando em `http://72.60.61.249:5001`
- Verificar configuração de CORS na API

### Login não funciona
1. Verificar se a API está rodando: `http://72.60.61.249:5002/health`
2. Verificar credenciais do Supabase no `.env`
3. Verificar logs da API no terminal
4. Verificar console do browser (F12)

## Próximos Passos

- [ ] Implementar refresh token
- [ ] Adicionar 2FA real (não apenas mockado)
- [ ] Implementar recuperação de senha
- [ ] Adicionar rate limiting por usuário
- [ ] Implementar blacklist de tokens
- [ ] Adicionar logs de auditoria de login



