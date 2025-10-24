const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Generates a unique 5-digit account number for clients
 * @returns {Promise<string>} A unique 5-digit account number
 */
async function generateUniqueAccountNumber() {
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Generate a random 5-digit number (10000-99999)
    const accountNumber = Math.floor(Math.random() * 90000) + 10000;
    const accountNumberStr = accountNumber.toString().padStart(5, '0');
    
    // Check if this number already exists
    const { data, error } = await supabase
      .from('clients')
      .select('id')
      .eq('account_number', accountNumberStr)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No rows found, this number is available
      return accountNumberStr;
    }
    
    if (error) {
      console.error('Error checking account number uniqueness:', error);
      throw error;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique account number after maximum attempts');
}

module.exports = {
  generateUniqueAccountNumber
};
