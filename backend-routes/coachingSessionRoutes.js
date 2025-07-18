import express from 'express';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { databaseService, tables } from '../src/services/databaseService.js';
import { getSupabaseClient } from '../src/config/database.js';
import { requireAuth } from '../src/middleware/authMiddleware.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Get supabase client instance
let supabase;
(async () => {
  supabase = await getSupabaseClient();
})();

/**
 * Start a new coaching session
 */
router.post('/start-session', requireAuth, async (req, res) => {
  try {
    const { coachId, procedureCategory, sessionType = 'practice_pitch' } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user

    if (!coachId || !procedureCategory) {
      return res.status(400).json({
        error: 'Missing required fields: coachId, procedureCategory',
      });
    }

    // Get supabase client if not already initialized
    if (!supabase) {
      supabase = await getSupabaseClient();
    }

    // Check coach availability
    const { data: availability, error: availError } = await supabase
      .from('coach_availability')
      .select('is_available')
      .eq('coach_id', coachId)
      .single();

    if (availError || !availability?.is_available) {
      return res.status(409).json({
        error: 'Coach is not available for instant sessions',
      });
    }

    // Create unique room ID
    const roomId = `coach-${coachId}-rep-${userId}-${Date.now()}`;

    // Create session record
    const { data: session, error: sessionError } = await supabase
      .from('instant_coaching_sessions')
      .insert({
        rep_id: userId,
        coach_id: coachId,
        session_type: sessionType,
        procedure_category: procedureCategory,
        webrtc_room_id: roomId,
        connection_status: 'pending',
        session_goals: getDefaultGoals(sessionType),
      })
      .select()
      .single();

    if (sessionError) {
      logger.error('Error creating session:', sessionError);
      return res.status(500).json({ error: 'Failed to create coaching session' });
    }

    // Mark coach as busy
    const { error: busyError } = await supabase
      .from('coach_availability')
      .update({
        is_available: false,
        current_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('coach_id', coachId);

    if (busyError) {
      logger.error('Error updating coach availability:', busyError);
    }

    res.json({
      success: true,
      session: {
        ...session,
        roomId,
        webrtcConfig: {
          iceServers: getIceServers(),
        },
      },
    });
  } catch (error) {
    logger.error('Error starting coaching session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * End a coaching session
 */
router.post('/end-session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes, feedback } = req.body;
    const userId = req.user.id; // Get user ID from authenticated user

    // Get supabase client if not already initialized
    if (!supabase) {
      supabase = await getSupabaseClient();
    }

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('instant_coaching_sessions')
      .select('*, coach_id, started_at')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is authorized to end this session (either rep or coach)
    if (session.rep_id !== userId && session.coach_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to end this session' });
    }

    // Calculate duration
    const duration = session.started_at
      ? Math.floor((new Date().getTime() - new Date(session.started_at).getTime()) / 1000)
      : 0;

    // Update session
    const { error: updateError } = await supabase
      .from('instant_coaching_sessions')
      .update({
        connection_status: 'completed',
        ended_at: new Date().toISOString(),
        duration_seconds: duration,
        notes: notes,
      })
      .eq('id', sessionId);

    if (updateError) {
      logger.error('Error updating session:', updateError);
      return res.status(500).json({ error: 'Failed to end session' });
    }

    // Free up coach
    const { error: availError } = await supabase
      .from('coach_availability')
      .update({
        is_available: true,
        current_session_id: null,
        last_session_end: new Date().toISOString(),
      })
      .eq('coach_id', session.coach_id);

    if (availError) {
      logger.error('Error freeing coach:', availError);
    }

    // Save feedback if provided
    if (feedback) {
      const { error: feedbackError } = await supabase.from('coaching_feedback').insert({
        session_id: sessionId,
        rep_id: session.rep_id,
        created_by: userId,
        ...feedback,
      });

      if (feedbackError) {
        logger.error('Error saving feedback:', feedbackError);
      }
    }

    res.json({
      success: true,
      session: {
        id: sessionId,
        duration_seconds: duration,
        status: 'completed',
      },
    });
  } catch (error) {
    logger.error('Error ending coaching session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get available coaches for a procedure
 */
router.get('/available-coaches/:procedureCategory', requireAuth, async (req, res) => {
  try {
    const { procedureCategory } = req.params;

    // Get supabase client if not already initialized
    if (!supabase) {
      supabase = await getSupabaseClient();
    }

    const { data, error } = await supabase
      .from('coach_procedure_specializations')
      .select(
        `
        *,
        coach:sales_coach_agents(*),
        availability:coach_availability(*)
      `
      )
      .eq('procedure_category', procedureCategory)
      .eq('available_for_instant', true)
      .eq('availability.is_available', true);

    if (error) {
      logger.error('Error fetching coaches:', error);
      return res.status(500).json({ error: 'Failed to fetch available coaches' });
    }

    res.json({
      success: true,
      coaches: data || [],
    });
  } catch (error) {
    logger.error('Error in available coaches endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get practice scenarios for a procedure
 */
router.get('/practice-scenarios/:procedureCategory', requireAuth, async (req, res) => {
  try {
    const { procedureCategory } = req.params;
    const { difficulty } = req.query;

    // Get supabase client if not already initialized
    if (!supabase) {
      supabase = await getSupabaseClient();
    }

    let query = supabase
      .from('practice_scenarios')
      .select('*')
      .eq('procedure_category', procedureCategory);

    if (difficulty) {
      query = query.eq('difficulty_level', parseInt(difficulty));
    }

    const { data, error } = await query.order('difficulty_level', { ascending: true });

    if (error) {
      logger.error('Error fetching scenarios:', error);
      return res.status(500).json({ error: 'Failed to fetch practice scenarios' });
    }

    res.json({
      success: true,
      scenarios: data || [],
    });
  } catch (error) {
    logger.error('Error in practice scenarios endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get user's coaching sessions
 */
router.get('/my-sessions', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authenticated user
    const { limit = 10, offset = 0, status } = req.query;

    // Get supabase client if not already initialized
    if (!supabase) {
      supabase = await getSupabaseClient();
    }

    let query = supabase
      .from('instant_coaching_sessions')
      .select(
        `
        *,
        coach:sales_coach_agents(name, personality_type),
        rep:sales_reps(name)
      `
      )
      .or(`rep_id.eq.${userId},coach_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq('connection_status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching user sessions:', error);
      return res.status(500).json({ error: 'Failed to fetch sessions' });
    }

    res.json({
      success: true,
      sessions: data || [],
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: data ? data.length : 0,
      },
    });
  } catch (error) {
    logger.error('Error in user sessions endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get session status
 */
router.get('/session-status/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id; // Get user ID from authenticated user

    // Get supabase client if not already initialized
    if (!supabase) {
      supabase = await getSupabaseClient();
    }

    const { data, error } = await supabase
      .from('instant_coaching_sessions')
      .select(
        `
        *,
        coach:sales_coach_agents(name, personality_type),
        rep:sales_reps(name)
      `
      )
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if user is authorized to view this session (either rep or coach)
    if (data.rep_id !== userId && data.coach_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this session' });
    }

    res.json({
      success: true,
      session: data,
    });
  } catch (error) {
    logger.error('Error fetching session status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Helper functions
 */
function getDefaultGoals(sessionType) {
  const goals = {
    practice_pitch: [
      'Master product positioning',
      'Handle common objections',
      'Build confidence in presentation',
    ],
    objection_handling: [
      'Address price concerns effectively',
      'Counter competitor comparisons',
      'Turn objections into opportunities',
    ],
    product_qa: [
      'Deep dive into technical details',
      'Understand clinical evidence',
      'Learn differentiators',
    ],
    mock_consultation: [
      'Practice full patient journey',
      'Build rapport quickly',
      'Close with confidence',
    ],
  };

  return goals[sessionType] || ['Improve sales skills'];
}

function getIceServers() {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];

  // Add TURN servers if configured
  if (process.env.TURN_SERVER_URL) {
    iceServers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }

  return iceServers;
}

export default router;
