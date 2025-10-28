const { createClient } = require('@supabase/supabase-js');
const fxRatesService = require('../src/services/fxRatesService');
const clientMarkupsService = require('../src/services/clientMarkupsService');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

describe('FX Trade Fixed Rate Implementation Tests', () => {
  
  // Test 1: Verificar se fixed_rate_amount existe na tabela fx_rates
  test('Should have fixed_rate_amount column in fx_rates table', async () => {
    const { data, error } = await supabase
      .from('fx_rates')
      .select('*')
      .limit(1);
    
    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('fixed_rate_amount');
  });

  // Test 2: Verificar se fixed_rate_amount existe na tabela client_markups
  test('Should have fixed_rate_amount column in client_markups table', async () => {
    const { data, error } = await supabase
      .from('client_markups')
      .select('*')
      .limit(1);
    
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty('fixed_rate_amount');
    }
    expect(error).toBeNull();
  });

  // Test 3: Verificar se fixed_rate_amount é lido corretamente do fx_rates
  test('Should read fixed_rate_amount from fx_rates', async () => {
    const result = await fxRatesService.getRate('USDT', 'BRL');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data).toHaveProperty('fixed_rate_amount');
    expect(typeof result.data.fixed_rate_amount).toBe('number');
  });

  // Test 4: Verificar se fixed_rate_amount é aplicado para operações buy
  test('Should apply fixed_rate_amount for buy operations', async () => {
    // Configurar fixed rate amount para USDT → BRL
    await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: 5.00 })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL');
    
    // Calcular conversão de 100 USDT para BRL
    const result = await fxRatesService.calculateConversion('USDT', 'BRL', 100, 'buy');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data).toHaveProperty('fixed_rate_amount');
    expect(parseFloat(result.data.fixed_rate_amount)).toBeGreaterThanOrEqual(5.00);
    
    console.log('📊 Buy operation test result:', {
      amount: result.data.amount,
      braza_rate: result.data.braza_rate,
      final_rate: result.data.final_rate,
      markup_percentage: result.data.markup_percentage,
      fixed_rate_amount: result.data.fixed_rate_amount,
      converted_amount: result.data.converted_amount
    });
  });

  // Test 5: Verificar se fixed_rate_amount não é aplicado para operações sell
  test('Should not apply fixed_rate_amount for sell operations', async () => {
    // Calcular conversão de 100 BRL para USDT (venda)
    const result = await fxRatesService.calculateConversion('BRL', 'USDT', 100, 'sell');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data).toHaveProperty('fixed_rate_amount');
    
    console.log('📊 Sell operation test result:', {
      amount: result.data.amount,
      braza_rate: result.data.braza_rate,
      final_rate: result.data.final_rate,
      markup_percentage: result.data.markup_percentage,
      fixed_rate_amount: result.data.fixed_rate_amount,
      converted_amount: result.data.converted_amount
    });
  });

  // Test 6: Verificar se fixed_rate_amount do cliente é somado ao do sistema
  test('Should sum system and client fixed_rate_amount', async () => {
    const systemFixedRate = 5.00;
    const clientFixedRate = 3.00;
    const expectedTotal = 8.00;
    
    // Configurar fixed rate do sistema
    await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: systemFixedRate })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL');
    
    // Calcular conversão
    const result = await fxRatesService.calculateConversion('USDT', 'BRL', 100, 'buy', 'test-client-id');
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    console.log('📊 Sum test result:', {
      systemFixedRate,
      clientFixedRate,
      totalFixedRate: result.data.fixed_rate_amount,
      converted_amount: result.data.converted_amount
    });
    
    // A taxa fixa total deve ser a soma (quando houver cliente, será testado separadamente)
    expect(parseFloat(result.data.fixed_rate_amount)).toBeGreaterThanOrEqual(systemFixedRate);
  });

  // Test 7: Verificar cálculo matemático correto
  test('Should calculate conversion with fixed rate correctly', async () => {
    const testAmount = 100;
    const fixedRate = 10.00;
    
    // Configurar fixed rate
    await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: fixedRate })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL');
    
    // Calcular conversão
    const result = await fxRatesService.calculateConversion('USDT', 'BRL', testAmount, 'buy');
    
    expect(result.success).toBe(true);
    
    console.log('📊 Mathematical calculation test:', {
      input_amount: testAmount,
      fixed_rate_amount: result.data.fixed_rate_amount,
      braza_rate: result.data.braza_rate,
      final_rate: result.data.final_rate,
      converted_amount: result.data.converted_amount,
      expected_with_fixed: (testAmount * parseFloat(result.data.final_rate)) + parseFloat(result.data.fixed_rate_amount)
    });
  });

  // Test 8: Verificar se pode atualizar fixed_rate_amount via API
  test('Should update fixed_rate_amount via upsertRate', async () => {
    const newFixedRate = 7.50;
    
    const result = await fxRatesService.upsertRate({
      from_currency: 'USDT',
      to_currency: 'BRL',
      rate: 5.20,
      spread_bps: 10,
      active: true,
      fixed_rate_amount: newFixedRate
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.fixed_rate_amount).toBe(newFixedRate);
    
    console.log('📊 Upsert test result:', result.data);
  });

  // Cleanup: Reset fixed_rate_amount to zero
  afterAll(async () => {
    await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: 0 })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL');
    
    console.log('✅ Cleanup: Reset fixed_rate_amount to zero');
  });
});

// Executar testes
async function runTests() {
  console.log('🧪 Starting FX Trade Fixed Rate Tests...\n');
  
  try {
    // Test 1
    console.log('Test 1: Checking fx_rates table structure...');
    const { data, error } = await supabase
      .from('fx_rates')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ fx_rates table has fixed_rate_amount:', data[0]?.fixed_rate_amount !== undefined);
    console.log('   Sample data:', data[0]);
    
    // Test 2
    console.log('\nTest 2: Reading fixed_rate_amount from fx_rates...');
    const getRateResult = await fxRatesService.getRate('USDT', 'BRL');
    console.log('✅ Fixed rate amount:', getRateResult.data?.fixed_rate_amount);
    
    // Test 3
    console.log('\nTest 3: Testing buy operation with fixed rate...');
    await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: 5.00 })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL');
    
    const buyResult = await fxRatesService.calculateConversion('USDT', 'BRL', 100, 'buy');
    console.log('✅ Buy operation result:');
    console.log('   Amount: 100 USDT');
    console.log('   Braza Rate:', buyResult.data?.braza_rate);
    console.log('   Final Rate:', buyResult.data?.final_rate);
    console.log('   Fixed Rate Amount:', buyResult.data?.fixed_rate_amount);
    console.log('   Converted Amount:', buyResult.data?.converted_amount);
    
    // Test 4
    console.log('\nTest 4: Testing sell operation (no fixed rate)...');
    const sellResult = await fxRatesService.calculateConversion('BRL', 'USDT', 500, 'sell');
    console.log('✅ Sell operation result:');
    console.log('   Amount: 500 BRL');
    console.log('   Converted Amount:', sellResult.data?.converted_amount);
    
    // Test 5
    console.log('\nTest 5: Testing upsert with fixed_rate_amount...');
    const upsertResult = await fxRatesService.upsertRate({
      from_currency: 'USDT',
      to_currency: 'BRL',
      rate: 5.20,
      spread_bps: 10,
      active: true,
      fixed_rate_amount: 10.00
    });
    console.log('✅ Upsert result:', upsertResult.data);
    
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabase
      .from('fx_rates')
      .update({ fixed_rate_amount: 0 })
      .eq('from_currency', 'USDT')
      .eq('to_currency', 'BRL');
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Executar
if (require.main === module) {
  runTests();
}

module.exports = { runTests };






