const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMarkups() {
  try {
    console.log('🔍 Verificando markups atuais...');

    // Verificar markups do cliente específico
    const CLIENT_ID = '3540fd26-9b18-4a88-b589-5cbac8378aa9'; // SWAP EXCHANGE DEFI LTDA

    const { data: markups, error } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .eq('active', true);

    if (error) {
      console.error('❌ Erro ao buscar markups:', error);
      return;
    }

    console.log(`📊 Markups encontrados para cliente ${CLIENT_ID}:`);
    markups.forEach(markup => {
      console.log(`   ${markup.from_currency} → ${markup.to_currency}: ${markup.markup_percentage}%`);
    });

    // Verificar se há markups padrão
    const { data: defaultMarkups, error: defaultError } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', null)
      .eq('active', true);

    if (!defaultError && defaultMarkups) {
      console.log('\n📊 Markups padrão:');
      defaultMarkups.forEach(markup => {
        console.log(`   ${markup.from_currency} → ${markup.to_currency}: ${markup.markup_percentage}%`);
      });
    }

    // Testar aplicação de markup
    console.log('\n🧪 Testando aplicação de markup:');
    const testValue = 5.40; // Valor exemplo do Braza
    const testMarkup = 0.5; // 0.5%
    
    const markupMultiplier = 1 + (testMarkup / 100);
    const finalValue = testValue * markupMultiplier;
    
    console.log(`   Valor original: ${testValue}`);
    console.log(`   Markup: ${testMarkup}%`);
    console.log(`   Multiplicador: ${markupMultiplier}`);
    console.log(`   Valor final: ${finalValue.toFixed(4)}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkMarkups();
