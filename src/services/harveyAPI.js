// Harvey Coach Production API
// This file provides the main integration points for Harvey in your application

import harveyCoach from './harveyCoach.js';
import harveyCallMonitor from './harveyCallMonitor.js';
import { getHarveyResponse } from './harveyPersonality.js';

class HarveyAPI {
  constructor() {
    this.initialized = false;
    this.activeReps = new Map();
  }

  // Initialize Harvey for your entire sales team
  async initializeTeam(reps) {
        
    for (const rep of reps) {
      await this.addRep(rep);
    }
    
    this.initialized = true;
        return { success: true, repsInitialized: reps.length };
  }

  // Add a single rep to Harvey's coaching
  async addRep({ id, name, phone, email }) {
    const result = await harveyCoach.initializeRep(id, name);
    
    // Start monitoring
    await harveyCallMonitor.startMonitoring(id, name);
    
    // Store rep info for quick access
    this.activeReps.set(id, { id, name, phone, email });
    
    return result;
  }

  // Remove a rep from Harvey's coaching
  async removeRep(repId) {
    await harveyCallMonitor.stopMonitoring(repId);
    this.activeReps.delete(repId);
    return { success: true, message: 'Rep removed from Harvey coaching' };
  }

  // Trigger immediate coaching intervention
  async intervene(repId, reason, severity = 'medium') {
    const rep = this.activeReps.get(repId);
    if (!rep) {
      throw new Error('Rep not found in Harvey system');
    }

    // Determine coaching mode based on reason
    let mode = 'post_call_critic';
    let category = 'criticism';
    let subcategory = 'constructive';

    if (reason.includes('morning') || reason.includes('slow start')) {
      mode = 'morning_motivator';
      category = 'motivation';
      subcategory = 'aggressive';
    } else if (reason.includes('close') || reason.includes('deal')) {
      mode = 'closer';
      category = 'closing';
      subcategory = 'assumptive';
    }

    const message = getHarveyResponse(
      { category, subcategory },
      { harveyScore: 50 },
      reason,
      rep.name
    );

    return await harveyCoach.deliverCoaching(repId, {
      mode,
      message,
      severity,
      actionRequired: true
    });
  }

  // Get real-time stats for a rep
  async getRepStats(repId) {
    const dailyStats = await harveyCoach.getRepDailyStats(repId);
    const performance = await harveyCoach.calculatePerformance(repId);
    
    return {
      daily: dailyStats,
      performance,
      harveyScore: performance.harveyScore,
      rank: performance.rank
    };
  }

  // Get team leaderboard
  async getLeaderboard() {
    return await harveyCoach.updateLeaderboard();
  }

  // Create a challenge for a rep
  async createChallenge(repId) {
    return await harveyCoach.createDailyChallenge(repId);
  }

  // Analyze a call and get Harvey's feedback
  async analyzeCall({ repId, callId, duration, outcome, transcript }) {
    const analysis = await harveyCoach.analyzeTranscript(transcript);
    const critique = harveyCoach.generateCallCritique(analysis);
    
    // Store the analysis
    await harveyCoach.storeCallAnalysis(repId, callId, analysis, critique);
    
    // Deliver coaching if needed
    if (analysis.weaknessCount > 2 || outcome === 'no_decision') {
      await this.intervene(repId, 'poor call performance', 'high');
    }
    
    return { analysis, critique };
  }

  // Get Harvey's wisdom for specific situations
  getWisdom(situation) {
    return harveyCoach.getHarveyWisdom(situation);
  }

  // Check if Harvey is operational
  async healthCheck() {
    return {
      status: 'operational',
      initialized: this.initialized,
      activeReps: this.activeReps.size,
      personality: 'Maximum Harvey',
      quote: "I don't play the odds, I play the man."
    };
  }
}

// Create singleton instance
const harveyAPI = new HarveyAPI();

// Auto-initialize if reps are available
export async function autoInitialize() {
  try {
    const { supabase } = await import('../lib/supabase.js');
    
    // Get all active sales reps
    const { data: reps, error } = await supabase
      .from('users')
      .select('id, name, phone, email')
      .eq('role', 'sales_rep')
      .eq('active', true);
    
    if (!error && reps && reps.length > 0) {
      await harveyAPI.initializeTeam(reps);
    }
  } catch (error) {
      }
}

export default harveyAPI;

// Export convenience methods
export const {
  initializeTeam,
  addRep,
  removeRep,
  intervene,
  getRepStats,
  getLeaderboard,
  createChallenge,
  analyzeCall,
  getWisdom,
  healthCheck
} = harveyAPI;