# AI-Powered Call Summary Service

This service provides intelligent call summaries using OpenRouter's AI API to analyze call transcriptions and extract valuable insights.

## Features

- **Multiple Summary Formats**:
  - **Brief**: 2-3 sentence overview highlighting critical points
  - **Detailed**: Comprehensive summary with all important details
  - **Executive**: High-level summary focusing on business impact

- **Comprehensive Analysis**:
  - Executive summary
  - Key discussion points
  - Action items with priority and assignees
  - Sentiment analysis with emotion detection
  - Recommended next steps

- **Advanced Capabilities**:
  - Summary regeneration with different parameters
  - Manual editing and updates
  - Version tracking
  - Token usage tracking

## Database Schema

The service uses a `call_analysis` table with the following structure:

```sql
call_analysis
├── id (UUID, primary key)
├── call_sid (TEXT, unique)
├── call_id (UUID, references calls.id)
├── executive_summary (TEXT)
├── key_points (JSONB array)
├── action_items (JSONB array)
├── sentiment_analysis (JSONB object)
├── next_steps (JSONB array)
├── summary_format (TEXT: brief/detailed/executive)
├── summary_version (INTEGER)
├── ai_model (TEXT)
├── ai_provider (TEXT)
├── processing_time_ms (INTEGER)
├── token_count (JSONB: {input, output})
├── created_at (TIMESTAMPTZ)
├── updated_at (TIMESTAMPTZ)
└── regenerated_at (TIMESTAMPTZ)
```

## API Endpoints

### Generate Summary
```
POST /api/calls/:callSid/summary
Body: {
  "transcription": "Call transcript text",
  "format": "brief" | "detailed" | "executive"
}
```

### Get Summary
```
GET /api/calls/:callSid/summary
```

### Update Summary
```
PUT /api/calls/:callSid/summary
Body: {
  "executiveSummary": "Updated summary",
  "keyPoints": ["point1", "point2"],
  "actionItems": [...],
  "sentimentAnalysis": {...},
  "nextSteps": [...]
}
```

### Regenerate Summary
```
POST /api/calls/:callSid/summary/regenerate
Body: {
  "transcription": "Call transcript text",
  "format": "brief" | "detailed" | "executive"
}
```

## Environment Variables

Add these to your `.env` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage Example

### React Component Usage

```tsx
import { CallSummaryView } from './components/CallSummaryView';

// In your call details component
<CallSummaryView 
  callSid="CA1234567890" 
  transcription={callTranscription}
/>
```

### Direct API Usage

```javascript
// Generate a summary
const response = await fetch('/api/calls/CA1234567890/summary', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transcription: 'Hello, this is a test call...',
    format: 'detailed'
  })
});

const summary = await response.json();
console.log(summary);
```

## Migration

Run this SQL migration to create the necessary table:

```bash
# Apply the migration
psql $DATABASE_URL < supabase/migrations/005_create_call_analysis_table.sql
```

## AI Model

The service uses `anthropic/claude-3-haiku` via OpenRouter for optimal balance between:
- Fast response times
- Cost efficiency
- High-quality analysis
- Structured output generation

## Summary Structure

Each summary includes:

```json
{
  "executiveSummary": "Concise overview of the call",
  "keyPoints": [
    "Main discussion point 1",
    "Main discussion point 2"
  ],
  "actionItems": [
    {
      "task": "Follow up with customer",
      "assignee": "John Doe",
      "priority": "high",
      "dueDate": "2024-01-15"
    }
  ],
  "sentimentAnalysis": {
    "overall": "positive",
    "score": 0.75,
    "emotions": {
      "satisfaction": 0.8,
      "frustration": 0.1,
      "confusion": 0.05,
      "enthusiasm": 0.7
    },
    "keyMoments": [
      {
        "sentiment": "Very satisfied",
        "text": "This solution works perfectly!"
      }
    ]
  },
  "nextSteps": [
    "Schedule follow-up meeting",
    "Send product documentation"
  ]
}
```

## Error Handling

The service includes comprehensive error handling:
- Missing transcriptions
- API failures
- Invalid formats
- Database errors

All errors are logged and appropriate HTTP status codes are returned.

## Performance

- Average processing time: 2-5 seconds
- Token usage tracked for cost monitoring
- Caching of summaries to avoid regeneration
- Efficient database queries with proper indexing