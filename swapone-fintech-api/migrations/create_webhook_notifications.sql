-- Migration: Create webhook_notifications table
-- Description: Store webhook notifications persistently instead of in memory

CREATE TABLE IF NOT EXISTS webhook_notifications (
    id VARCHAR(255) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    headers JSONB,
    body JSONB,
    query_params JSONB,
    ip_address INET,
    method VARCHAR(10),
    url TEXT,
    is_test BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_timestamp 
ON webhook_notifications(timestamp DESC);

-- Index for performance on test flag
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_is_test 
ON webhook_notifications(is_test);

-- Function to clean old webhook notifications (older than 30 days)
CREATE OR REPLACE FUNCTION clean_old_webhook_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE webhook_notifications TO passa_tech_user;
GRANT EXECUTE ON FUNCTION clean_old_webhook_notifications() TO passa_tech_user;

-- Insert sample data (optional)
-- INSERT INTO webhook_notifications (id, headers, body, query_params, ip_address, method, url, is_test) 
-- VALUES 
--     ('sample-1', '{"content-type": "application/json"}', '{"event": "test"}', '{}', '127.0.0.1', 'POST', '/api/public/webhook/test', true);
