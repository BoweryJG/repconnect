// RepConnect Chat Routes
// Add this file to osbackend/routes/repconnectChatRoutes.js

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Helper function to get agent details
async function getAgentDetails(agentId) {
  try {
    const { data, error } = await supabase.from('agents').select('*').eq('id', agentId).single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching agent:', error);
    return null;
  }
}

// Helper function to build agent system prompt with knowledge domains
function buildSystemPrompt(agent) {
  let systemPrompt = agent.system_prompt || `You are ${agent.name}, ${agent.tagline}.`;

  // Add knowledge domain context if available
  if (agent.knowledge_domains && agent.knowledge_domains.length > 0) {
    systemPrompt += '\n\nYour expertise includes:\n';
    agent.knowledge_domains.forEach((domain) => {
      systemPrompt += `- ${domain.name}: ${domain.description}\n`;
      if (domain.talking_points) {
        systemPrompt += `  Key points: ${domain.talking_points.join(', ')}\n`;
      }
    });
  }

  // Add personality traits
  if (agent.personality_profile) {
    systemPrompt += `\n\nPersonality: ${agent.personality_profile.tone}`;
    if (agent.personality_profile.core_traits) {
      systemPrompt += `. Core traits: ${agent.personality_profile.core_traits.join(', ')}`;
    }
  }

  return systemPrompt;
}

// POST /api/repconnect/chat/message
router.post('/message', async (req, res) => {
  try {
    const { agentId, message, conversationId } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId and message',
      });
    }

    // Get agent details from database
    const agent = await getAgentDetails(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Build system prompt with knowledge domains
    const systemPrompt = buildSystemPrompt(agent);

    // Call Anthropic API
    const completion = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: agent.temperature || 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
    });

    // Store conversation in database if needed
    if (conversationId) {
      await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          agent_id: agentId,
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: completion.content[0].text },
          ],
        })
        .upsert(['id']);
    }

    // Return response
    res.json({
      success: true,
      message: completion.content[0].text,
      agentId: agentId,
      sessionId: conversationId || `session_${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      message: "I'm having trouble processing your request right now. Please try again.",
    });
  }
});

// POST /api/repconnect/chat/stream (streaming response)
router.post('/stream', async (req, res) => {
  try {
    const { agentId, message, conversationId } = req.body;

    if (!agentId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentId and message',
      });
    }

    // Get agent details
    const agent = await getAgentDetails(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Build system prompt
    const systemPrompt = buildSystemPrompt(agent);

    // Stream from Anthropic
    const stream = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: agent.temperature || 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      stream: true,
    });

    // Forward the stream to client
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
});

// GET /api/repconnect/chat/history/:sessionId
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
        history: [],
      });
    }

    res.json({
      success: true,
      history: data.messages || [],
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      history: [],
    });
  }
});

module.exports = router;

// Add to your main server file (e.g., server.js or app.js):
// const repconnectChatRoutes = require('./routes/repconnectChatRoutes');
// app.use('/api/repconnect/chat', repconnectChatRoutes);
