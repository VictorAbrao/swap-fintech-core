require('dotenv').config();
const clientLimitsService = require('./src/services/clientLimitsService');

async function resetClientLimit() {
  const clientId = 'bdf195ee-95a7-478f-a154-4ff0a3d88924';
  
  console.log(`🔄 Resetting annual limit for client: ${clientId}`);
  
  try {
    const result = await clientLimitsService.resetAnnualLimit(clientId);
    
    if (result.success) {
      console.log('✅ Annual limit reset successfully!');
      console.log('📊 Updated data:', result.data);
    } else {
      console.error('❌ Failed to reset annual limit:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

resetClientLimit();
