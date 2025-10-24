-- Script: Generate account numbers for existing clients
-- This script generates unique 5-digit account numbers for all existing clients

-- Function to generate a random 5-digit number
CREATE OR REPLACE FUNCTION generate_account_number() RETURNS VARCHAR(5) AS $$
DECLARE
    new_number VARCHAR(5);
    exists_count INTEGER;
BEGIN
    LOOP
        -- Generate a random 5-digit number (10000-99999)
        new_number := LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');
        
        -- Check if this number already exists
        SELECT COUNT(*) INTO exists_count FROM clients WHERE account_number = new_number;
        
        -- If it doesn't exist, we can use it
        IF exists_count = 0 THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update all existing clients with NULL account_number
UPDATE clients 
SET account_number = generate_account_number() 
WHERE account_number IS NULL;

-- Drop the temporary function
DROP FUNCTION generate_account_number();

-- Verify the update
SELECT 
    id, 
    name, 
    account_number,
    created_at 
FROM clients 
ORDER BY created_at;
