-- Create call_analysis table for AI-generated call summaries
CREATE TABLE IF NOT EXISTS call_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL UNIQUE,
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  
  -- Summary content
  executive_summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  sentiment_analysis JSONB DEFAULT '{}'::jsonb,
  next_steps JSONB DEFAULT '[]'::jsonb,
  
  -- Summary metadata
  summary_format TEXT CHECK (summary_format IN ('brief', 'detailed', 'executive')) DEFAULT 'detailed',
  summary_version INTEGER DEFAULT 1,
  
  -- AI processing metadata
  ai_model TEXT,
  ai_provider TEXT DEFAULT 'openrouter',
  processing_time_ms INTEGER,
  token_count JSONB DEFAULT '{}'::jsonb, -- {input: X, output: Y}
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  regenerated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_call_analysis_call_sid ON call_analysis(call_sid);
CREATE INDEX idx_call_analysis_call_id ON call_analysis(call_id);
CREATE INDEX idx_call_analysis_created_at ON call_analysis(created_at DESC);

-- Enable Row Level Security
ALTER TABLE call_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (for demo purposes)
CREATE POLICY "Enable read access for all users" ON call_analysis
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON call_analysis
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON call_analysis
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON call_analysis
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_call_analysis_updated_at
  BEFORE UPDATE ON call_analysis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add a column to calls table to track if analysis has been generated
ALTER TABLE calls ADD COLUMN IF NOT EXISTS has_analysis BOOLEAN DEFAULT false;