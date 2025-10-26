require('dotenv').config();

// Script para FORÇAR envio de emails de teste, mesmo sem SMTP configurado

console.log('🚀 Forçando envio de emails de teste...\n');

// Simular envio direto via console
const recipients = ['push@swapone.global', 'vi-abrao@hotmail.com'].join(', ');

console.log('📧 Destinatários:', recipients);
console.log('═══════════════════════════════════════════\n');

// Email 1: Nova Transação
console.log('📊 EMAIL 1: Nova Transação Criada');
console.log(`De: comunicacao@swapone.global`);
console.log(`Para: ${recipients}`);
console.log(`Assunto: [SwapOne] Nova Transação Criada - FX_TRADE`);
console.log('\nDetalhes:\nID: test-123\nValor: 100 USDT → 540 BRL\nStatus: completed\n');
console.log('─────────────────────────────────────────\n');

// Email 2: Novo Beneficiário
console.log('👥 EMAIL 2: Novo Beneficiário Criado');
console.log(`De: comunicacao@swapone.global`);
console.log(`Para: ${recipients}`);
console.log(`Assunto: [SwapOne] Novo Beneficiário Criado - Empresa Teste`);
console.log('\nDetalhes:\nNome: Empresa Teste\nMétodo: SEPA\nStatus: criado\n');
console.log('─────────────────────────────────────────\n');

// Email 3: Novo Cliente
console.log('🏢 EMAIL 3: Novo Cliente Criado');
console.log(`De: comunicacao@swapone.global`);
console.log(`Para: ${recipients}`);
console.log(`Assunto: [SwapOne] Novo Cliente Criado - Cliente Teste`);
console.log('\nDetalhes:\nNome: Cliente Teste\nCNPJ: 12.345.678/0001-90\nStatus: ativo\n');
console.log('─────────────────────────────────────────\n');

// Email 4: Novo Usuário
console.log('👤 EMAIL 4: Novo Usuário Criado');
console.log(`De: comunicacao@swapone.global`);
console.log(`Para: ${recipients}`);
console.log(`Assunto: [SwapOne] Novo Usuário Criado - test@example.com`);
console.log('\nDetalhes:\nNome: Usuário Teste\nEmail: test@example.com\nRole: client\n');
console.log('─────────────────────────────────────────\n');

console.log('✅ Emails de teste gerados!');
console.log('\n💡 NOTA: Para receber emails REAIS, você precisa:');
console.log('   1. Fazer ações reais no sistema (criar/editar/deletar)');
console.log('   2. Configurar credenciais SMTP válidas no .env');
console.log('   3. As notificações são disparadas automaticamente quando você:');
console.log('      - Criar/editar/deletar operações');
console.log('      - Criar/deletar beneficiários');
console.log('      - Criar/editar/deletar clientes');
console.log('      - Criar/editar/deletar usuários');

