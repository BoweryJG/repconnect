-- Check existing schema before creating AI sync tables

-- 1. Check if tables exist
SELECT 
    'contacts' as table_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') as exists
UNION ALL
SELECT 
    'calls' as table_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calls') as exists
UNION ALL
SELECT 
    'queued_calls' as table_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'queued_calls') as exists
UNION ALL
SELECT 
    'call_history' as table_name,
    EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_history') as exists;

-- 2. Check columns in contacts table (if it exists)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'contacts'
ORDER BY ordinal_position;

-- 3. Check columns in calls table (if it exists)
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'calls'
ORDER BY ordinal_position;

-- 4. Check if queued_calls already exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'queued_calls'
ORDER BY ordinal_position;

-- 5. Check if call_history already exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'call_history'
ORDER BY ordinal_position;

-- 6. Show all tables in the public schema
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- After running the above checks, use this safe migration script:

-- Only create queued_calls if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'queued_calls') THEN
        CREATE TABLE queued_calls (
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
        
        RAISE NOTICE 'Created queued_calls table';
    ELSE
        RAISE NOTICE 'queued_calls table already exists';
    END IF;
END $$;

-- Only create call_history if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_history') THEN
        CREATE TABLE call_history (
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
        
        RAISE NOTICE 'Created call_history table';
    ELSE
        RAISE NOTICE 'call_history table already exists';
    END IF;
END $$;

-- Enable RLS only if not already enabled
DO $$ 
BEGIN
    -- Check and enable RLS for queued_calls
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'queued_calls') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables t JOIN pg_class c ON t.tablename = c.relname WHERE t.schemaname = 'public' AND t.tablename = 'queued_calls' AND c.relrowsecurity = true) THEN
            ALTER TABLE queued_calls ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS for queued_calls';
        END IF;
    END IF;
    
    -- Check and enable RLS for call_history
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_history') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_tables t JOIN pg_class c ON t.tablename = c.relname WHERE t.schemaname = 'public' AND t.tablename = 'call_history' AND c.relrowsecurity = true) THEN
            ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Enabled RLS for call_history';
        END IF;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'queued_calls' 
        AND policyname = 'Enable all operations for authenticated users on queued_calls'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users on queued_calls"
            ON queued_calls
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Created policy for queued_calls';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'call_history' 
        AND policyname = 'Enable all operations for authenticated users on call_history'
    ) THEN
        CREATE POLICY "Enable all operations for authenticated users on call_history"
            ON call_history
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Created policy for call_history';
    END IF;
END $$;

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger only if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_queued_calls_updated_at'
    ) THEN
        CREATE TRIGGER update_queued_calls_updated_at 
        BEFORE UPDATE ON queued_calls 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created updated_at trigger for queued_calls';
    END IF;
END $$;

-- Final verification
SELECT 
    'Setup Complete!' as message,
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('queued_calls', 'call_history')) as tables_created;