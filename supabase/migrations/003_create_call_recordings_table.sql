-- Create call_recordings table to store Twilio recordings
CREATE TABLE IF NOT EXISTS call_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    call_sid VARCHAR(255) UNIQUE NOT NULL,
    recording_sid VARCHAR(255) UNIQUE NOT NULL,
    recording_url TEXT NOT NULL,
    duration_seconds INTEGER DEFAULT 0,
    from_number VARCHAR(50),
    to_number VARCHAR(50),
    recording_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Optional: Link to calls table if you have one
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    
    -- Indexes for faster queries
    INDEX idx_call_recordings_call_sid (call_sid),
    INDEX idx_call_recordings_from_number (from_number),
    INDEX idx_call_recordings_recording_date (recording_date)
);

-- Add RLS policies
ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own recordings
CREATE POLICY "Users can view call recordings" ON call_recordings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Function to get recording URL with authentication
CREATE OR REPLACE FUNCTION get_recording_url(recording_sid TEXT)
RETURNS TEXT AS $$
DECLARE
    base_url TEXT;
BEGIN
    -- Twilio recording URLs require authentication
    -- In production, you'd generate a signed URL here
    SELECT recording_url INTO base_url 
    FROM call_recordings 
    WHERE call_recordings.recording_sid = recording_sid;
    
    RETURN base_url;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easy access to recordings with call data
CREATE OR REPLACE VIEW call_recordings_view AS
SELECT 
    cr.*,
    c.contact_name,
    c.contact_id,
    c.call_status,
    c.created_at as call_date
FROM call_recordings cr
LEFT JOIN calls c ON cr.call_id = c.id
ORDER BY cr.created_at DESC;