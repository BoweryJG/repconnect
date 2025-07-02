-- Create tables for lead enrichment tracking and analytics

-- Track all file uploads
CREATE TABLE IF NOT EXISTS enrichment_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255), -- For anonymous users
  file_name VARCHAR(255),
  file_size INTEGER,
  row_count INTEGER,
  columns JSONB, -- Detected column mapping
  upload_ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store enriched lead data
CREATE TABLE IF NOT EXISTS enriched_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES enrichment_uploads(id) ON DELETE CASCADE,
  original_data JSONB, -- Raw uploaded data
  enriched_data JSONB, -- Enhanced data
  heat_score DECIMAL(3,2), -- 0-100 score
  segment VARCHAR(50),
  company_domain VARCHAR(255),
  company_size VARCHAR(50),
  industry VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track user enrichment usage
CREATE TABLE IF NOT EXISTS enrichment_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  month DATE,
  free_credits_used INTEGER DEFAULT 0,
  paid_credits_used INTEGER DEFAULT 0,
  last_enrichment_at TIMESTAMPTZ,
  UNIQUE(user_id, month)
);

-- Market intelligence aggregation
CREATE TABLE IF NOT EXISTS market_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry VARCHAR(100),
  company_size VARCHAR(50),
  region VARCHAR(100),
  trending_titles JSONB,
  trending_companies JSONB,
  lead_quality_avg DECIMAL(3,2),
  sample_size INTEGER,
  period DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User behavior tracking
CREATE TABLE IF NOT EXISTS enrichment_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id UUID REFERENCES enrichment_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  event_type VARCHAR(50), -- 'upload', 'view_results', 'export', 'share'
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_enrichment_uploads_user_id ON enrichment_uploads(user_id);
CREATE INDEX idx_enrichment_uploads_session_id ON enrichment_uploads(session_id);
CREATE INDEX idx_enriched_leads_upload_id ON enriched_leads(upload_id);
CREATE INDEX idx_enriched_leads_heat_score ON enriched_leads(heat_score DESC);
CREATE INDEX idx_enrichment_usage_user_month ON enrichment_usage(user_id, month);
CREATE INDEX idx_enrichment_analytics_upload_id ON enrichment_analytics(upload_id);
CREATE INDEX idx_enrichment_analytics_event_type ON enrichment_analytics(event_type);

-- Row Level Security
ALTER TABLE enrichment_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE enriched_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own uploads
CREATE POLICY "Users can view own uploads" ON enrichment_uploads
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own uploads" ON enrichment_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can see enriched leads from their uploads
CREATE POLICY "Users can view own enriched leads" ON enriched_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enrichment_uploads 
      WHERE enrichment_uploads.id = enriched_leads.upload_id 
      AND (enrichment_uploads.user_id = auth.uid() OR enrichment_uploads.user_id IS NULL)
    )
  );

-- Users can see their own usage
CREATE POLICY "Users can view own usage" ON enrichment_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON enrichment_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Analytics - users can see their own
CREATE POLICY "Users can view own analytics" ON enrichment_analytics
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert analytics" ON enrichment_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Function to get or create usage record
CREATE OR REPLACE FUNCTION get_or_create_usage_record(p_user_id UUID)
RETURNS enrichment_usage AS $$
DECLARE
  v_record enrichment_usage;
BEGIN
  -- Try to get existing record for current month
  SELECT * INTO v_record
  FROM enrichment_usage
  WHERE user_id = p_user_id
  AND month = DATE_TRUNC('month', CURRENT_DATE);
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO enrichment_usage (user_id, month)
    VALUES (p_user_id, DATE_TRUNC('month', CURRENT_DATE))
    RETURNING * INTO v_record;
  END IF;
  
  RETURN v_record;
END;
$$ LANGUAGE plpgsql;