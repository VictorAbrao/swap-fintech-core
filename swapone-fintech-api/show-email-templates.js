// Simular envio de emails e mostrar o que será enviado

console.log('📧 Templates de Email que SERÃO ENVIADOS\n');
console.log('═══════════════════════════════════════════\n');

// Destinatários
console.log('📬 DESTINATÁRIOS:');
console.log('   • push@swapone.global');
console.log('   • vi-abrao@hotmail.com\n');

// Template 1: Transação Criada
console.log('═══════════════════════════════════════════');
console.log('📊 EMAIL 1: Nova Transação Criada');
console.log('═══════════════════════════════════════════');
console.log(`
Assunto: [SwapOne] Nova Transação Criada - FX_TRADE

Conteúdo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Nova Transação Criada

Detalhes da Transação:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: abc-123-def-456
Tipo: FX_Trade
Moeda Origem: USDT
Moeda Destino: BRL
Valor Origem: 100 USDT
Valor Destino: 540 BRL
Taxa de Câmbio: 5.40
Markup: 0.5%
Taxa Fixa: 10.00
Status: completed
Data: 26/10/2025 20:02

Usuário Responsável:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: João Silva
Email: joao@example.com
Role: client
Cliente: Empresa ABC Ltda

⚠️ Ação: Nova Transação Criada
⏰ Timestamp: 26/10/2025 20:02:15
`);

console.log('\n═══════════════════════════════════════════');
console.log('👥 EMAIL 2: Novo Beneficiário Criado');
console.log('═══════════════════════════════════════════');
console.log(`
Assunto: [SwapOne] Novo Beneficiário Criado - Empresa Pagadora S.A.

Conteúdo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Novo Beneficiário Criado

Detalhes do Beneficiário:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: xyz-789-abc-123
Nome: Empresa Pagadora S.A.
Método: SEPA
IBAN: DE89 3704 0044 0532 0130 00
Banco: Deutsche Bank
Data: 26/10/2025 20:02

Usuário Responsável:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: Maria Santos
Email: maria@example.com
Role: client

⚠️ Ação: Novo Beneficiário Criado
⏰ Timestamp: 26/10/2025 20:02:15
`);

console.log('\n═══════════════════════════════════════════');
console.log('🏢 EMAIL 3: Novo Cliente Criado');
console.log('═══════════════════════════════════════════');
console.log(`
Assunto: [SwapOne] Novo Cliente Criado - Tech Solutions Ltda

Conteúdo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Novo Cliente Criado

Detalhes do Cliente:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: client-123
Nome: Tech Solutions Ltda
CNPJ: 12.345.678/0001-90
Email: contato@techsolutions.com
Status: Ativo
Data: 26/10/2025 20:02

Administrador Responsável:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: Admin
Email: admin@swapone.global
Role: admin

⚠️ Ação: Novo Cliente Criado
⏰ Timestamp: 26/10/2025 20:02:15
`);

console.log('\n═══════════════════════════════════════════');
console.log('👤 EMAIL 4: Novo Usuário Criado');
console.log('═══════════════════════════════════════════');
console.log(`
Assunto: [SwapOne] Novo Usuário Criado - pedro@example.com

Conteúdo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Novo Usuário Criado

Detalhes do Usuário:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: user-456
Nome: Pedro Oliveira
Email: pedro@example.com
Role: client
2FA: Desativado
Status: Ativo
Data: 26/10/2025 20:02

Cliente Associado:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: Tech Solutions Ltda
ID: client-123
CNPJ: 12.345.678/0001-90

Administrador Responsável:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nome: Admin
Email: admin@swapone.global
Role: admin

⚠️ Ação: Novo Usuário Criado
⏰ Timestamp: 26/10/2025 20:02:15
`);

console.log('\n═══════════════════════════════════════════');
console.log('📋 RESUMO');
console.log('═══════════════════════════════════════════');
console.log(`
✅ Todas as notificações incluem:
   • Dados completos da operação
   • Usuário responsável
   • Timestamp
   • Ação realizada

✅ Destinatários:
   • push@swapone.global
   • vi-abrao@hotmail.com

✅ Operações cobertas:
   • Transações (criar, editar, deletar)
   • Beneficiários (criar, deletar)
   • Clientes (criar, editar, deletar)
   • Usuários (criar, editar, deletar)
`);








