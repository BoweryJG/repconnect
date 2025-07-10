-- Migration: Secure demo data and add authentication constraints
-- Date: 2025-01-10
-- Description: Remove or secure any demo data and add constraints to ensure data integrity

-- Add check constraints to ensure critical tables have proper user associations
-- This prevents orphaned data and ensures all data is tied to authenticated users

-- Add NOT NULL constraints where missing for user_id columns
ALTER TABLE campaign_purchases 
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE user_credits 
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE user_roles 
    ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE profiles 
    ALTER COLUMN id SET NOT NULL;

-- Add foreign key constraints to ensure referential integrity with auth.users
ALTER TABLE campaign_purchases
    DROP CONSTRAINT IF EXISTS campaign_purchases_user_id_fkey,
    ADD CONSTRAINT campaign_purchases_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE user_credits
    DROP CONSTRAINT IF EXISTS user_credits_user_id_fkey,
    ADD CONSTRAINT user_credits_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE user_roles
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE authorized_clients
    DROP CONSTRAINT IF EXISTS authorized_clients_user_id_fkey,
    ADD CONSTRAINT authorized_clients_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

ALTER TABLE generated_emails
    DROP CONSTRAINT IF EXISTS generated_emails_purchase_id_fkey,
    ADD CONSTRAINT generated_emails_purchase_id_fkey 
    FOREIGN KEY (purchase_id) 
    REFERENCES campaign_purchases(id) 
    ON DELETE CASCADE;

-- Add check constraints to prevent empty or test data
ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_name_not_empty 
    CHECK (name IS NOT NULL AND length(trim(name)) > 0);

ALTER TABLE campaigns
    ADD CONSTRAINT campaigns_no_test_data 
    CHECK (
        lower(name) NOT LIKE '%test%' AND 
        lower(name) NOT LIKE '%demo%' AND
        (description IS NULL OR (
            lower(description) NOT LIKE '%test%' AND 
            lower(description) NOT LIKE '%demo%'
        ))
    );

ALTER TABLE contacts
    ADD CONSTRAINT contacts_email_valid 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE contacts
    ADD CONSTRAINT contacts_no_test_data 
    CHECK (
        lower(email) NOT LIKE '%test%' AND 
        lower(email) NOT LIKE '%demo%' AND
        (name IS NULL OR (
            lower(name) NOT LIKE '%test%' AND 
            lower(name) NOT LIKE '%demo%'
        ))
    );

-- Add audit columns to track data creation and modification
ALTER TABLE campaigns 
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE contacts 
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create triggers to automatically update audit columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to set created_by on insert
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_campaigns_created_by BEFORE INSERT ON campaigns
    FOR EACH ROW EXECUTE FUNCTION set_created_by();

CREATE TRIGGER set_contacts_created_by BEFORE INSERT ON contacts
    FOR EACH ROW EXECUTE FUNCTION set_created_by();

-- Remove any existing demo/test data (if any exists)
DELETE FROM campaigns 
WHERE lower(name) LIKE '%test%' 
   OR lower(name) LIKE '%demo%' 
   OR (description IS NOT NULL AND (
       lower(description) LIKE '%test%' OR 
       lower(description) LIKE '%demo%'
   ));

DELETE FROM contacts 
WHERE lower(email) LIKE '%test%' 
   OR lower(email) LIKE '%demo%' 
   OR (name IS NOT NULL AND (
       lower(name) LIKE '%test%' OR 
       lower(name) LIKE '%demo%'
   ));

-- Add indexes for better performance on auth checks
CREATE INDEX IF NOT EXISTS idx_campaign_purchases_user_id ON campaign_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_authorized_clients_user_id ON authorized_clients(user_id);

-- Commit message
COMMENT ON SCHEMA public IS 'Added constraints to prevent demo/test data and ensure all data is properly associated with authenticated users';