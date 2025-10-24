-- Function to safely increment annual usage
-- This function ensures atomic updates to the annual usage field

CREATE OR REPLACE FUNCTION increment_annual_usage(client_id UUID, amount DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    current_usage DECIMAL;
    new_usage DECIMAL;
BEGIN
    -- Get current usage
    SELECT current_annual_usage_usdt INTO current_usage
    FROM clients 
    WHERE id = client_id;
    
    -- Calculate new usage
    new_usage := COALESCE(current_usage, 0) + COALESCE(amount, 0);
    
    -- Update the usage
    UPDATE clients 
    SET current_annual_usage_usdt = new_usage
    WHERE id = client_id;
    
    -- Return the new usage
    RETURN new_usage;
END;
$$ LANGUAGE plpgsql;
