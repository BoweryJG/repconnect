-- Create queued_calls table
CREATE TABLE IF NOT EXISTS queued_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  queue_id UUID NOT NULL,
  position INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'calling', 'completed', 'failed')),
  outcome JSONB,
  call_sid TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_queued_calls_queue_id ON queued_calls(queue_id);
CREATE INDEX idx_queued_calls_status ON queued_calls(status);
CREATE INDEX idx_queued_calls_contact_id ON queued_calls(contact_id);
CREATE INDEX idx_queued_calls_scheduled ON queued_calls(scheduled_for);

-- Create call_history table
CREATE TABLE IF NOT EXISTS call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL,
  duration INTEGER,
  notes TEXT,
  recording_url TEXT,
  call_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_call_history_contact_id ON call_history(contact_id);
CREATE INDEX idx_call_history_created_at ON call_history(created_at);
CREATE INDEX idx_call_history_call_sid ON call_history(call_sid);

-- Add RLS policies
ALTER TABLE queued_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users on queued_calls"
  ON queued_calls
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on call_history"
  ON call_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_queued_calls_updated_at BEFORE UPDATE
  ON queued_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();