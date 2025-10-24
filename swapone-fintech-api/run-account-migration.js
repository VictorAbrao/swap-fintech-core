const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAndMigrate() {
  try {
    console.log('🔍 Verificando se a coluna account_number existe...');
    
    // Tentar buscar dados para verificar se a coluna existe
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, account_number')
      .limit(3);
    
    if (error) {
      if (error.message.includes('column "account_number" does not exist')) {
        console.log('❌ Coluna account_number não existe. Executando migração...');
        await addAccountNumberColumn();
      } else {
        console.log('❌ Erro ao verificar coluna:', error.message);
        return;
      }
    } else {
      console.log('✅ Coluna account_number existe!');
      console.log('📊 Dados dos clientes:');
      data.forEach(client => {
        console.log(`- ${client.name}: ${client.account_number || 'SEM NÚMERO'}`);
      });
      
      // Verificar se há clientes sem número da conta
      const clientsWithoutNumber = data.filter(client => !client.account_number);
      if (clientsWithoutNumber.length > 0) {
        console.log(`\n🔄 Encontrados ${clientsWithoutNumber.length} clientes sem número da conta. Gerando números...`);
        await generateAccountNumbers();
      } else {
        console.log('✅ Todos os clientes já possuem número da conta!');
      }
    }
  } catch (err) {
    console.log('❌ Erro:', err.message);
  }
}

async function addAccountNumberColumn() {
  try {
    console.log('📝 Adicionando coluna account_number...');
    
    // Usar RPC para executar SQL diretamente
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE clients 
        ADD COLUMN IF NOT EXISTS account_number VARCHAR(5) UNIQUE;
        
        CREATE INDEX IF NOT EXISTS idx_clients_account_number ON clients(account_number);
        
        COMMENT ON COLUMN clients.account_number IS 'Unique 5-digit account number for the client';
      `
    });
    
    if (error) {
      console.log('❌ Erro ao adicionar coluna:', error.message);
    } else {
      console.log('✅ Coluna account_number adicionada com sucesso!');
    }
  } catch (err) {
    console.log('❌ Erro na migração:', err.message);
  }
}

async function generateAccountNumbers() {
  try {
    console.log('🎲 Gerando números de conta para clientes existentes...');
    
    // Buscar todos os clientes sem número da conta
    const { data: clients, error: fetchError } = await supabase
      .from('clients')
      .select('id, name')
      .is('account_number', null);
    
    if (fetchError) {
      console.log('❌ Erro ao buscar clientes:', fetchError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${clients.length} clientes para atualizar`);
    
    // Gerar números únicos para cada cliente
    for (const client of clients) {
      let attempts = 0;
      let accountNumber;
      
      while (attempts < 100) {
        // Gerar número aleatório de 5 dígitos
        accountNumber = Math.floor(Math.random() * 90000) + 10000;
        accountNumber = accountNumber.toString().padStart(5, '0');
        
        // Verificar se o número já existe
        const { data: existing, error: checkError } = await supabase
          .from('clients')
          .select('id')
          .eq('account_number', accountNumber)
          .single();
        
        if (checkError && checkError.code === 'PGRST116') {
          // Número não existe, podemos usar
          break;
        }
        
        attempts++;
      }
      
      if (attempts >= 100) {
        console.log(`❌ Não foi possível gerar número único para ${client.name}`);
        continue;
      }
      
      // Atualizar o cliente com o número da conta
      const { error: updateError } = await supabase
        .from('clients')
        .update({ account_number: accountNumber })
        .eq('id', client.id);
      
      if (updateError) {
        console.log(`❌ Erro ao atualizar ${client.name}:`, updateError.message);
      } else {
        console.log(`✅ ${client.name}: ${accountNumber}`);
      }
    }
    
    console.log('🎉 Geração de números de conta concluída!');
  } catch (err) {
    console.log('❌ Erro na geração:', err.message);
  }
}

checkAndMigrate();
