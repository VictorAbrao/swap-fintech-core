const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CLIENT_ID = 'bdf195ee-95a7-478f-a154-4ff0a3d88924';

async function testMarkupsEndpoint() {
  console.log('🔍 Testing markups endpoint for client:', CLIENT_ID);
  
  try {
    // First, check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', CLIENT_ID)
      .single();
    
    if (clientError) {
      console.error('❌ Client not found:', clientError);
      return;
    }
    
    console.log('✅ Client found:', client.name);
    
    // Check existing markups
    const { data: markups, error: markupsError } = await supabase
      .from('client_markups')
      .select('*')
      .eq('client_id', CLIENT_ID)
      .order('from_currency')
      .order('to_currency');
    
    if (markupsError) {
      console.error('❌ Error fetching markups:', markupsError);
      return;
    }
    
    console.log('📊 Existing markups:', markups.length);
    
    if (!markups || markups.length === 0) {
      console.log('🔄 No markups found, initializing...');
      
      // Test the RPC function
      const { data: rpcResult, error: rpcError } = await supabase.rpc('initialize_client_markups', { 
        p_client_id: CLIENT_ID 
      });
      
      if (rpcError) {
        console.error('❌ RPC Error:', rpcError);
        return;
      }
      
      console.log('✅ RPC executed successfully:', rpcResult);
      
      // Fetch the newly created markups
      const { data: newMarkups, error: newError } = await supabase
        .from('client_markups')
        .select('*')
        .eq('client_id', CLIENT_ID)
        .order('from_currency')
        .order('to_currency');
      
      if (newError) {
        console.error('❌ Error fetching new markups:', newError);
        return;
      }
      
      console.log('✅ New markups created:', newMarkups.length);
      console.log('📋 Markups:', newMarkups);
    } else {
      console.log('✅ Markups already exist:', markups);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMarkupsEndpoint();
