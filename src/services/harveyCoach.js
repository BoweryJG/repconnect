import WebSocket from 'ws';
import axios from 'axios';
import { Buffer } from 'buffer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Harvey Coach Service - AI Sales Coach inspired by Harvey Specter
class HarveyCoach {
  constructor() {
    this.moshiUrl = process.env.MOSHI_API_URL || 'wss://api.piapi.ai/moshi/v1/stream';
    this.moshiApiKey = process.env.MOSHI_API_KEY;
    this.connections = new Map();
    this.repPerformance = new Map();
    this.activeCoachingSessions = new Map();
    this.personality = 'harvey_specter';
    
    // Harvey's coaching modes
    this.coachingModes = {
      MORNING_MOTIVATOR: 'morning_motivator',
      POST_CALL_CRITIC: 'post_call_critic', 
      LIVE_DEMO_MASTER: 'live_demo_master',
      PERFORMANCE_REVIEWER: 'performance_reviewer',
      CLOSER: 'closer'
    };

    // Performance thresholds that trigger Harvey
    this.triggers = {
      lowActivity: { threshold: 5, timeBy: '10:00' },
      poorCloseRate: { threshold: 0.2 },
      missedOpportunities: { threshold: 3 },
      longCallNoClose: { threshold: 600 }, // 10 minutes
      noResearchBeforeCall: true
    };
  }

  // Initialize Harvey for a sales rep
  async initializeRep(repId, repName) {
    console.log(`🎯 Harvey is now monitoring ${repName}`);
    
    // Load rep's performance history
    const performance = await this.loadRepPerformance(repId);
    this.repPerformance.set(repId, performance);
    
    // Start monitoring their activity
    this.startActivityMonitoring(repId);
    
    // Morning check-in
    const now = new Date();
    if (now.getHours() < 10) {
      setTimeout(() => {
        this.triggerMorningMotivation(repId, repName);
      }, 5000);
    }
    
    return {
      status: 'initialized',
      currentScore: performance.harveyScore || 50,
      message: `Harvey is watching, ${repName}. Don't disappoint me.`
    };
  }

  // Connect to Moshi for voice interactions
  async connectToMoshi(sessionId) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.moshiUrl, {
        headers: {
          'Authorization': `Bearer ${this.moshiApiKey}`,
          'X-Session-ID': sessionId,
          'X-Voice-Profile': 'harvey_specter'
        }
      });

      const connection = {
        ws,
        sessionId,
        isActive: false
      };

      ws.on('open', () => {
        console.log(`Harvey voice channel open for session ${sessionId}`);
        
        // Configure Harvey's voice
        ws.send(JSON.stringify({
          type: 'config',
          config: {
            voice: {
              style: 'confident',
              speed: 1.1,
              pitch: 0.95,
              emphasis: 'strong'
            },
            personality: {
              assertiveness: 0.9,
              humor: 0.7,
              directness: 1.0
            }
          }
        }));

        connection.isActive = true;
        this.connections.set(sessionId, connection);
        resolve(connection);
      });

      ws.on('error', (error) => {
        console.error('Harvey voice connection error:', error);
        reject(error);
      });

      ws.on('close', () => {
        console.log('Harvey voice connection closed');
        this.connections.delete(sessionId);
      });
    });
  }

  // Harvey's Morning Motivation
  async triggerMorningMotivation(repId, repName) {
    const performance = this.repPerformance.get(repId);
    const callsToday = await this.getCallsToday(repId);
    
    let message;
    if (callsToday.count < 2) {
      message = `${repName}, it's 10 AM and you've made ${callsToday.count} calls. At this rate, you'll hit your quota... never. Get on the phone now, or I'm calling your manager.`;
    } else if (performance.closeRate < 0.25) {
      message = `${repName}, your close rate is ${Math.round(performance.closeRate * 100)}%. That's not a slump, that's a career change. Time to step up or step out.`;
    } else {
      message = `Not bad, ${repName}. ${callsToday.count} calls before 10. But 'not bad' doesn't win. Excellence does. Show me excellence today.`;
    }

    await this.deliverCoaching(repId, {
      mode: this.coachingModes.MORNING_MOTIVATOR,
      message,
      severity: 'high',
      actionRequired: true
    });
  }

  // Analyze call performance in real-time
  async analyzeCallPerformance(callData) {
    const { repId, callId, duration, outcome, transcript } = callData;
    
    // Quick analysis of what went wrong/right
    const analysis = await this.analyzeTranscript(transcript);
    
    if (outcome === 'no_decision' || outcome === 'unsuccessful') {
      // Harvey intervenes immediately
      const critique = this.generateCallCritique(analysis);
      
      await this.deliverCoaching(repId, {
        mode: this.coachingModes.POST_CALL_CRITIC,
        message: critique.message,
        severity: 'immediate',
        actionRequired: true,
        suggestions: critique.suggestions
      });
    } else if (outcome === 'successful') {
      // Even success gets coached
      const feedback = this.generateSuccessFeedback(analysis);
      
      await this.deliverCoaching(repId, {
        mode: this.coachingModes.CLOSER,
        message: feedback.message,
        severity: 'medium',
        actionRequired: false
      });
    }
  }

  // Generate Harvey's critique
  generateCallCritique(analysis) {
    const critiques = {
      weak_opening: {
        message: "Did you just ask 'Is this a good time?' That's not an opening, that's an apology. Start with value or don't start at all.",
        suggestions: ["Lead with: 'I've got something that will save you 30% on supplies. Got 2 minutes?'"]
      },
      no_pain_discovery: {
        message: "You talked for 10 minutes and never found their pain point. You're not a presenter, you're a problem solver. Find the problem!",
        suggestions: ["Ask: 'What's your biggest challenge with your current supplier?'", "Then shut up and listen."]
      },
      weak_close: {
        message: "You said 'Let me know if you're interested.' That's not closing, that's hoping. Assume the sale or go home.",
        suggestions: ["Close with: 'I'll send the contract now. We can start saving you money next week.'"]
      },
      accepted_objection: {
        message: "They said they're happy with their supplier and you gave up? That's when the sale begins, not ends.",
        suggestions: ["Response: 'Great suppliers deserve competition. Let me be your backup option.'"]
      }
    };

    // Pick the most relevant critique
    const relevantCritique = analysis.weakestPoint || 'weak_opening';
    return critiques[relevantCritique] || critiques.weak_opening;
  }

  // Generate success feedback (Harvey style)
  generateSuccessFeedback(analysis) {
    return {
      message: "Not bad. You actually listened before pitching. But you left money on the table - they were ready for the premium package. Next time, assume bigger.",
      suggestions: ["Always present the premium option first", "They'll tell you if they want less"]
    };
  }

  // Deliver coaching through multiple channels
  async deliverCoaching(repId, coaching) {
    const sessionId = `harvey-${repId}-${Date.now()}`;
    
    // Record coaching session
    const coachingSession = await this.recordCoachingSession(repId, coaching);
    
    // Deliver based on severity
    switch (coaching.severity) {
      case 'immediate':
        // Voice call via Moshi
        await this.deliverVoiceCoaching(sessionId, coaching);
        break;
      case 'high':
        // SMS + Push notification
        await this.deliverSMSCoaching(repId, coaching);
        break;
      case 'medium':
        // In-app notification
        await this.deliverInAppCoaching(repId, coaching);
        break;
    }
    
    // Update rep's Harvey score
    await this.updateHarveyScore(repId, coaching);
  }

  // Voice coaching via Moshi
  async deliverVoiceCoaching(sessionId, coaching) {
    try {
      const connection = await this.connectToMoshi(sessionId);
      
      // Send Harvey's message
      connection.ws.send(JSON.stringify({
        type: 'speak',
        text: coaching.message,
        emotion: 'assertive',
        urgency: 'high'
      }));
      
      // If suggestions, deliver them too
      if (coaching.suggestions) {
        for (const suggestion of coaching.suggestions) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          connection.ws.send(JSON.stringify({
            type: 'speak',
            text: suggestion,
            emotion: 'instructive'
          }));
        }
      }
      
      // Close with Harvey's signature
      setTimeout(() => {
        connection.ws.send(JSON.stringify({
          type: 'speak',
          text: "That's how winners do it. Now show me you're a winner.",
          emotion: 'confident'
        }));
      }, 5000);
      
    } catch (error) {
      console.error('Voice coaching failed:', error);
      // Fallback to SMS
      await this.deliverSMSCoaching(sessionId.split('-')[1], coaching);
    }
  }

  // Monitor rep activity in real-time
  async startActivityMonitoring(repId) {
    // Check every 30 minutes
    setInterval(async () => {
      const stats = await this.getRepDailyStats(repId);
      const performance = this.repPerformance.get(repId);
      
      // Low activity trigger
      const now = new Date();
      if (now.getHours() === 14 && stats.callsToday < 10) {
        await this.deliverCoaching(repId, {
          mode: this.coachingModes.PERFORMANCE_REVIEWER,
          message: `10 calls by 2 PM? Your competition made 20. You're not losing, you're not even playing.`,
          severity: 'high',
          actionRequired: true
        });
      }
      
      // Check close rate
      if (stats.opportunitiesToday > 5 && stats.closedToday === 0) {
        await this.deliverCoaching(repId, {
          mode: this.coachingModes.POST_CALL_CRITIC,
          message: `5 opportunities, 0 closes. Either you're saving them all for tomorrow, or you need my help. Call me. Now.`,
          severity: 'immediate',
          actionRequired: true
        });
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  // Challenge system
  async createDailyChallenge(repId) {
    const challenges = [
      {
        title: "The Closer Challenge",
        goal: "Close 3 deals before lunch",
        reward: "Harvey's respect (worth more than any commission)",
        penalty: "I'm calling your biggest competitor and telling them you're available"
      },
      {
        title: "The Research Master",
        goal: "Use Canvas AI on every call today",
        reward: "Feature on the Harvey Hall of Fame",
        penalty: "Mandatory weekend training on 'How to Google'"
      },
      {
        title: "The Objection Destroyer", 
        goal: "Convert 3 'happy with current supplier' objections",
        reward: "Your name on the leaderboard in gold",
        penalty: "Everyone sees your worst call recording"
      }
    ];
    
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    await supabase.from('harvey_daily_challenges').insert({
      rep_id: repId,
      challenge: challenge,
      status: 'active',
      created_at: new Date().toISOString()
    });
    
    return challenge;
  }

  // Live demo mode - Harvey takes over
  async activateLiveDemoMode(repId, callId) {
    const sessionId = `demo-${callId}`;
    
    await this.deliverCoaching(repId, {
      mode: this.coachingModes.LIVE_DEMO_MASTER,
      message: "Step aside, rookie. Watch how a closer works. Take notes.",
      severity: 'immediate',
      actionRequired: false
    });
    
    // In production, this would actually conference into the call
    // For now, we'll provide a script
    const demoScript = this.generateDemoScript();
    
    return {
      mode: 'live_demo',
      script: demoScript,
      tips: [
        "Notice how I didn't ask permission",
        "I assumed they needed us",
        "Every objection is an opportunity"
      ]
    };
  }

  // Generate demo script
  generateDemoScript() {
    return {
      opening: "Dr. Smith? Harvey from MedTech. I'm calling because you're losing $50K a year on inefficient supplies. I've got 5 minutes to show you how to get that back. Ready?",
      discovery: "Tell me - what frustrates you most about your current supplier? Price? Delivery? Quality? All three? Thought so.",
      presentation: "Here's what my top performers are doing: [Solution]. They're saving 30% and getting better outcomes. You want the same results, right?",
      close: "I'm sending the agreement now. We'll have your first delivery upgraded by Friday. My assistant will call in an hour to confirm the details. Welcome to the winning team, Doctor."
    };
  }

  // Database operations
  async loadRepPerformance(repId) {
    const { data } = await supabase
      .from('rep_performance_metrics')
      .select('*')
      .eq('rep_id', repId)
      .order('metric_date', { ascending: false })
      .limit(1);
    
    return data?.[0] || {
      closeRate: 0,
      callsPerDay: 0,
      harveyScore: 50
    };
  }

  async recordCoachingSession(repId, coaching) {
    const { data } = await supabase
      .from('harvey_coaching_sessions')
      .insert({
        rep_id: repId,
        session_type: coaching.mode,
        trigger_reason: coaching.trigger || 'manual',
        harvey_message: coaching.message,
        outcome: 'delivered',
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    return data;
  }

  async updateHarveyScore(repId, coaching) {
    const performance = this.repPerformance.get(repId);
    let scoreChange = 0;
    
    // Adjust score based on coaching type and response
    if (coaching.mode === this.coachingModes.POST_CALL_CRITIC) {
      scoreChange = -5; // Lost points for needing correction
    } else if (coaching.mode === this.coachingModes.CLOSER) {
      scoreChange = 10; // Gained points for closing
    }
    
    const newScore = Math.max(0, Math.min(100, (performance.harveyScore || 50) + scoreChange));
    
    await supabase
      .from('rep_performance_metrics')
      .upsert({
        rep_id: repId,
        metric_date: new Date().toISOString().split('T')[0],
        harvey_score: newScore,
        updated_at: new Date().toISOString()
      });
    
    performance.harveyScore = newScore;
    this.repPerformance.set(repId, performance);
  }

  async getCallsToday(repId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, count } = await supabase
      .from('sales_activities')
      .select('*', { count: 'exact' })
      .eq('rep_id', repId)
      .eq('type', 'call')
      .gte('created_at', today);
    
    return { count: count || 0, calls: data || [] };
  }

  async getRepDailyStats(repId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: activities } = await supabase
      .from('sales_activities')
      .select('*')
      .eq('rep_id', repId)
      .gte('created_at', today);
    
    const calls = activities?.filter(a => a.type === 'call') || [];
    const opportunities = calls.filter(c => c.outcome === 'follow_up_required');
    const closed = calls.filter(c => c.outcome === 'successful');
    
    return {
      callsToday: calls.length,
      opportunitiesToday: opportunities.length,
      closedToday: closed.length,
      closeRate: calls.length > 0 ? closed.length / calls.length : 0
    };
  }

  async analyzeTranscript(transcript) {
    // In production, this would use AI to analyze
    // For now, simple pattern matching
    const analysis = {
      hasStrongOpening: !/is this a good time|sorry to bother/i.test(transcript),
      discoveredPain: /challenge|problem|frustrat|issue/i.test(transcript),
      handledObjections: /but|however|actually/i.test(transcript),
      attemptedClose: /send.*contract|get.*started|next.*step/i.test(transcript)
    };
    
    // Find weakest point
    if (!analysis.hasStrongOpening) analysis.weakestPoint = 'weak_opening';
    else if (!analysis.discoveredPain) analysis.weakestPoint = 'no_pain_discovery';
    else if (!analysis.attemptedClose) analysis.weakestPoint = 'weak_close';
    
    return analysis;
  }

  async deliverSMSCoaching(repId, coaching) {
    // Integration with Twilio would go here
    console.log(`SMS to ${repId}: ${coaching.message}`);
  }

  async deliverInAppCoaching(repId, coaching) {
    // Store in database for the CRM to display
    await supabase.from('harvey_notifications').insert({
      rep_id: repId,
      message: coaching.message,
      type: coaching.mode,
      read: false,
      created_at: new Date().toISOString()
    });
  }

  // Leaderboard management
  async updateLeaderboard() {
    const { data: reps } = await supabase
      .from('rep_performance_metrics')
      .select('*')
      .eq('metric_date', new Date().toISOString().split('T')[0])
      .order('harvey_score', { ascending: false });
    
    // Harvey's commentary on rankings
    const commentary = {
      first: "Currently dominating. Don't get comfortable.",
      last: "Dead last. Either catch up or find a new career.",
      middle: "Middle of the pack is for the mediocre. Choose a direction."
    };
    
    return reps?.map((rep, index) => ({
      ...rep,
      rank: index + 1,
      harveyComment: index === 0 ? commentary.first : 
                    index === reps.length - 1 ? commentary.last : 
                    commentary.middle
    }));
  }

  // Integration with Canvas AI
  async checkResearchQuality(repId, researchData) {
    if (!researchData || researchData.confidence < 0.7) {
      await this.deliverCoaching(repId, {
        mode: this.coachingModes.POST_CALL_CRITIC,
        message: "You're calling without proper research? That's not confidence, that's stupidity. Use Canvas AI or don't dial.",
        severity: 'high',
        actionRequired: true
      });
      return false;
    }
    return true;
  }
}

// Export singleton instance
const harveyCoach = new HarveyCoach();
export default harveyCoach;