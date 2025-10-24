require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateOperationsHistoryTable() {
  try {
    console.log('🔄 Atualizando tabela operations_history para suportar FX Trade...');
    
    // SQL para atualizar a tabela
    const sql = `
      -- Adicionar colunas para FX Trade
      ALTER TABLE operations_history 
      ADD COLUMN IF NOT EXISTS source_currency VARCHAR(10),
      ADD COLUMN IF NOT EXISTS target_currency VARCHAR(10),
      ADD COLUMN IF NOT EXISTS source_amount DECIMAL(20, 2),
      ADD COLUMN IF NOT EXISTS target_amount DECIMAL(20, 2),
      ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(20, 8),
      ADD COLUMN IF NOT EXISTS base_rate DECIMAL(20, 8),
      ADD COLUMN IF NOT EXISTS final_rate DECIMAL(20, 8),
      ADD COLUMN IF NOT EXISTS spread_percentage DECIMAL(5, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS fee_amount DECIMAL(20, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS side VARCHAR(10) CHECK (side IN ('buy', 'sell')),
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS reference_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS client_id UUID;
    `;
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro ao atualizar tabela:', error);
      return false;
    }
    
    console.log('✅ Tabela operations_history atualizada com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

updateOperationsHistoryTable().then(success => {
  if (success) {
    console.log('🎉 Migração concluída!');
    process.exit(0);
  } else {
    console.log('💥 Falha na migração!');
    process.exit(1);
  }
});
