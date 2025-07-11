import { supabase } from '../lib/supabase';

export interface InstantCoachingSession {
  id: string;
  rep_id: string;
  coach_id: string;
  session_type: string;
  procedure_category: string;
  webrtc_room_id: string;
  connection_status: string;
  session_goals: string[];
  notes?: string;
  recording_url?: string;
  started_at?: string;
  ended_at?: string;
  duration_seconds?: number;
}

export interface CoachingScenario {
  customer_profile: any;
  initial_objections: string[];
  desired_outcome: string;
  key_points_to_cover: string[];
  difficulty_level: number;
}

export class InstantCoachingService {
  /**
   * Get available coaches for a specific procedure
   */
  static async getAvailableCoaches(procedureCategory: string) {
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

    if (error) throw error;
    return data || [];
  }

  /**
   * Start an instant coaching session using backend API
   */
  static async startSession(
    repId: string,
    coachId: string,
    procedureCategory: string,
    sessionType: string = 'practice_pitch'
  ): Promise<InstantCoachingSession> {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/coaching/start-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          repId,
          coachId,
          procedureCategory,
          sessionType,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start coaching session');
    }

    const data = await response.json();
    return data.session;
  }

  /**
   * Connect to an existing session
   */
  static async connectToSession(sessionId: string) {
    const { data, error } = await supabase
      .from('instant_coaching_sessions')
      .update({
        connection_status: 'connected',
        started_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * End a coaching session
   */
  static async endSession(sessionId: string, notes?: string) {
    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('instant_coaching_sessions')
      .select('*, coach_id, started_at')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

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

    if (updateError) throw updateError;

    // Free up coach
    const { error: availabilityError } = await supabase
      .from('coach_availability')
      .update({
        is_available: true,
        current_session_id: null,
        last_session_end: new Date().toISOString(),
      })
      .eq('coach_id', session.coach_id);

    if (availabilityError) throw availabilityError;
  }

  /**
   * Get practice scenarios for a procedure
   */
  static async getPracticeScenarios(procedureCategory: string): Promise<CoachingScenario[]> {
    const { data, error } = await supabase
      .from('practice_scenarios')
      .select('*')
      .eq('procedure_category', procedureCategory)
      .order('difficulty_level', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Update session status
   */
  private static async updateSessionStatus(sessionId: string, status: string) {
    const { error } = await supabase
      .from('instant_coaching_sessions')
      .update({ connection_status: status })
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Get default goals based on session type
   */
  private static getDefaultGoals(sessionType: string): string[] {
    const goals: Record<string, string[]> = {
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

  /**
   * Get coach response based on context
   */
  static async getCoachResponse(
    coachId: string,
    userMessage: string,
    context: {
      procedureCategory: string;
      sessionType: string;
      previousMessages?: any[];
    }
  ) {
    // This would integrate with your AI backend
    // For now, returning a placeholder
    return {
      message: "I'll help you practice that. Let's start with...",
      suggestions: [
        'Tell me about your experience with this procedure',
        'What objections do you commonly face?',
      ],
      resources: [],
    };
  }
}
