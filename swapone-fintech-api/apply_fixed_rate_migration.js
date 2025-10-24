require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyFixedRateMigration() {
  try {
    console.log('🔄 Aplicando migração para adicionar campo fixed_rate_amount...');
    
    // SQL para adicionar o campo fixed_rate_amount
    const sql = `
      -- Add fixed_rate_amount column to operations_history table  
      ALTER TABLE operations_history 
      ADD COLUMN IF NOT EXISTS fixed_rate_amount DECIMAL(10,2) DEFAULT 0.00;

      -- Add comment to explain the field
      COMMENT ON COLUMN operations_history.fixed_rate_amount IS 'Fixed rate amount in target currency applied to this operation (additional to percentage markup)';

      -- Update existing records to have 0.00 as default
      UPDATE operations_history SET fixed_rate_amount = 0.00 WHERE fixed_rate_amount IS NULL;

      -- Make the column NOT NULL after setting defaults
      ALTER TABLE operations_history ALTER COLUMN fixed_rate_amount SET NOT NULL;
    `;
    
    // Executar a migração usando uma consulta direta
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro ao aplicar migração:', error);
      return false;
    }
    
    console.log('✅ Campo fixed_rate_amount adicionado com sucesso à tabela operations_history!');
    
    // Verificar se o campo foi criado
    const { data, error: checkError } = await supabase
      .from('operations_history')
      .select('fixed_rate_amount')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Erro ao verificar campo:', checkError);
      return false;
    }
    
    console.log('✅ Campo fixed_rate_amount verificado com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

applyFixedRateMigration().then(success => {
  if (success) {
    console.log('🎉 Migração fixed_rate_amount concluída!');
    process.exit(0);
  } else {
    console.log('💥 Falha na migração fixed_rate_amount!');
    process.exit(1);
  }
});
