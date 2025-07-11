import harveyCoach from './harveyCoach.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Harvey Call Monitor - Watches all call activity and triggers coaching
class HarveyCallMonitor {
  constructor() {
    this.activeMonitors = new Map();
    this.callStartTimes = new Map();
  }

  // Start monitoring a sales rep
  startMonitoring(repId, repName) {
    // Initialize Harvey for this rep
    harveyCoach.initializeRep(repId, repName);

    // Set up real-time subscription for their activities
    const subscription = supabase
      .channel(`harvey-monitor-${repId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales_activities',
          filter: `rep_id=eq.${repId}`,
        },
        (payload) => this.handleActivityChange(repId, payload)
      )
      .subscribe();

    this.activeMonitors.set(repId, subscription);

    // Start periodic checks
    this.startPeriodicChecks(repId);
  }

  // Handle activity changes in real-time
  async handleActivityChange(repId, payload) {
    const { eventType, new: activity, old: oldActivity } = payload;

    if (eventType === 'INSERT' && activity.type === 'call') {
      // New call started
      await this.onCallStarted(repId, activity);
    } else if (eventType === 'UPDATE' && activity.type === 'call') {
      // Call updated (probably ended)
      await this.onCallEnded(repId, activity, oldActivity);
    }
  }

  // When a call starts
  async onCallStarted(repId, callData) {
    this.callStartTimes.set(callData.id, new Date());

    // Check if they did research before the call
    const hasResearch = await this.checkPreCallResearch(repId, callData.contact_id);

    if (!hasResearch) {
      // Harvey is not happy
      await harveyCoach.deliverCoaching(repId, {
        mode: 'post_call_critic',
        message:
          "You're dialing without research? That's not confidence, that's stupidity. Hang up, do your homework, then call back.",
        severity: 'high',
        actionRequired: true,
        trigger: 'no_research_before_call',
      });
    }
  }

  // When a call ends
  async onCallEnded(repId, callData, previousData) {
    const callDuration = callData.duration || 0;
    const outcome = callData.outcome;

    // Analyze based on outcome and duration
    if (outcome === 'unsuccessful' || outcome === 'no_decision') {
      // Failed call - immediate coaching
      await this.triggerPostCallCoaching(repId, callData, 'failed');
    } else if (outcome === 'successful') {
      // Success - but still coach for improvement
      await this.triggerPostCallCoaching(repId, callData, 'success');
    } else if (callDuration > 600 && outcome !== 'successful') {
      // Long call with no close
      await harveyCoach.deliverCoaching(repId, {
        mode: 'post_call_critic',
        message:
          "10 minutes and no close? You're not having a conversation, you're hosting a podcast. Get to the point or get off the phone.",
        severity: 'high',
        actionRequired: true,
        trigger: 'long_call_no_close',
      });
    }

    // Update call quality score
    await this.updateCallQualityScore(callData);
  }

  // Check if rep did research before calling
  async checkPreCallResearch(repId, contactId) {
    if (!contactId) return false;

    // Check if there's recent research activity in Canvas
    const { data: research } = await supabase
      .from('research_activities')
      .select('*')
      .eq('rep_id', repId)
      .eq('contact_id', contactId)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Last 30 mins
      .single();

    return !!research;
  }

  // Trigger post-call coaching based on performance
  async triggerPostCallCoaching(repId, callData, result) {
    // Get the transcript if available
    const transcript = callData.transcript || callData.notes || '';

    // Analyze the call
    await harveyCoach.analyzeCallPerformance({
      repId,
      callId: callData.id,
      duration: callData.duration,
      outcome: callData.outcome,
      transcript,
    });
  }

  // Update call quality score in database
  async updateCallQualityScore(callData) {
    const qualityFactors = {
      duration: this.scoreDuration(callData.duration),
      outcome: this.scoreOutcome(callData.outcome),
      notes: callData.notes ? 0.1 : 0, // Bonus for taking notes
    };

    const qualityScore =
      qualityFactors.duration * 0.3 + qualityFactors.outcome * 0.6 + qualityFactors.notes * 0.1;

    await supabase
      .from('sales_activities')
      .update({
        call_technique_score: qualityScore,
        harvey_monitored: true,
      })
      .eq('id', callData.id);
  }

  // Score call duration (optimal is 3-7 minutes)
  scoreDuration(seconds) {
    if (!seconds) return 0;
    const minutes = seconds / 60;

    if (minutes < 1) return 0.2; // Too short
    if (minutes >= 3 && minutes <= 7) return 1.0; // Optimal
    if (minutes > 7 && minutes <= 10) return 0.8; // Getting long
    if (minutes > 10) return 0.5; // Too long
    return 0.7; // Default
  }

  // Score call outcome
  scoreOutcome(outcome) {
    const scores = {
      successful: 1.0,
      follow_up_required: 0.7,
      no_decision: 0.3,
      unsuccessful: 0.1,
    };
    return scores[outcome] || 0.5;
  }

  // Periodic checks for activity levels
  startPeriodicChecks(repId) {
    // Check every hour
    setInterval(
      async () => {
        await this.checkHourlyActivity(repId);
      },
      60 * 60 * 1000
    );

    // Special checks at key times
    this.scheduleTimeBasedChecks(repId);
  }

  // Check hourly activity
  async checkHourlyActivity(repId) {
    const stats = await harveyCoach.getRepDailyStats(repId);
    const hour = new Date().getHours();

    // Morning check (10 AM)
    if (hour === 10 && stats.callsToday < 5) {
      await harveyCoach.triggerMorningMotivation(repId, 'Low morning activity');
    }

    // Lunch check (1 PM)
    if (hour === 13 && stats.callsToday < 10) {
      await harveyCoach.deliverCoaching(repId, {
        mode: 'performance_reviewer',
        message:
          "Half the day gone, half the calls made. That math doesn't work. Double your pace or double your resume.",
        severity: 'high',
        actionRequired: true,
        trigger: 'low_midday_activity',
      });
    }

    // End of day check (5 PM)
    if (hour === 17) {
      await this.endOfDayReview(repId, stats);
    }
  }

  // Schedule time-based checks
  scheduleTimeBasedChecks(repId) {
    const now = new Date();

    // Morning motivation (8:30 AM)
    const morning = new Date(now);
    morning.setHours(8, 30, 0, 0);
    if (morning > now) {
      setTimeout(() => {
        harveyCoach.triggerMorningMotivation(repId, 'Scheduled morning check');
      }, morning - now);
    }

    // Friday afternoon push (3 PM on Fridays)
    if (now.getDay() === 5) {
      // Friday
      const friday = new Date(now);
      friday.setHours(15, 0, 0, 0);
      if (friday > now) {
        setTimeout(async () => {
          await harveyCoach.deliverCoaching(repId, {
            mode: 'performance_reviewer',
            message:
              "It's Friday afternoon. Your competition is at happy hour. That's exactly why you're going to close 3 more deals.",
            severity: 'medium',
            actionRequired: false,
            trigger: 'friday_motivation',
          });
        }, friday - now);
      }
    }
  }

  // End of day performance review
  async endOfDayReview(repId, stats) {
    const performance = await harveyCoach.loadRepPerformance(repId);
    let message;

    if (stats.closedToday >= 3) {
      message = `${stats.closedToday} closes today. That's what I expect. Do it again tomorrow.`;
    } else if (stats.closedToday === 0) {
      message = `Zero closes? That's not a bad day, that's a waste of a day. Tomorrow, you close or you find a new mentor.`;
    } else {
      message = `${stats.closedToday} closes. Average. And average doesn't get you to the top. Tomorrow, be exceptional.`;
    }

    await harveyCoach.deliverCoaching(repId, {
      mode: 'performance_reviewer',
      message,
      severity: 'medium',
      actionRequired: false,
      trigger: 'end_of_day_review',
    });

    // Update daily performance metrics
    await this.updateDailyMetrics(repId, stats);
  }

  // Update performance metrics
  async updateDailyMetrics(repId, stats) {
    await supabase.from('rep_performance_metrics').upsert({
      rep_id: repId,
      metric_date: new Date().toISOString().split('T')[0],
      calls_made: stats.callsToday,
      calls_connected: stats.callsToday, // Simplified for now
      meetings_scheduled: stats.opportunitiesToday,
      deals_closed: stats.closedToday,
      close_rate: stats.closeRate,
      updated_at: new Date().toISOString(),
    });
  }

  // Stop monitoring a rep
  stopMonitoring(repId) {
    const subscription = this.activeMonitors.get(repId);
    if (subscription) {
      subscription.unsubscribe();
      this.activeMonitors.delete(repId);
    }
  }
}

// Export singleton instance
const harveyCallMonitor = new HarveyCallMonitor();
export default harveyCallMonitor;
