const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const pathParts = event.path.split('/');
  const callSid = pathParts[pathParts.length - 2]; // Extract callSid from path
  const action = pathParts[pathParts.length - 1]; // 'summary' or 'regenerate'

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await handleGetSummary(callSid, headers);
      
      case 'POST':
        if (action === 'regenerate') {
          return await handleRegenerateSummary(callSid, event.body, headers);
        } else {
          return await handleGenerateSummary(callSid, event.body, headers);
        }
      
      case 'PUT':
        return await handleUpdateSummary(callSid, event.body, headers);
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function handleGetSummary(callSid, headers) {
  const { data, error } = await supabase
    .from('call_analysis')
    .select('*')
    .eq('call_sid', callSid)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Summary not found' })
    };
  }

  const summary = {
    executiveSummary: data.executive_summary,
    keyPoints: data.key_points || [],
    actionItems: data.action_items || [],
    sentimentAnalysis: data.sentiment_analysis || {},
    nextSteps: data.next_steps || [],
    metadata: {
      format: data.summary_format,
      version: data.summary_version,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(summary)
  };
}

async function handleGenerateSummary(callSid, body, headers) {
  const { transcription, format = 'detailed' } = JSON.parse(body || '{}');

  if (!transcription) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Transcription is required' })
    };
  }

  const startTime = Date.now();

  try {
    // Generate summary using OpenRouter
    const prompt = buildPrompt(transcription, format);
    const aiResponse = await callOpenRouter(prompt);
    const summary = parseAIResponse(aiResponse.choices[0].message.content);

    // Get call_id from calls table
    const { data: callData } = await supabase
      .from('calls')
      .select('id')
      .eq('call_sid', callSid)
      .single();

    // Save to database
    const analysisData = {
      call_sid: callSid,
      call_id: callData?.id,
      executive_summary: summary.executiveSummary,
      key_points: summary.keyPoints,
      action_items: summary.actionItems,
      sentiment_analysis: summary.sentimentAnalysis,
      next_steps: summary.nextSteps,
      summary_format: format,
      ai_model: 'anthropic/claude-3-haiku',
      ai_provider: 'openrouter',
      processing_time_ms: Date.now() - startTime,
      token_count: {
        input: aiResponse.usage?.prompt_tokens || 0,
        output: aiResponse.usage?.completion_tokens || 0
      }
    };

    const { error: insertError } = await supabase
      .from('call_analysis')
      .insert(analysisData);

    if (insertError) throw insertError;

    // Update calls table
    if (callData?.id) {
      await supabase
        .from('calls')
        .update({ has_analysis: true })
        .eq('id', callData.id);
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(summary)
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to generate summary' })
    };
  }
}

async function handleRegenerateSummary(callSid, body, headers) {
  const { transcription, format = 'detailed' } = JSON.parse(body || '{}');

  if (!transcription) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Transcription is required' })
    };
  }

  const startTime = Date.now();

  try {
    // Check if summary exists
    const { data: existing } = await supabase
      .from('call_analysis')
      .select('summary_version')
      .eq('call_sid', callSid)
      .single();

    if (!existing) {
      // No existing summary, create new one
      return handleGenerateSummary(callSid, body, headers);
    }

    // Generate new summary
    const prompt = buildPrompt(transcription, format);
    const aiResponse = await callOpenRouter(prompt);
    const summary = parseAIResponse(aiResponse.choices[0].message.content);

    // Update existing analysis
    const { error: updateError } = await supabase
      .from('call_analysis')
      .update({
        executive_summary: summary.executiveSummary,
        key_points: summary.keyPoints,
        action_items: summary.actionItems,
        sentiment_analysis: summary.sentimentAnalysis,
        next_steps: summary.nextSteps,
        summary_format: format,
        summary_version: existing.summary_version + 1,
        regenerated_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        token_count: {
          input: aiResponse.usage?.prompt_tokens || 0,
          output: aiResponse.usage?.completion_tokens || 0
        }
      })
      .eq('call_sid', callSid);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(summary)
    };
  } catch (error) {
    console.error('Error regenerating summary:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to regenerate summary' })
    };
  }
}

async function handleUpdateSummary(callSid, body, headers) {
  const updates = JSON.parse(body || '{}');
  
  const updateData = {};
  if (updates.executiveSummary) updateData.executive_summary = updates.executiveSummary;
  if (updates.keyPoints) updateData.key_points = updates.keyPoints;
  if (updates.actionItems) updateData.action_items = updates.actionItems;
  if (updates.sentimentAnalysis) updateData.sentiment_analysis = updates.sentimentAnalysis;
  if (updates.nextSteps) updateData.next_steps = updates.nextSteps;

  const { error } = await supabase
    .from('call_analysis')
    .update(updateData)
    .eq('call_sid', callSid);

  if (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update summary' })
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true })
  };
}

function buildPrompt(transcription, format) {
  const formatInstructions = {
    brief: 'Provide a concise summary in 2-3 sentences, highlighting only the most critical points.',
    detailed: 'Provide a comprehensive summary including all important details, context, and nuances.',
    executive: 'Provide a high-level executive summary focusing on business impact, decisions, and strategic outcomes.'
  };

  return `Analyze the following call transcription and provide a structured summary.

Format: ${format} - ${formatInstructions[format]}

Transcription:
${transcription}

Please provide your analysis in the following JSON format:
{
  "executiveSummary": "A clear, concise overview of the call",
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

async function callOpenRouter(prompt) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.URL || 'http://localhost:8888',
      'X-Title': 'Call Summary Service'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content: 'You are an AI assistant specialized in analyzing business calls and providing structured summaries. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
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
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(item => ({
        task: item.task || '',
        assignee: item.assignee,
        priority: item.priority || 'medium',
        dueDate: item.dueDate
      })) : [],
      sentimentAnalysis: {
        overall: parsed.sentimentAnalysis?.overall || 'neutral',
        score: parsed.sentimentAnalysis?.score || 0,
        emotions: parsed.sentimentAnalysis?.emotions || {},
        keyMoments: Array.isArray(parsed.sentimentAnalysis?.keyMoments) 
          ? parsed.sentimentAnalysis.keyMoments 
          : []
      },
      nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : []
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI response');
  }
}