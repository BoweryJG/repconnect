import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Mock data for Harvey multi-agent system
const mockMetrics = {
  reputationPoints: 1250,
  currentStreak: 5,
  totalCalls: 48,
  closingRate: 0.42,
  harveyStatus: 'closer',
  dailyVerdict: null,
  activeTrials: [],
};

const mockLeaderboard = [
  { id: 'user-1', name: 'Top Closer', points: 2500, status: 'legend', rank: 1 },
  { id: 'user-2', name: 'Rising Star', points: 1800, status: 'partner', rank: 2 },
  { id: 'user-3', name: 'Deal Maker', points: 1250, status: 'closer', rank: 3 },
  { id: 'user-4', name: 'Rookie', points: 500, status: 'rookie', rank: 4 },
];

// Harvey metrics endpoint
router.get('/harvey/metrics', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id; // Use authenticated user from middleware

    // In production, fetch from database
    const metrics = { ...mockMetrics };

    // Find user's position in leaderboard
    const userRank = mockLeaderboard.findIndex((entry) => entry.id === userId) + 1;
    if (userRank > 0) {
      metrics.leaderboardRank = userRank;
    }

    res.json({
      metrics,
      leaderboard: mockLeaderboard,
    });
  } catch (error) {
    // Error fetching Harvey metrics
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Daily verdict endpoint
router.get('/harvey/verdict', requireAuth, async (req, res) => {
  try {
    const _userId = req.user.id; // Use authenticated user from middleware

    const verdicts = [
      {
        rating: 7,
        message: "Not bad, but I've seen better. Step it up tomorrow.",
        tone: 'challenging',
      },
      {
        rating: 8,
        message: "Solid performance. You're starting to think like a closer.",
        tone: 'approving',
      },
      {
        rating: 5,
        message: 'That was painful to watch. We need to talk about your approach.',
        tone: 'harsh',
      },
      {
        rating: 9,
        message: "Now THAT'S how you close deals. Keep this energy.",
        tone: 'impressed',
      },
    ];

    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    verdict.timestamp = new Date();

    res.json(verdict);
  } catch (error) {
    // Error getting Harvey verdict
    res.status(500).json({ error: 'Failed to get verdict' });
  }
});

// Voice command endpoint
router.post('/harvey/voice-command', requireAuth, async (req, res) => {
  try {
    const { command } = req.body;
    const _userId = req.user.id; // Use authenticated user from middleware

    // Simple command processing
    const responses = {
      status: "You're at 1250 reputation points. Not terrible, but you can do better.",
      help: "I don't do handholding. Figure it out or fail trying.",
      motivation: "You want motivation? Close more deals. That's your motivation.",
      default: "I don't have time for unclear requests. Be specific.",
    };

    let response = responses.default;

    // Check for keywords
    if (command.toLowerCase().includes('status')) {
      response = responses.status;
    } else if (command.toLowerCase().includes('help')) {
      response = responses.help;
    } else if (command.toLowerCase().includes('motivat')) {
      response = responses.motivation;
    }

    res.json({
      response,
      action: null,
    });
  } catch (error) {
    // Error processing voice command
    res.status(500).json({ error: 'Failed to process command' });
  }
});

// Hot leads endpoint
router.get('/harvey/leads/hot', requireAuth, async (req, res) => {
  try {
    const hotLeads = [
      {
        id: 'lead-1',
        company: 'TechCorp Solutions',
        industry: 'Technology',
        size: '500-1000',
        readyScore: 85,
        multiplier: 2.5,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
      },
      {
        id: 'lead-2',
        company: 'Global Manufacturing Inc',
        industry: 'Manufacturing',
        size: '1000+',
        readyScore: 92,
        multiplier: 3.0,
        expiresAt: new Date(Date.now() + 1800000), // 30 mins
      },
    ];

    res.json(hotLeads);
  } catch (error) {
    // Error fetching hot leads
    res.status(500).json({ error: 'Failed to fetch hot leads' });
  }
});

// Claim lead endpoint
router.post('/harvey/leads/:leadId/claim', requireAuth, async (req, res) => {
  try {
    const { leadId: _leadId } = req.params;
    const _userId = req.user.id; // Use authenticated user from middleware

    res.json({
      success: true,
      message: "Lead claimed. Now close it or I'll give it to someone who can.",
    });
  } catch (error) {
    // Error claiming lead
    res.status(500).json({ error: 'Failed to claim lead' });
  }
});

// Active trials endpoint
router.get('/harvey/trials/active', requireAuth, async (req, res) => {
  try {
    const trials = [
      {
        id: 'trial-1',
        name: 'Cold Call Champion',
        description: 'Make 20 cold calls in 2 hours',
        difficulty: 'MEDIUM',
        participants: 5,
        startTime: new Date(),
        endTime: new Date(Date.now() + 7200000), // 2 hours
        rewards: {
          reputation: 500,
          unlock: 'Speed Dialer Badge',
        },
      },
    ];

    res.json(trials);
  } catch (error) {
    // Error fetching trials
    res.status(500).json({ error: 'Failed to fetch trials' });
  }
});

// Join trial endpoint
router.post('/harvey/trials/:trialId/join', requireAuth, async (req, res) => {
  try {
    const { trialId: _trialId } = req.params;

    res.json({
      success: true,
      message: "You're in. Don't embarrass yourself.",
    });
  } catch (error) {
    // Error joining trial
    res.status(500).json({ error: 'Failed to join trial' });
  }
});

// Coaching mode endpoint
router.put('/harvey/coaching/mode', requireAuth, async (req, res) => {
  try {
    const { mode } = req.body;

    res.json({
      success: true,
      message: `Coaching mode set to ${mode}. ${mode === 'brutal' ? 'You asked for it.' : 'Your choice.'}`,
    });
  } catch (error) {
    // Error updating coaching mode
    res.status(500).json({ error: 'Failed to update coaching mode' });
  }
});

// Harvey modes endpoint
router.put('/harvey/modes', requireAuth, async (req, res) => {
  try {
    const _modes = req.body;

    res.json({
      success: true,
      message: "Modes updated. Let's see if you can handle it.",
    });
  } catch (error) {
    // Error updating modes
    res.status(500).json({ error: 'Failed to update modes' });
  }
});

// Coaching history endpoint
router.get('/harvey/coaching/history', requireAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const history = [
      {
        id: 'coach-1',
        timestamp: new Date(Date.now() - 3600000),
        type: 'call_feedback',
        message: 'You talked too much. Next time, let them speak.',
        severity: 'medium',
      },
      {
        id: 'coach-2',
        timestamp: new Date(Date.now() - 7200000),
        type: 'missed_opportunity',
        message: 'You had them at "budget approved" and still fumbled. Unbelievable.',
        severity: 'high',
      },
    ];

    res.json(history.slice(0, limit));
  } catch (error) {
    // Error fetching coaching history
    res.status(500).json({ error: 'Failed to fetch coaching history' });
  }
});

// Call analysis endpoint
router.post('/harvey/calls/analyze', requireAuth, async (req, res) => {
  try {
    const {
      callId: _callId,
      duration: _duration,
      outcome: _outcome,
      voiceMetrics: _voiceMetrics,
    } = req.body;

    // In production, analyze the call and update metrics
    res.json({
      success: true,
      analysis: {
        score: 75,
        feedback: 'Decent close, but you hesitated on pricing. Own your value.',
      },
    });
  } catch (error) {
    // Error analyzing call
    res.status(500).json({ error: 'Failed to analyze call' });
  }
});

// Intervention endpoint
router.post('/harvey/intervention', requireAuth, async (req, res) => {
  try {
    const { reason: _reason } = req.body;

    res.json({
      success: true,
      message: "I'm watching. Don't make me step in again.",
    });
  } catch (error) {
    // Error requesting intervention
    res.status(500).json({ error: 'Failed to request intervention' });
  }
});

// Challenge Harvey endpoint
router.post('/harvey/challenge', requireAuth, async (req, res) => {
  try {
    const { type: _type } = req.body;

    res.json({
      accepted: true,
      message: "You think you're ready? Prove it. Game on.",
    });
  } catch (error) {
    // Error challenging Harvey
    res.status(500).json({ error: 'Failed to challenge Harvey' });
  }
});

export default router;
