-- Migration: Add RLS policies to tables without any policies
-- Date: 2025-01-10
-- Description: Add authentication-based RLS policies to all tables that don't have any policies

-- Enable RLS on all tables without policies
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsg_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nsg_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Agencies table
CREATE POLICY "Authenticated users can view agencies" ON agencies
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage agencies" ON agencies
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Campaign metrics table
CREATE POLICY "Users can view metrics for their campaigns" ON campaign_metrics
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM campaign_purchases cp
        JOIN campaigns c ON c.id = cp.campaign_id
        WHERE cp.user_id = auth.uid() AND c.id = campaign_metrics.campaign_id
    ));

CREATE POLICY "Service role can manage campaign metrics" ON campaign_metrics
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Chatbot conversations table
CREATE POLICY "Users can view their chatbot conversations" ON chatbot_conversations
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create chatbot conversations" ON chatbot_conversations
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their chatbot conversations" ON chatbot_conversations
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage chatbot conversations" ON chatbot_conversations
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Chatbots table
CREATE POLICY "Authenticated users can view active chatbots" ON chatbots
    FOR SELECT TO authenticated
    USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage chatbots" ON chatbots
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Client services table
CREATE POLICY "Service role can manage client services" ON client_services
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Authenticated users can view client services" ON client_services
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Clients table
CREATE POLICY "Service role can manage clients" ON clients
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view clients in their organization" ON clients
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM organizations o
        JOIN profiles p ON p.organization_id = o.id
        WHERE p.id = auth.uid() AND o.id = clients.organization_id
    ));

-- Content calendar table
CREATE POLICY "Users can manage their content calendar" ON content_calendar
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage content calendar" ON content_calendar
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Content templates table
CREATE POLICY "Authenticated users can view public templates" ON content_templates
    FOR SELECT TO authenticated
    USING (is_public = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their own templates" ON content_templates
    FOR ALL TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Service role can manage content templates" ON content_templates
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Dev applications table
CREATE POLICY "Users can manage their dev applications" ON dev_applications
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage dev applications" ON dev_applications
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Dev projects table
CREATE POLICY "Users can manage their dev projects" ON dev_projects
    FOR ALL TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Service role can manage dev projects" ON dev_projects
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- NSG certificates table
CREATE POLICY "Users can view their certificates" ON nsg_certificates
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create certificates" ON nsg_certificates
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage certificates" ON nsg_certificates
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- NSG user progress table
CREATE POLICY "Users can manage their own progress" ON nsg_user_progress
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage user progress" ON nsg_user_progress
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- OAuth configs table
CREATE POLICY "Service role can manage OAuth configs" ON oauth_configs
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Authenticated users can view OAuth configs" ON oauth_configs
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Organizations table
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.organization_id = organizations.id
    ));

CREATE POLICY "Admins can manage their organization" ON organizations
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = organizations.id 
        AND profiles.is_admin = true
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = organizations.id 
        AND profiles.is_admin = true
    ));

CREATE POLICY "Service role can manage organizations" ON organizations
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Social accounts table
CREATE POLICY "Users can manage their social accounts" ON social_accounts
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage social accounts" ON social_accounts
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Tenants table
CREATE POLICY "Users can view their tenant" ON tenants
    FOR SELECT TO authenticated
    USING (id = get_user_tenant_id() AND auth.uid() IS NOT NULL);

CREATE POLICY "Tenant admins can manage their tenant" ON tenants
    FOR ALL TO authenticated
    USING (id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM phone_system_users
        WHERE phone_system_users.user_id = auth.uid()
        AND phone_system_users.tenant_id = tenants.id
        AND phone_system_users.role = 'admin'
    ))
    WITH CHECK (id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM phone_system_users
        WHERE phone_system_users.user_id = auth.uid()
        AND phone_system_users.tenant_id = tenants.id
        AND phone_system_users.role = 'admin'
    ));

CREATE POLICY "Service role can manage tenants" ON tenants
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Usage logs table
CREATE POLICY "Service role can manage usage logs" ON usage_logs
    FOR ALL TO authenticated
    USING (auth.jwt()->>'role' = 'service_role')
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view their usage logs" ON usage_logs
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Commit message
COMMENT ON SCHEMA public IS 'Added authentication-based RLS policies to all tables without policies';