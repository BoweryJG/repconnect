import express from 'express';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { databaseService, tables } from '../src/services/databaseService.js';
import { requireAuth } from '../src/middleware/authMiddleware.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_KEY
);

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = 'https://api.openai.com/v1';

// Helper functions
function buildPrompt(transcription, format = 'detailed') {
  return `Analyze the following call transcription and provide a comprehensive summary in JSON format.

Transcription:
${transcription}

Please provide a ${format} summary with the following structure:
{
  "executiveSummary": "A concise overview of the call",
  "keyPoints": ["Array of main discussion points"],
  "actionItems": [
    {
      "task": "Description of the action item",
      "assignee": "Person responsible (if mentioned)",
      "priority": "high/medium/low",
      "dueDate": "Due date if mentioned"
    }
  ],
  "sentimentAnalysis": {
    "overall": "positive/neutral/negative",
    "score": 0.0,
    "emotions": {
      "satisfaction": 0.0,
      "frustration": 0.0,
      "confusion": 0.0,
      "enthusiasm": 0.0
    },
    "keyMoments": [
      {
        "sentiment": "Description of sentiment",
        "text": "Quote from the call"
      }
    ]
  },
  "nextSteps": ["Array of recommended next steps"]
}

Important guidelines:
1. Be objective and accurate
2. Extract concrete action items with clear ownership when possible
3. Identify sentiment based on tone, language, and context
4. Provide actionable next steps
5. For ${format} format, adjust the level of detail accordingly`;
}

async function callOpenAI(prompt) {
  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are an AI assistant specialized in analyzing business calls and providing structured summaries. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return await response.json();
}

function parseAIResponse(content) {
  try {
    // Extract JSON from the response (in case it includes markdown formatting)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    return {
      executiveSummary: parsed.executiveSummary || 'No summary available',
      keyPoints: parsed.keyPoints || [],
      actionItems: parsed.actionItems || [],
      sentimentAnalysis: parsed.sentimentAnalysis || {
        overall: 'neutral',
        score: 0,
        emotions: {},
        keyMoments: [],
      },
      nextSteps: parsed.nextSteps || [],
    };
  } catch (error) {
    logger.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response');
  }
}

// GET /api/calls/:callSid/summary
router.get('/api/calls/:callSid/summary', requireAuth, async (req, res) => {
  const { callSid } = req.params;

  logger.info(`User ${req.user.id} requesting summary for call ${callSid}`);

  try {
    // Fetch existing summary from database with user context
    const { data, error } = await tables.call_summaries.findOne(
      { call_sid: callSid, user_id: req.user.id },
      { select: '*' }
    );

    if (error) {
      logger.error('Error fetching summary:', error);
      return res.status(500).json({ error: 'Failed to fetch summary' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Summary not found' });
    }

    return res.json(data.summary);
  } catch (error) {
    logger.error('Error fetching summary:', error);
    return res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// POST /api/calls/:callSid/summary
router.post('/api/calls/:callSid/summary', requireAuth, async (req, res) => {
  const { callSid } = req.params;
  const { transcription, format = 'detailed' } = req.body;

  if (!transcription) {
    return res.status(400).json({ error: 'Transcription is required' });
  }

  logger.info(`User ${req.user.id} generating summary for call ${callSid}`);

  try {
    // Check if summary already exists for this user
    const { data: existing } = await tables.call_summaries.findOne(
      { call_sid: callSid, user_id: req.user.id },
      { select: 'id' }
    );

    if (existing) {
      return res.status(400).json({ error: 'Summary already exists. Use regenerate endpoint.' });
    }

    // Generate summary using OpenAI
    const prompt = buildPrompt(transcription, format);
    const aiResponse = await callOpenAI(prompt);
    const summary = parseAIResponse(aiResponse.choices[0].message.content);

    // Save to database with user context
    const { data, error } = await tables.call_summaries.insert({
      call_sid: callSid,
      summary,
      format,
      ai_model: 'gpt-4-turbo-preview',
      ai_provider: 'openai',
      processing_time_ms: 0,
      token_count: {
        input: aiResponse.usage?.prompt_tokens || 0,
        output: aiResponse.usage?.completion_tokens || 0,
      },
      user_id: req.user.id,
    });

    const singleData = data?.[0] || null;

    if (error) throw error;

    return res.json(summary);
  } catch (error) {
    logger.error('Error generating summary:', error);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// POST /api/calls/:callSid/summary/regenerate
router.post('/api/calls/:callSid/summary/regenerate', requireAuth, async (req, res) => {
  const { callSid } = req.params;
  const { transcription, format = 'detailed' } = req.body;

  if (!transcription) {
    return res.status(400).json({ error: 'Transcription is required' });
  }

  logger.info(`User ${req.user.id} regenerating summary for call ${callSid}`);

  try {
    // Generate new summary
    const prompt = buildPrompt(transcription, format);
    const aiResponse = await callOpenAI(prompt);
    const summary = parseAIResponse(aiResponse.choices[0].message.content);

    // Update existing record or create new one with user context
    const { data, error } = await tables.call_summaries.upsert(
      {
        call_sid: callSid,
        summary,
        format,
        ai_model: 'gpt-4-turbo-preview',
        ai_provider: 'openai',
        processing_time_ms: 0,
        token_count: {
          input: aiResponse.usage?.prompt_tokens || 0,
          output: aiResponse.usage?.completion_tokens || 0,
        },
        regenerated_at: new Date().toISOString(),
        user_id: req.user.id,
      },
      { onConflict: 'call_sid,user_id' }
    );

    const singleData = data?.[0] || null;

    if (error) throw error;

    return res.json(summary);
  } catch (error) {
    logger.error('Error regenerating summary:', error);
    return res.status(500).json({ error: 'Failed to regenerate summary' });
  }
});

// PUT /api/calls/:callSid/summary
router.put('/api/calls/:callSid/summary', requireAuth, async (req, res) => {
  const { callSid } = req.params;
  const { summary } = req.body;

  if (!summary) {
    return res.status(400).json({ error: 'Summary is required' });
  }

  logger.info(`User ${req.user.id} updating summary for call ${callSid}`);

  try {
    const { data, error } = await tables.call_summaries.update(
      { call_sid: callSid, user_id: req.user.id },
      {
        summary,
        user_edited: true,
        updated_at: new Date().toISOString(),
      }
    );

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Summary not found' });
      }
      throw error;
    }

    const singleData = data?.[0] || null;
    return res.json(singleData?.summary);
  } catch (error) {
    logger.error('Error updating summary:', error);
    return res.status(500).json({ error: 'Failed to update summary' });
  }
});

export default router;
