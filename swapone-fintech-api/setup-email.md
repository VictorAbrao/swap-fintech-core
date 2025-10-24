# 📧 Configuração de Email - SwapOne Fintech

## 🚨 Problema Atual
O sistema está funcionando em **modo de simulação** porque as credenciais do Gmail não estão configuradas corretamente.

## ✅ Solução: Configurar Gmail App Password

### 1. **Ativar Autenticação de 2 Fatores**
1. Acesse: https://myaccount.google.com/security
2. Vá em "Verificação em duas etapas"
3. Ative a verificação em duas etapas

### 2. **Gerar App Password**
1. Acesse: https://myaccount.google.com/apppasswords
2. Selecione "Mail" e "Outro (nome personalizado)"
3. Digite: "SwapOne Fintech"
4. Clique em "Gerar"
5. **COPIE A SENHA GERADA** (16 caracteres)

### 3. **Configurar no .env**
```bash
# Editar arquivo .env
nano .env

# Substituir a linha:
EMAIL_PASS=your-app-password-here

# Por:
EMAIL_PASS=sua-senha-de-16-caracteres-aqui
```

### 4. **Reiniciar Servidor**
```bash
# Parar servidor atual
pkill -f "node src/server.js"

# Iniciar novamente
cd /root/swapone-fintech-one/swapone-fintech-api
node src/server.js
```

## 🧪 Teste
Após configurar, teste criando um usuário:
```bash
# O email será enviado automaticamente para o usuário criado
```

## 📊 Status Atual
- ✅ Sistema funcionando em modo simulação
- ✅ Usuários sendo criados com sucesso
- ✅ Logs detalhados no console
- ⚠️ Emails não sendo enviados (credenciais não configuradas)

## 🔧 Alternativas
Se não conseguir configurar Gmail, podemos usar:
- SendGrid
- Mailgun
- Amazon SES
- SMTP personalizado
