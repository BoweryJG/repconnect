# AI Call Sync - Production Setup Guide

## Overview

The AI Call Sync system is now production-ready with the following features:
- Natural language queue creation ("sync top 25 high-value clients in Dallas")
- Intelligent contact scoring based on location, services, and value
- Direct Twilio integration for automated dialing
- Call outcome tracking and history
- Auto-dial functionality with pause/resume
- Error handling and retry logic
- Queue persistence and recovery

## Database Setup

Run these migrations in your Supabase SQL editor:

```sql
-- Run the existing migrations first
-- Then run the new call queue tables migration:

-- Create queued_calls table
CREATE TABLE IF NOT EXISTS queued_calls (
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

-- Create call_history table
CREATE TABLE IF NOT EXISTS call_history (
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

-- Add RLS policies
ALTER TABLE queued_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users on queued_calls"
  ON queued_calls
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on call_history"
  ON call_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_queued_calls_updated_at BEFORE UPDATE
  ON queued_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## How the AI Sync Works

### 1. Natural Language Processing
The system understands queries like:
- "sync top 25 high-value accounts contacted recently"
- "sync premium clients within 25 miles interested in botox"
- "filter accounts with less than 3 calls"

### 2. Contact Scoring Algorithm
Each contact is scored based on:
- **Location Match (30%)**: City, state, or radius distance
- **Service Interest (40%)**: Interest scores for specific services
- **Criteria Match (30%)**: Value tier, recency, tags
- **Bonus (10%)**: Frequent contact history

### 3. Queue Creation Flow
1. User enters natural language query
2. NLP parser extracts intent, location, services, criteria
3. Contacts are scored and sorted
4. Top N contacts form a queue
5. Queue is saved to database with call records

### 4. Calling Workflow
1. Click "Start Calling" on a completed queue
2. Queue Call Interface opens showing:
   - Current contact details
   - Queue progress bar
   - Call/End Call buttons
   - Auto-dial controls
3. After each call, record outcome:
   - Status (completed, no-answer, busy, voicemail)
   - Notes
   - Next action (callback, email, text)
4. System automatically loads next contact

### 5. Features
- **Auto-dial**: Automatically calls next contact after outcome recording
- **Pause/Resume**: Pause queue at any time
- **Skip**: Skip contacts without calling
- **Call History**: All calls logged with outcomes
- **Queue Recovery**: Queues persist across sessions
- **Error Handling**: Automatic retry on call failures

## Usage Examples

### Creating a Queue
1. Go to Sync Dashboard
2. Use voice command or type: "sync top 50 high-value clients in Dallas"
3. Click sync button to process queue
4. Click "Start Calling" when ready

### Managing Calls
- **Auto-dial**: Turn on for hands-free operation
- **Manual**: Click "Start Call" for each contact
- **Outcomes**: Record detailed outcomes after each call
- **Callbacks**: Schedule follow-up calls

### Monitoring Progress
- Real-time progress bar
- Completed/Failed/Pending counts
- Position indicator (e.g., "Contact 5 of 50")

## Troubleshooting

### Common Issues
1. **Calls not connecting**: Check Twilio credentials and phone number format
2. **Queue not loading**: Ensure database tables are created
3. **Performance issues**: Reduce particle effects in settings

### Error Recovery
- Queues auto-save to localStorage
- Failed calls can be retried up to 3 times
- Use queue recovery to resume interrupted sessions

## Best Practices
1. Start with smaller queues (25-50 contacts) to test
2. Use specific criteria for better targeting
3. Record detailed notes for follow-up
4. Schedule callbacks for interested prospects
5. Monitor call history for patterns

## Security Notes
- All calls are logged with timestamps
- Sensitive data is encrypted in transit
- RLS policies protect data access
- Call recordings stored securely in Twilio