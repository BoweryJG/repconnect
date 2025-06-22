-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calls table  
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing')),
  status TEXT NOT NULL CHECK (status IN ('initiated', 'connected', 'completed', 'failed')),
  duration INTEGER DEFAULT 0,
  transcript TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_contacts_phone ON contacts(phone_number);
CREATE INDEX idx_calls_contact_id ON calls(contact_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for demo purposes)
-- In production, you would restrict these based on authenticated users
CREATE POLICY "Enable read access for all users" ON contacts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON contacts
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON contacts
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON calls
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON calls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON calls
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert some demo data
INSERT INTO contacts (name, phone_number, email, tags) VALUES
  ('Alice Johnson', '+1234567890', 'alice@example.com', ARRAY['vip', 'tech']),
  ('Bob Smith', '+0987654321', 'bob@example.com', ARRAY['sales', 'priority']),
  ('Carol Williams', '+1122334455', 'carol@example.com', ARRAY['support'])
ON CONFLICT DO NOTHING;