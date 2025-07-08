import express from 'express';
import harveyCoach from '../services/harveyCoach.js';

const router = express.Router();

// Initialize Harvey for a sales rep
router.post('/harvey/initialize', async (req, res) => {
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
router.post('/harvey/intervention', async (req, res) => {
  try {
    const { repId, trigger, context } = req.body;
    
    const coaching = await harveyCoach.deliverCoaching(repId, {
      mode: trigger,
      message: context.message,
      severity: context.severity || 'medium',
      actionRequired: context.actionRequired || false
    });
    
    res.json({ success: true, coaching });
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger intervention' });
  }
});

// Get rep performance data
router.get('/harvey/performance/:repId', async (req, res) => {
  try {
    const { repId } = req.params;
    
    const performance = await harveyCoach.loadRepPerformance(repId);
    const dailyStats = await harveyCoach.getRepDailyStats(repId);
    
    res.json({
      performance,
      dailyStats,
      harveyScore: performance.harveyScore || 50
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get performance data' });
  }
});

// Create daily challenge
router.post('/harvey/challenge', async (req, res) => {
  try {
    const { repId } = req.body;
    
    const challenge = await harveyCoach.createDailyChallenge(repId);
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Get leaderboard
router.get('/harvey/leaderboard', async (req, res) => {
  try {
    const leaderboard = await harveyCoach.updateLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Analyze call (webhook from call system)
router.post('/harvey/analyze-call', async (req, res) => {
  try {
    const { repId, callId, duration, outcome, transcript } = req.body;
    
    await harveyCoach.analyzeCallPerformance({
      repId,
      callId,
      duration,
      outcome,
      transcript
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze call' });
  }
});

// Activate live demo mode
router.post('/harvey/demo-mode', async (req, res) => {
  try {
    const { repId, callId } = req.body;
    
    const demoSession = await harveyCoach.activateLiveDemoMode(repId, callId);
    res.json(demoSession);
  } catch (error) {
    res.status(500).json({ error: 'Failed to activate demo mode' });
  }
});

// Check research quality (integration with Canvas)
router.post('/harvey/check-research', async (req, res) => {
  try {
    const { repId, researchData } = req.body;
    
    const isQuality = await harveyCoach.checkResearchQuality(repId, researchData);
    res.json({ qualityApproved: isQuality });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check research quality' });
  }
});

export default router;