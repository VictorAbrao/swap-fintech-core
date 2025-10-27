# 📧 Mudanças na Configuração de Emails de Notificação

## Data: 2024

## 🔄 Mudanças Realizadas

### 1. **Removido Hardcode de Emails**
- ❌ **Removido:** `vi-abrao@hotmail.com` hardcoded
- ❌ **Removido:** `push@swapone.global` hardcoded

### 2. **Nova Variável de Ambiente**
- ✅ **Adicionado:** `NOTIFICATION_EMAILS` no `.env`
- ✅ Suporte para múltiplos emails (separados por vírgula)
- ✅ Fallback para `push@swapcambio.com` se não configurado

### 3. **Alterações nos Domínios**
- ✅ **Mudado:** `push@swapone.global` → `push@swapcambio.com`

## 📋 Arquivos Modificados

### 1. `swapone-fintech-api/src/services/emailService.js`
- Adicionado método `getNotificationEmails()` para ler emails do `.env`
- Removido hardcode de emails em 4 funções:
  - `sendTransactionNotification()`
  - `sendClientNotification()`
  - `sendUserNotification()`
  - `sendBeneficiaryNotification()`

### 2. `swapone-fintech-api/RESUMO_EMAILS.md`
- Atualizada documentação sobre configuração de emails
- Removidas referências a emails hardcoded

### 3. `swapone-fintech-api/setup-email.md`
- Adicionadas instruções sobre `NOTIFICATION_EMAILS`
- Exemplos de configuração

### 4. `.cursorrules`
- Atualizada configuração de emails
- Documentado suporte para múltiplos emails via `NOTIFICATION_EMAILS`

## 🔧 Como Configurar

### Opção 1: Configurar no `.env`
```bash
# Adicione ao arquivo .env
NOTIFICATION_EMAILS=push@swapcambio.com,vi-abrao@hotmail.com,outro@email.com
```

### Opção 2: Usar Padrão
Se não configurar, os emails serão enviados para: `push@swapcambio.com`

## ✅ Benefícios
- ✅ Configuração flexível via variável de ambiente
- ✅ Suporte para múltiplos destinatários
- ✅ Sem hardcode de emails
- ✅ Fácil adicionar/remover emails

## 🧪 Como Testar
1. Configure `NOTIFICATION_EMAILS` no `.env`
2. Crie um cliente/usuário/operação
3. Verifique os logs: `tail -f swapone-fintech-api/server.log | grep "📧"`

## 📝 Exemplo de Uso

### Configuração Mínima (.env)
```bash
NOTIFICATION_EMAILS=push@swapcambio.com
```

### Configuração com Múltiplos Emails (.env)
```bash
NOTIFICATION_EMAILS=push@swapcambio.com,admin@example.com,vi-abrao@hotmail.com
```

## 🚨 Importante
- Os emails são separados por vírgula
- Espaços extras são removidos automaticamente
- Emails vazios são ignorados
- Se `NOTIFICATION_EMAILS` não estiver configurado, o padrão é `push@swapcambio.com`

