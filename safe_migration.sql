-- First, let's check what exists
DO $$ 
BEGIN
    -- Check if contacts table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        -- Create contacts table
        CREATE TABLE contacts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            email TEXT,
            notes TEXT,
            tags TEXT[],
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'name') THEN
            ALTER TABLE contacts ADD COLUMN name TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'phone_number') THEN
            ALTER TABLE contacts ADD COLUMN phone_number TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'email') THEN
            ALTER TABLE contacts ADD COLUMN email TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'notes') THEN
            ALTER TABLE contacts ADD COLUMN notes TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'tags') THEN
            ALTER TABLE contacts ADD COLUMN tags TEXT[];
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'created_at') THEN
            ALTER TABLE contacts ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'updated_at') THEN
            ALTER TABLE contacts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        END IF;
    END IF;

    -- Check if calls table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calls') THEN
        -- Create calls table
        CREATE TABLE calls (
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
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_calls_contact_id ON calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);

-- Enable Row Level Security if not already enabled
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Enable read access for all users" ON contacts;
DROP POLICY IF EXISTS "Enable insert for all users" ON contacts;
DROP POLICY IF EXISTS "Enable update for all users" ON contacts;
DROP POLICY IF EXISTS "Enable delete for all users" ON contacts;

CREATE POLICY "Enable read access for all users" ON contacts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON contacts
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON contacts
    FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON calls;
DROP POLICY IF EXISTS "Enable insert for all users" ON calls;
DROP POLICY IF EXISTS "Enable update for all users" ON calls;

CREATE POLICY "Enable read access for all users" ON calls
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON calls
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON calls
    FOR UPDATE USING (true) WITH CHECK (true);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Only insert demo data if the table is empty
INSERT INTO contacts (name, phone_number, email, tags) 
SELECT 'Alice Johnson', '+1234567890', 'alice@example.com', ARRAY['vip', 'tech']
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE phone_number = '+1234567890');

INSERT INTO contacts (name, phone_number, email, tags) 
SELECT 'Bob Smith', '+0987654321', 'bob@example.com', ARRAY['sales', 'priority']
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE phone_number = '+0987654321');

INSERT INTO contacts (name, phone_number, email, tags) 
SELECT 'Carol Williams', '+1122334455', 'carol@example.com', ARRAY['support']
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE phone_number = '+1122334455');