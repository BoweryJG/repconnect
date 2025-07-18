import express from 'express';
import harveyCoach from '../services/harveyCoach.js';
import OpenAI from 'openai';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize OpenAI for chat functionality
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Harvey for a sales rep
router.post('/harvey/initialize', requireAuth, async (req, res) => {
  try {
    const { repId, repName } = req.body;

    if (!repId || !repName) {
      return res.status(400).json({ error: 'Missing repId or repName' });
    }

    const result = await harveyCoach.initializeRep(repId, repName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize Harvey' });
  }
});

// Trigger coaching intervention
router.post('/harvey/intervention', requireAuth, async (req, res) => {
  try {
    const { repId, trigger, context } = req.body;

    const coaching = await harveyCoach.deliverCoaching(repId, {
      mode: trigger,
      message: context.message,
      severity: context.severity || 'medium',
      actionRequired: context.actionRequired || false,
    });

    res.json({ success: true, coaching });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger intervention' });
  }
});

// Get rep performance data
router.get('/harvey/performance/:repId', requireAuth, async (req, res) => {
  try {
    const { repId } = req.params;

    const performance = await harveyCoach.loadRepPerformance(repId);
    const dailyStats = await harveyCoach.getRepDailyStats(repId);

    res.json({
      performance,
      dailyStats,
      harveyScore: performance.harveyScore || 50,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get performance data' });
  }
});

// Create daily challenge
router.post('/harvey/challenge', requireAuth, async (req, res) => {
  try {
    const { repId } = req.body;

    const challenge = await harveyCoach.createDailyChallenge(repId);
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Get leaderboard
router.get('/harvey/leaderboard', requireAuth, async (req, res) => {
  try {
    const leaderboard = await harveyCoach.updateLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Analyze call (webhook from call system)
router.post('/harvey/analyze-call', requireAuth, async (req, res) => {
  try {
    const { repId, callId, duration, outcome, transcript } = req.body;

    await harveyCoach.analyzeCallPerformance({
      repId,
      callId,
      duration,
      outcome,
      transcript,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze call' });
  }
});

// Activate live demo mode
router.post('/harvey/demo-mode', requireAuth, async (req, res) => {
  try {
    const { repId, callId } = req.body;

    const demoSession = await harveyCoach.activateLiveDemoMode(repId, callId);
    res.json(demoSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate demo mode' });
  }
});

// Check research quality (integration with Canvas)
router.post('/harvey/check-research', requireAuth, async (req, res) => {
  try {
    const { repId, researchData } = req.body;

    const isQuality = await harveyCoach.checkResearchQuality(repId, researchData);
    res.json({ qualityApproved: isQuality });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check research quality' });
  }
});

// Harvey chat endpoint for agent conversations
router.post('/harvey/chat', requireAuth, async (req, res) => {
  try {
    const { message, agentId, sessionId, context = [] } = req.body;

    if (!message || !agentId) {
      return res.status(400).json({ error: 'Missing message or agentId' });
    }

    // Get agent personality from harveyPersonality service
    const agentConfig = await import('../services/harveyPersonality.js').then(
      (m) => m.default.personalities[agentId]
    );

    if (!agentConfig) {
      return res.status(400).json({ error: 'Invalid agentId' });
    }

    // Build conversation context with agent personality
    const systemPrompt = `You are ${agentConfig.name}, ${agentConfig.description}. 
    Your communication style: ${agentConfig.style}
    Your expertise: ${agentConfig.expertise.join(', ')}
    Your catchphrases: ${agentConfig.catchphrases.join(', ')}
    
    Stay in character and provide helpful, concise responses focused on your area of expertise.`;

    // Create messages array for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...context,
      { role: 'user', content: message },
    ];

    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.8,
      max_tokens: 300,
    });

    const response = completion.choices[0].message.content;

    res.json({
      response,
      agentId,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Harvey chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

export default router;
