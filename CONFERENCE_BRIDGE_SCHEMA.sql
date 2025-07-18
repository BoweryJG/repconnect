-- Database schema updates for conference bridge functionality
-- Run these migrations on your Supabase database

-- Add conference-related columns to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS conference_room VARCHAR(100);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS conference_fallback BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS harvey_failed BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS has_transcription BOOLEAN DEFAULT false;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create call_transcriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS call_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid VARCHAR(255) NOT NULL,
  recording_sid VARCHAR(255),
  transcript TEXT,
  utterances JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for call_transcriptions
ALTER TABLE call_transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON call_transcriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_sid ON call_transcriptions(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_transcriptions_recording_sid ON call_transcriptions(recording_sid);
CREATE INDEX IF NOT EXISTS idx_calls_conference_room ON calls(conference_room);
CREATE INDEX IF NOT EXISTS idx_calls_has_transcription ON calls(has_transcription);

-- Add conference status tracking table
CREATE TABLE IF NOT EXISTS conference_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_room VARCHAR(100) NOT NULL,
  call_sid VARCHAR(255) NOT NULL,
  participant_type VARCHAR(50) NOT NULL, -- 'customer', 'rep', 'harvey'
  participant_sid VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- 'joining', 'connected', 'disconnected', 'failed'
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for conference_status
ALTER TABLE conference_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users" ON conference_status
  FOR ALL USING (auth.role() = 'authenticated');

-- Create indexes for conference_status
CREATE INDEX IF NOT EXISTS idx_conference_status_room ON conference_status(conference_room);
CREATE INDEX IF NOT EXISTS idx_conference_status_call_sid ON conference_status(call_sid);
CREATE INDEX IF NOT EXISTS idx_conference_status_type ON conference_status(participant_type);