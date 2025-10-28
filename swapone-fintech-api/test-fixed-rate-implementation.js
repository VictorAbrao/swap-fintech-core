require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFixedRateImplementation() {
  console.log('🧪 Testing FX Trade Fixed Rate Implementation\n');

  try {
    // Test 1: Verificar se fx_rates tem coluna fixed_rate_amount
    console.log('Test 1: Checking fx_rates table structure...');
    const { data: fxRates, error: fxError } = await supabase
      .from('fx_rates')
      .select('*')
      .limit(1);
    
    if (fxError) throw fxError;
    
    if (fxRates && fxRates.length > 0) {
      console.log('✅ fx_rates table has fixed_rate_amount column:', fxRates[0].fixed_rate_amount !== undefined);
      console.log('   Sample:', JSON.stringify(fxRates[0], null, 2));
    }

    // Test 2: Verificar se pode atualizar fixed_rate_amount
    console.log('\nTest 2: Updating fixed_rate_amount for USDT → BRL...');
    const { data: updateData, error: updateError } = await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: 10.50 })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL')
      .select();
    
    if (updateError) {
      console.log('⚠️ Update error:', updateError.message);
    } else {
      console.log('✅ Update successful:', updateData);
    }

    // Test 3: Verificar se operação de calcular taxa usa fixed_rate_amount
    console.log('\nTest 3: Checking if calculateConversion uses fixed_rate_amount...');
    const fxRatesService = require('./src/services/fxRatesService');
    
    const calculationResult = await fxRatesService.calculateConversion(
      'USDT',
      'BRL',
      100,
      'buy'
    );
    
    if (calculationResult.success) {
      console.log('✅ Calculation result:');
      console.log('   Input: 100 USDT');
      console.log('   Braza Rate:', calculationResult.data.braza_rate);
      console.log('   Base Rate:', calculationResult.data.base_rate);
      console.log('   Final Rate:', calculationResult.data.final_rate);
      console.log('   Markup:', calculationResult.data.markup_percentage + '%');
      console.log('   Fixed Rate Amount:', calculationResult.data.fixed_rate_amount);
      console.log('   Converted Amount:', calculationResult.data.converted_amount);
      
      // Verificar se o fixed_rate_amount está sendo aplicado
      const expectedMin = 100 * calculationResult.data.final_rate;
      const actualAmount = calculationResult.data.converted_amount;
      
      console.log('\n📊 Verification:');
      console.log('   Expected (without fixed):', expectedMin);
      console.log('   Actual amount:', actualAmount);
      console.log('   Difference:', (actualAmount - expectedMin).toFixed(2));
      
      if (actualAmount > expectedMin) {
        console.log('✅ Fixed rate amount is being applied!');
      } else {
        console.log('⚠️ Fixed rate amount may not be applied correctly');
      }
    } else {
      console.log('❌ Calculation failed:', calculationResult.error);
    }

    // Cleanup: Reset to 0
    console.log('\n🧹 Cleaning up...');
    await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: 0 })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL');
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFixedRateImplementation();










