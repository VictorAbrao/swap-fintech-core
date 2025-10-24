require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndAddFixedRateField() {
  try {
    console.log('🔍 Verificando se o campo fixed_rate_amount existe...');
    
    // Tentar fazer uma consulta simples para ver se o campo existe
    const { data, error } = await supabase
      .from('operations_history')
      .select('fixed_rate_amount')
      .limit(1);
    
    if (error) {
      if (error.code === '42703') { // Campo não existe
        console.log('❌ Campo fixed_rate_amount não existe. Precisa ser adicionado manualmente.');
        console.log('📝 Execute o seguinte SQL no Supabase SQL Editor:');
        console.log('');
        console.log('ALTER TABLE operations_history ADD COLUMN fixed_rate_amount DECIMAL(10,2) DEFAULT 0.00;');
        console.log('UPDATE operations_history SET fixed_rate_amount = 0.00 WHERE fixed_rate_amount IS NULL;');
        console.log('ALTER TABLE operations_history ALTER COLUMN fixed_rate_amount SET NOT NULL;');
        console.log('');
        return false;
      } else {
        console.error('❌ Erro ao verificar campo:', error);
        return false;
      }
    } else {
      console.log('✅ Campo fixed_rate_amount já existe!');
      console.log('📊 Exemplo de dados:', data);
      return true;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

checkAndAddFixedRateField().then(success => {
  if (success) {
    console.log('🎉 Campo fixed_rate_amount verificado com sucesso!');
    process.exit(0);
  } else {
    console.log('💥 Campo fixed_rate_amount precisa ser adicionado manualmente!');
    process.exit(1);
  }
});
