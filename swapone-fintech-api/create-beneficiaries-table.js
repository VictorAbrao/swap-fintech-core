require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAndCreateBeneficiariesTable() {
  try {
    console.log('🔍 Verificando se a tabela beneficiaries existe...');
    
    // Tentar fazer uma consulta simples para ver se a tabela existe
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Tabela não existe
        console.log('❌ Tabela beneficiaries não existe. Criando...');
        await createBeneficiariesTable();
      } else {
        console.error('❌ Erro ao verificar tabela:', error);
      }
    } else {
      console.log('✅ Tabela beneficiaries já existe!');
      console.log('📊 Registros encontrados:', data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function createBeneficiariesTable() {
  try {
    console.log('🏗️ Criando tabela beneficiaries...');
    
    // SQL para criar a tabela
    const createTableSQL = `
      CREATE TABLE beneficiaries (
        -- Identificação
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL,
        
        -- Informações do beneficiário
        beneficiary_name VARCHAR(255) NOT NULL,
        
        -- Método de transferência
        transfer_method VARCHAR(20) NOT NULL, -- 'SEPA', 'SWIFT', 'ACH'
        
        -- DADOS PARA SEPA
        beneficiary_iban VARCHAR(50), -- IBAN para SEPA
        beneficiary_bic VARCHAR(50), -- BIC/SWIFT para SEPA (opcional)
        
        -- DADOS PARA SWIFT
        beneficiary_swift_bic VARCHAR(50), -- SWIFT/BIC Code
        beneficiary_account_number VARCHAR(100), -- Account Number
        beneficiary_bank_name VARCHAR(255), -- Bank Name
        beneficiary_bank_address TEXT, -- Bank Address
        intermediary_bank_swift VARCHAR(50), -- Intermediary Bank SWIFT (opcional)
        
        -- DADOS PARA ACH
        beneficiary_routing_number VARCHAR(20), -- Routing Number (9 digits)
        beneficiary_account_number_ach VARCHAR(100), -- Account Number
        beneficiary_account_type VARCHAR(50), -- 'Checking', 'Savings', etc
        
        -- Metadados
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Foreign Key
        CONSTRAINT fk_beneficiary_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('❌ Erro ao criar tabela:', createError);
      return;
    }
    
    console.log('✅ Tabela beneficiaries criada com sucesso!');
    
    // Criar índices
    console.log('📊 Criando índices...');
    const indexSQL = `
      CREATE INDEX idx_beneficiaries_client_id ON beneficiaries(client_id);
      CREATE INDEX idx_beneficiaries_transfer_method ON beneficiaries(transfer_method);
      CREATE INDEX idx_beneficiaries_name ON beneficiaries(beneficiary_name);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (indexError) {
      console.log('⚠️ Aviso: Erro ao criar índices (pode ser normal):', indexError.message);
    } else {
      console.log('✅ Índices criados com sucesso!');
    }
    
    // Inserir dados de exemplo
    console.log('📝 Inserindo beneficiários de exemplo...');
    await insertSampleBeneficiaries();
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  }
}

async function insertSampleBeneficiaries() {
  try {
    const sampleData = [
      {
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        beneficiary_name: 'Supplier GmbH',
        transfer_method: 'SEPA',
        beneficiary_iban: 'DE89 3704 0044 0532 0130 00',
        beneficiary_bic: 'COBADEFFXXX'
      },
      {
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        beneficiary_name: 'Partner Inc',
        transfer_method: 'SWIFT',
        beneficiary_swift_bic: 'CHASUS33XXX',
        beneficiary_account_number: '1234567890',
        beneficiary_bank_name: 'Chase Bank',
        beneficiary_bank_address: '123 Wall Street, New York, NY, USA'
      },
      {
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        beneficiary_name: 'Vendor Co',
        transfer_method: 'ACH',
        beneficiary_routing_number: '021000021',
        beneficiary_account_number_ach: '9876543210',
        beneficiary_account_type: 'Checking'
      }
    ];
    
    const { data, error } = await supabase
      .from('beneficiaries')
      .insert(sampleData)
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir dados de exemplo:', error);
    } else {
      console.log('✅ Beneficiários de exemplo inseridos:', data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error);
  }
}

// Executar
checkAndCreateBeneficiariesTable();


const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkAndCreateBeneficiariesTable() {
  try {
    console.log('🔍 Verificando se a tabela beneficiaries existe...');
    
    // Tentar fazer uma consulta simples para ver se a tabela existe
    const { data, error } = await supabase
      .from('beneficiaries')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Tabela não existe
        console.log('❌ Tabela beneficiaries não existe. Criando...');
        await createBeneficiariesTable();
      } else {
        console.error('❌ Erro ao verificar tabela:', error);
      }
    } else {
      console.log('✅ Tabela beneficiaries já existe!');
      console.log('📊 Registros encontrados:', data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function createBeneficiariesTable() {
  try {
    console.log('🏗️ Criando tabela beneficiaries...');
    
    // SQL para criar a tabela
    const createTableSQL = `
      CREATE TABLE beneficiaries (
        -- Identificação
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL,
        
        -- Informações do beneficiário
        beneficiary_name VARCHAR(255) NOT NULL,
        
        -- Método de transferência
        transfer_method VARCHAR(20) NOT NULL, -- 'SEPA', 'SWIFT', 'ACH'
        
        -- DADOS PARA SEPA
        beneficiary_iban VARCHAR(50), -- IBAN para SEPA
        beneficiary_bic VARCHAR(50), -- BIC/SWIFT para SEPA (opcional)
        
        -- DADOS PARA SWIFT
        beneficiary_swift_bic VARCHAR(50), -- SWIFT/BIC Code
        beneficiary_account_number VARCHAR(100), -- Account Number
        beneficiary_bank_name VARCHAR(255), -- Bank Name
        beneficiary_bank_address TEXT, -- Bank Address
        intermediary_bank_swift VARCHAR(50), -- Intermediary Bank SWIFT (opcional)
        
        -- DADOS PARA ACH
        beneficiary_routing_number VARCHAR(20), -- Routing Number (9 digits)
        beneficiary_account_number_ach VARCHAR(100), -- Account Number
        beneficiary_account_type VARCHAR(50), -- 'Checking', 'Savings', etc
        
        -- Metadados
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Foreign Key
        CONSTRAINT fk_beneficiary_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      );
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (createError) {
      console.error('❌ Erro ao criar tabela:', createError);
      return;
    }
    
    console.log('✅ Tabela beneficiaries criada com sucesso!');
    
    // Criar índices
    console.log('📊 Criando índices...');
    const indexSQL = `
      CREATE INDEX idx_beneficiaries_client_id ON beneficiaries(client_id);
      CREATE INDEX idx_beneficiaries_transfer_method ON beneficiaries(transfer_method);
      CREATE INDEX idx_beneficiaries_name ON beneficiaries(beneficiary_name);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    
    if (indexError) {
      console.log('⚠️ Aviso: Erro ao criar índices (pode ser normal):', indexError.message);
    } else {
      console.log('✅ Índices criados com sucesso!');
    }
    
    // Inserir dados de exemplo
    console.log('📝 Inserindo beneficiários de exemplo...');
    await insertSampleBeneficiaries();
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  }
}

async function insertSampleBeneficiaries() {
  try {
    const sampleData = [
      {
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        beneficiary_name: 'Supplier GmbH',
        transfer_method: 'SEPA',
        beneficiary_iban: 'DE89 3704 0044 0532 0130 00',
        beneficiary_bic: 'COBADEFFXXX'
      },
      {
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        beneficiary_name: 'Partner Inc',
        transfer_method: 'SWIFT',
        beneficiary_swift_bic: 'CHASUS33XXX',
        beneficiary_account_number: '1234567890',
        beneficiary_bank_name: 'Chase Bank',
        beneficiary_bank_address: '123 Wall Street, New York, NY, USA'
      },
      {
        client_id: '3540fd26-9b18-4a88-b589-5cbac8378aa9',
        beneficiary_name: 'Vendor Co',
        transfer_method: 'ACH',
        beneficiary_routing_number: '021000021',
        beneficiary_account_number_ach: '9876543210',
        beneficiary_account_type: 'Checking'
      }
    ];
    
    const { data, error } = await supabase
      .from('beneficiaries')
      .insert(sampleData)
      .select();
    
    if (error) {
      console.error('❌ Erro ao inserir dados de exemplo:', error);
    } else {
      console.log('✅ Beneficiários de exemplo inseridos:', data?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Erro ao inserir dados de exemplo:', error);
  }
}

// Executar
checkAndCreateBeneficiariesTable();
