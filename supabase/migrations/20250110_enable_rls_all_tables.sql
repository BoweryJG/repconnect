-- Migration: Enable RLS on all tables
-- Date: 2025-01-10
-- Description: Ensure Row Level Security is enabled on all public schema tables

-- Enable RLS on all tables in public schema
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
    END LOOP;
END $$;

-- Verify RLS is enabled on all tables
CREATE OR REPLACE VIEW public.rls_status AS
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as rls_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_policies p 
            WHERE p.schemaname = t.schemaname 
            AND p.tablename = t.tablename
        ) THEN 'YES'
        ELSE 'NO'
    END as has_policies
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.rls_status TO authenticated;

-- Create a function to check if all tables have proper RLS
CREATE OR REPLACE FUNCTION public.check_rls_compliance()
RETURNS TABLE (
    tablename text,
    issue text
) AS $$
BEGIN
    -- Check for tables without RLS enabled
    RETURN QUERY
    SELECT 
        t.tablename::text,
        'RLS is not enabled'::text as issue
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
    WHERE t.schemaname = 'public'
    AND NOT c.rowsecurity;

    -- Check for tables with RLS enabled but no policies
    RETURN QUERY
    SELECT 
        t.tablename::text,
        'RLS enabled but no policies defined'::text as issue
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
        AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = t.schemaname)
    WHERE t.schemaname = 'public'
    AND c.rowsecurity
    AND NOT EXISTS (
        SELECT 1 
        FROM pg_policies p 
        WHERE p.schemaname = t.schemaname 
        AND p.tablename = t.tablename
    );

    -- Check for policies that allow unrestricted access
    RETURN QUERY
    SELECT DISTINCT
        p.tablename::text,
        'Has policy with unrestricted access (qual = true)'::text as issue
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND (p.qual = 'true' OR p.with_check = 'true');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_rls_compliance() TO authenticated;

-- Create an alert table for RLS compliance issues
CREATE TABLE IF NOT EXISTS public.rls_compliance_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tablename text NOT NULL,
    issue text NOT NULL,
    detected_at timestamptz DEFAULT now(),
    resolved_at timestamptz,
    resolved_by uuid REFERENCES auth.users(id)
);

-- Enable RLS on the compliance alerts table
ALTER TABLE public.rls_compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Add policy for compliance alerts
CREATE POLICY "Admins can manage RLS compliance alerts" ON public.rls_compliance_alerts
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role = 'admin'
    ));

-- Populate initial compliance alerts
INSERT INTO public.rls_compliance_alerts (tablename, issue)
SELECT * FROM public.check_rls_compliance()
ON CONFLICT DO NOTHING;

-- Create a scheduled function to check RLS compliance (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.scheduled_rls_compliance_check()
RETURNS void AS $$
DECLARE
    r RECORD;
BEGIN
    -- Mark previously detected issues as resolved if they no longer exist
    UPDATE public.rls_compliance_alerts
    SET resolved_at = now()
    WHERE resolved_at IS NULL
    AND NOT EXISTS (
        SELECT 1 
        FROM public.check_rls_compliance() c
        WHERE c.tablename = rls_compliance_alerts.tablename
        AND c.issue = rls_compliance_alerts.issue
    );

    -- Insert new issues
    INSERT INTO public.rls_compliance_alerts (tablename, issue)
    SELECT * FROM public.check_rls_compliance() c
    WHERE NOT EXISTS (
        SELECT 1 
        FROM public.rls_compliance_alerts a
        WHERE a.tablename = c.tablename
        AND a.issue = c.issue
        AND a.resolved_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commit message
COMMENT ON SCHEMA public IS 'Enabled RLS on all tables and added compliance monitoring';