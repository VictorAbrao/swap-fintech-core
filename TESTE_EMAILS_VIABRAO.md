# 📧 Como Testar os Emails para vi-abrao@hotmail.com

## ✅ Status Atual

- ✅ Emails configurados para enviar para **vi-abrao@hotmail.com**
- ✅ Todas as operações implementadas
- ✅ Templates criados

## 🚀 Como Testar (MANUALMENTE)

### Opção 1: Via Interface Web (MAIS FÁCIL)

1. Acesse: https://app.swapone.global/admin-panel
2. Faça login como admin
3. Execute as ações abaixo:

#### Teste 1: Criar Cliente
1. Vá em "Clientes" → "Adicionar Cliente"
2. Preencha:
   - Nome: `Cliente Teste Email`
   - CNPJ: `99.888.777/0001-66`
   - Limite anual: `50000`
3. Clique em "Salvar"
4. ✅ **Email será enviado para vi-abrao@hotmail.com**

#### Teste 2: Editar o Cliente Criado
1. Vá na lista de clientes
2. Clique no cliente que você criou
3. Clique em "Editar"
4. Altere o nome para `Cliente Teste Email - EDITADO`
5. Clique em "Salvar"
6. ✅ **Email será enviado para vi-abrao@hotmail.com**

#### Teste 3: Criar Usuário
1. Vá em "Clientes" → Selecione o cliente criado
2. Vá na aba "Usuários"
3. Clique em "Adicionar Usuário"
4. Preencha:
   - Email: `teste-user-${Date.now()}@example.com`
   - Senha: `teste123`
   - Nome: `Usuário Teste`
   - Role: `client`
5. Clique em "Salvar"
6. ✅ **Email será enviado para vi-abrao@hotmail.com**

#### Teste 4: Criar Operação FX Trade
1. Vá em "Operações" → "Adicionar Operação"
2. Selecione o cliente criado
3. Preencha:
   - Tipo: `FX Trade`
   - Origem: `USDT`
   - Destino: `BRL`
   - Quantidade: `50` (valor baixo para teste)
4. Clique em "Salvar"
5. ✅ **Email será enviado para vi-abrao@hotmail.com**

#### Teste 5: Deletar Usuário
1. Vá em "Clientes" → Selecione o cliente
2. Vá na aba "Usuários"
3. Clique em "Deletar" no usuário que você criou
4. Confirme a exclusão
5. ✅ **Email será enviado para vi-abrao@hotmail.com**

#### Teste 6: Deletar Cliente
1. Vá em "Clientes"
2. Clique em "Deletar" no cliente que você criou
3. Confirme a exclusão
4. ✅ **Email será enviado para vi-abrao@hotmail.com**

---

## 📧 Verificar Emails Recebidos

Após cada ação, verifique sua caixa de entrada **vi-abrao@hotmail.com**

Você receberá emails com:
- Assunto: `[SwapOne] ...`
- De: `comunicacao@swapone.global`
- Para: `push@swapone.global, vi-abrao@hotmail.com`

---

## 📝 Template dos Emails

Ver preview completo em:
- `swapone-fintech-api/email-templates-preview.html`
- Ou execute: `node swapone-fintech-api/show-email-templates.js`

---

## ⚠️ Importante

Os emails SÓ são enviados quando você faz ações REAIS no sistema.
Não há como simular/env_fiar emails sem SMTP configurado.

Para configurar SMTP real, edite `.env`:
```bash
EMAIL_USER=comunicacao@swapone.global
EMAIL_PASS=sua_senha
```

