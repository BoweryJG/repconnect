-- Migration: Fix RLS policies to require authentication
-- Date: 2025-01-10
-- Description: Update all RLS policies to require proper authentication and remove insecure policies

-- First, drop all existing insecure policies that use (true) or allow public/anon access without auth

-- Analytics table - remove public insert policy
DROP POLICY IF EXISTS "Allow public to insert analytics" ON analytics;

-- Update analytics insert policy to require authentication
DROP POLICY IF EXISTS "Allow authenticated to insert analytics" ON analytics;
CREATE POLICY "Allow authenticated to insert analytics" ON analytics
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Update analytics select policy to check auth
DROP POLICY IF EXISTS "Allow authenticated to read analytics" ON analytics;
CREATE POLICY "Allow authenticated to read analytics" ON analytics
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Campaigns table - update to require authentication
DROP POLICY IF EXISTS "Public can view active campaigns" ON campaigns;
CREATE POLICY "Authenticated can view active campaigns" ON campaigns
    FOR SELECT TO authenticated
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- Contacts table - remove public insert
DROP POLICY IF EXISTS "Public can insert contacts" ON contacts;
CREATE POLICY "Authenticated can insert contacts" ON contacts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Update contacts select policy
DROP POLICY IF EXISTS "Users can view their own contacts" ON contacts;
CREATE POLICY "Users can view their own contacts" ON contacts
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL AND (auth.email() = email OR auth.jwt()->>'role' = 'service_role'));

-- NSG tables - update to require authentication
DROP POLICY IF EXISTS "Anyone can read courses" ON nsg_courses;
CREATE POLICY "Authenticated can read courses" ON nsg_courses
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read lessons" ON nsg_lessons;
CREATE POLICY "Authenticated can read lessons" ON nsg_lessons
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Anyone can read modules" ON nsg_modules;
CREATE POLICY "Authenticated can read modules" ON nsg_modules
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Email aliases, configurations, stripe tables - update to check auth.uid()
DROP POLICY IF EXISTS "Authenticated users can read email aliases" ON email_aliases;
CREATE POLICY "Authenticated users can read email aliases" ON email_aliases
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read email configs" ON email_configurations;
CREATE POLICY "Authenticated users can read email configs" ON email_configurations
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read stripe configs" ON stripe_configurations;
CREATE POLICY "Authenticated users can read stripe configs" ON stripe_configurations
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read stripe prices" ON stripe_prices;
CREATE POLICY "Authenticated users can read stripe prices" ON stripe_prices
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read stripe products" ON stripe_products;
CREATE POLICY "Authenticated users can read stripe products" ON stripe_products
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can read subscriptions" ON stripe_subscriptions_tracking;
CREATE POLICY "Authenticated users can read subscriptions" ON stripe_subscriptions_tracking
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Service packages - update to require authentication
DROP POLICY IF EXISTS "Public can read service packages" ON service_packages;
CREATE POLICY "Authenticated can read service packages" ON service_packages
    FOR SELECT TO authenticated
    USING (is_active = true AND auth.uid() IS NOT NULL);

-- Update all policies that use auth.role() = 'authenticated' to properly check auth.uid()
DROP POLICY IF EXISTS "Allow authenticated to insert invoice_items" ON invoice_items;
CREATE POLICY "Allow authenticated to insert invoice_items" ON invoice_items
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated to read invoice_items" ON invoice_items;
CREATE POLICY "Allow authenticated to read invoice_items" ON invoice_items
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated to update invoice_items" ON invoice_items;
CREATE POLICY "Allow authenticated to update invoice_items" ON invoice_items
    FOR UPDATE TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated to insert invoices" ON invoices;
CREATE POLICY "Allow authenticated to insert invoices" ON invoices
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated to read invoices" ON invoices;
CREATE POLICY "Allow authenticated to read invoices" ON invoices
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated to update invoices" ON invoices;
CREATE POLICY "Allow authenticated to update invoices" ON invoices
    FOR UPDATE TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated to read onboarding_submissions" ON onboarding_submissions;
CREATE POLICY "Allow authenticated to read onboarding_submissions" ON onboarding_submissions
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Update all service_role policies to use proper role checking
DROP POLICY IF EXISTS "Service role can do everything on communication" ON communication_logs;
CREATE POLICY "Service role can do everything on communication" ON communication_logs
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything" ON contacts;
CREATE POLICY "Service role can do everything" ON contacts
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on contracts" ON contracts;
CREATE POLICY "Service role can do everything on contracts" ON contracts
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage email templates" ON email_templates;
CREATE POLICY "Service role can manage email templates" ON email_templates
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on files" ON file_uploads;
CREATE POLICY "Service role can do everything on files" ON file_uploads
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on onboarding" ON onboarding_steps;
CREATE POLICY "Service role can do everything on onboarding" ON onboarding_steps
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access to onboarding_submissions" ON onboarding_submissions;
CREATE POLICY "Allow service role full access to onboarding_submissions" ON onboarding_submissions
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on payments" ON payments;
CREATE POLICY "Service role can do everything on payments" ON payments
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on milestones" ON project_milestones;
CREATE POLICY "Service role can do everything on milestones" ON project_milestones
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on projects" ON projects;
CREATE POLICY "Service role can do everything on projects" ON projects
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can manage service packages" ON service_packages;
CREATE POLICY "Service role can manage service packages" ON service_packages
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Allow service role full access to sms_logs" ON sms_logs;
CREATE POLICY "Allow service role full access to sms_logs" ON sms_logs
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role can do everything on portal access" ON client_portal_access;
CREATE POLICY "Service role can do everything on portal access" ON client_portal_access
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Update all policies that currently use role 'public' to use 'authenticated'
-- API usage tables
DROP POLICY IF EXISTS "Users can view own API usage" ON api_usage;
CREATE POLICY "Users can view own API usage" ON api_usage
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid() AND customers.id = api_usage.customer_id
    ));

DROP POLICY IF EXISTS "Users can view own daily API usage" ON api_usage_daily;
CREATE POLICY "Users can view own daily API usage" ON api_usage_daily
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid() AND customers.id = api_usage_daily.customer_id
    ));

DROP POLICY IF EXISTS "Users can view own API limits" ON api_usage_limits;
CREATE POLICY "Users can view own API limits" ON api_usage_limits
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid() AND customers.id = api_usage_limits.customer_id
    ));

-- Authorized clients
DROP POLICY IF EXISTS "Admins can manage all client records" ON authorized_clients;
CREATE POLICY "Admins can manage all client records" ON authorized_clients
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'
    ));

DROP POLICY IF EXISTS "Users can view own client record" ON authorized_clients;
CREATE POLICY "Users can view own client record" ON authorized_clients
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Campaign related tables
DROP POLICY IF EXISTS "Users can view A/B tests for purchased campaigns" ON campaign_ab_tests;
CREATE POLICY "Users can view A/B tests for purchased campaigns" ON campaign_ab_tests
    FOR SELECT TO authenticated
    USING (campaign_id IN (
        SELECT campaign_id FROM campaign_purchases
        WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can view performance metrics for purchased campaigns" ON campaign_performance_metrics;
CREATE POLICY "Users can view performance metrics for purchased campaigns" ON campaign_performance_metrics
    FOR SELECT TO authenticated
    USING (campaign_id IN (
        SELECT campaign_id FROM campaign_purchases
        WHERE user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can view own purchases" ON campaign_purchases;
CREATE POLICY "Users can view own purchases" ON campaign_purchases
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Credits and payments
DROP POLICY IF EXISTS "Users can view own credits" ON credits;
CREATE POLICY "Users can view own credits" ON credits
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid() AND customers.id = credits.customer_id
    ));

DROP POLICY IF EXISTS "Allow users to read own customer data" ON customers;
CREATE POLICY "Allow users to read own customer data" ON customers
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own customer record" ON customers;

-- Generated emails
DROP POLICY IF EXISTS "Users can view own emails" ON generated_emails;
CREATE POLICY "Users can view own emails" ON generated_emails
    FOR SELECT TO authenticated
    USING (purchase_id IN (
        SELECT id FROM campaign_purchases
        WHERE user_id = auth.uid()
    ));

-- Payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid() AND customers.id = payments.customer_id
    ));

-- Profiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid() AND customers.id = subscriptions.customer_id
    ));

-- User credits and roles
DROP POLICY IF EXISTS "Users can view own credits" ON user_credits;
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Phone system tables - update tenant isolation policies
DROP POLICY IF EXISTS "Tenant isolation policy" ON auto_attendants;
CREATE POLICY "Tenant isolation policy" ON auto_attendants
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert call logs" ON call_logs;
CREATE POLICY "System can insert call logs" ON call_logs
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their tenant's call logs" ON call_logs;
CREATE POLICY "Users can view their tenant's call logs" ON call_logs
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON call_queues;
CREATE POLICY "Tenant isolation policy" ON call_queues
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON call_recordings;
CREATE POLICY "Tenant isolation policy" ON call_recordings
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON call_routing_rules;
CREATE POLICY "Tenant isolation policy" ON call_routing_rules
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON conference_rooms;
CREATE POLICY "Tenant isolation policy" ON conference_rooms
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON ivr_menus;
CREATE POLICY "Tenant isolation policy" ON ivr_menus
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON phone_billing;
CREATE POLICY "Tenant isolation policy" ON phone_billing
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON phone_extensions;
CREATE POLICY "Tenant isolation policy" ON phone_extensions
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can manage their tenant's phone numbers" ON phone_numbers;
CREATE POLICY "Users can manage their tenant's phone numbers" ON phone_numbers
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their tenant's phone numbers" ON phone_numbers;

DROP POLICY IF EXISTS "Tenant isolation policy" ON phone_system_audit_log;
CREATE POLICY "Tenant isolation policy" ON phone_system_audit_log
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON phone_system_integrations;
CREATE POLICY "Tenant isolation policy" ON phone_system_integrations
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON phone_system_users;
CREATE POLICY "Tenant isolation policy" ON phone_system_users
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete their tenant's phone systems" ON phone_systems;
CREATE POLICY "Users can delete their tenant's phone systems" ON phone_systems
    FOR DELETE TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can insert phone systems for their tenant" ON phone_systems;
CREATE POLICY "Users can insert phone systems for their tenant" ON phone_systems
    FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their tenant's phone systems" ON phone_systems;
CREATE POLICY "Users can update their tenant's phone systems" ON phone_systems
    FOR UPDATE TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their tenant's phone systems" ON phone_systems;
CREATE POLICY "Users can view their tenant's phone systems" ON phone_systems
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON phone_usage_summary;
CREATE POLICY "Tenant isolation policy" ON phone_usage_summary
    FOR SELECT TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON queue_members;
CREATE POLICY "Tenant isolation policy" ON queue_members
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON sms_messages;
CREATE POLICY "Tenant isolation policy" ON sms_messages
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON voicemail_boxes;
CREATE POLICY "Tenant isolation policy" ON voicemail_boxes
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Tenant isolation policy" ON voicemail_messages;
CREATE POLICY "Tenant isolation policy" ON voicemail_messages
    FOR ALL TO authenticated
    USING (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL)
    WITH CHECK (tenant_id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

-- Commit message
COMMENT ON SCHEMA public IS 'Updated RLS policies to require authentication - removed all insecure (true) policies';