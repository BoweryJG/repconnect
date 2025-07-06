-- Create Sales Coach Agents table
CREATE TABLE IF NOT EXISTS sales_coach_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  personality_type TEXT NOT NULL,
  coaching_style JSONB DEFAULT '{}',
  avatar_url TEXT,
  trust_building_approach TEXT,
  communication_patterns JSONB DEFAULT '{}',
  specialized_knowledge TEXT[],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Coach Procedure Specializations table
CREATE TABLE IF NOT EXISTS coach_procedure_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES sales_coach_agents(id) ON DELETE CASCADE,
  procedure_category TEXT NOT NULL,
  expertise_level INTEGER DEFAULT 5 CHECK (expertise_level >= 1 AND expertise_level <= 10),
  expertise_description TEXT,
  common_questions TEXT[],
  mock_scenarios JSONB DEFAULT '[]',
  available_for_instant BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Coach Availability table
CREATE TABLE IF NOT EXISTS coach_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES sales_coach_agents(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  current_session_id UUID,
  max_concurrent_sessions INTEGER DEFAULT 3,
  daily_sessions_count INTEGER DEFAULT 0,
  last_session_end TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Instant Coaching Sessions table
CREATE TABLE IF NOT EXISTS instant_coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id TEXT NOT NULL,
  coach_id UUID REFERENCES sales_coach_agents(id),
  session_type TEXT NOT NULL,
  procedure_category TEXT NOT NULL,
  webrtc_room_id TEXT NOT NULL,
  connection_status TEXT DEFAULT 'pending',
  session_goals TEXT[],
  notes TEXT,
  recording_url TEXT,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample coach data
INSERT INTO sales_coach_agents (name, gender, personality_type, coaching_style, trust_building_approach, specialized_knowledge) VALUES
  ('Dr. Harvey Stern', 'male', 'Trust-Building Expert', '{"approach": "consultative", "tone": "professional_friendly", "pace": "measured"}', 'Establishes credibility through deep product knowledge and genuine concern for patient outcomes', '{"yomi_robot", "dental_procedures", "patient_psychology"}'),
  ('Dr. Sarah Chen', 'female', 'Aesthetic Authority', '{"approach": "educational", "tone": "warm_confident", "pace": "adaptive"}', 'Uses evidence-based results and artistic expertise to build confidence', '{"injectables", "fillers", "aesthetic_procedures", "patient_consultation"}'),
  ('Marcus Rodriguez', 'male', 'Fitness Results Coach', '{"approach": "results_driven", "tone": "motivational", "pace": "energetic"}', 'Focuses on transformation outcomes and lifestyle improvement', '{"emsculpt", "body_contouring", "fitness_technology"}'),
  ('Dr. Amanda Foster', 'female', 'Precision Specialist', '{"approach": "technical_detail", "tone": "reassuring_expert", "pace": "thorough"}', 'Demonstrates expertise through technical precision and safety protocols', '{"lasers", "microneedling", "skin_technology", "treatment_protocols"}');

-- Insert specializations (this will need coach IDs from the above insert)
-- You'll need to run this after getting the coach IDs from the previous insert