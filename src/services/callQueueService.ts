import { twilioService } from './twilioService';
import { supabase } from '../lib/supabase';

export interface CallOutcome {
  status: 'completed' | 'no-answer' | 'busy' | 'failed' | 'voicemail';
  duration?: number;
  notes?: string;
  recordingUrl?: string;
  nextAction?: 'callback' | 'remove' | 'email' | 'text';
  callbackDate?: Date;
}

export interface QueuedCall {
  id: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  queueId: string;
  position: number;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  outcome?: CallOutcome;
  callSid?: string;
  attemptCount: number;
  lastAttemptAt?: Date;
  createdAt: Date;
  scheduledFor?: Date;
}

export class CallQueueService {
  private static activeCall: QueuedCall | null = null;
  private static callListeners: ((_call: QueuedCall) => void)[] = [];
  private static MAX_RETRY_ATTEMPTS = 3;
  private static RETRY_DELAY_MS = 5000;

  static async createCallsFromQueue(queueId: string, contacts: any[]): Promise<QueuedCall[]> {
    const calls: QueuedCall[] = contacts.map((contact, index) => ({
      id: crypto.randomUUID(),
      contactId: contact.id,
      contactName: contact.name,
      phoneNumber: contact.phoneNumber,
      queueId,
      position: index + 1,
      status: 'pending',
      attemptCount: 0,
      createdAt: new Date(),
    }));

    try {
      // Store in database with batch insert
      const { error } = await supabase.from('queued_calls').insert(
        calls.map((call) => ({
          id: call.id,
          contact_id: call.contactId,
          contact_name: call.contactName,
          phone_number: call.phoneNumber,
          queue_id: call.queueId,
          position: call.position,
          status: call.status,
          attempt_count: call.attemptCount,
          created_at: call.createdAt.toISOString(),
        }))
      );

      if (error) {
        throw new Error(`Failed to create call queue: ${error.message}`);
      }

      // Store queue metadata for recovery
      await this.saveQueueMetadata(queueId, calls.length);

      return calls;
    } catch (error) {
      // Attempt cleanup on failure
      await this.cleanupFailedQueue(queueId);
      throw error;
    }
  }

  static async makeCall(queuedCall: QueuedCall): Promise<void> {
    try {
      this.activeCall = { ...queuedCall, status: 'calling' };
      this.notifyListeners();

      // Update status in database
      await supabase
        .from('queued_calls')
        .update({
          status: 'calling',
          last_attempt_at: new Date().toISOString(),
          attempt_count: queuedCall.attemptCount + 1,
        })
        .eq('id', queuedCall.id);

      // Make the actual call via Twilio with retry logic
      let lastError: any;
      for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          const response = await twilioService.makeCall(queuedCall.phoneNumber);

          if (response.sid) {
            // Update with call SID
            await supabase
              .from('queued_calls')
              .update({ call_sid: response.sid })
              .eq('id', queuedCall.id);

            this.activeCall = { ...this.activeCall, callSid: response.sid };
            this.notifyListeners();
            return; // Success!
          }
        } catch (error: any) {
          lastError = error;

          if (attempt < this.MAX_RETRY_ATTEMPTS) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY_MS));
          }
        }
      }

      // All retries failed
      const errorMessage =
        lastError?.response?.data?.message || lastError?.message || 'Failed to initiate call';
      await this.markCallFailed(
        queuedCall.id,
        `Failed after ${this.MAX_RETRY_ATTEMPTS} attempts: ${errorMessage}`
      );
      throw lastError;
    } catch (error) {
      if (!this.activeCall || this.activeCall.id !== queuedCall.id) {
        await this.markCallFailed(queuedCall.id, 'Failed to initiate call');
      }
      throw error;
    }
  }

  static async completeCall(callId: string, outcome: CallOutcome): Promise<void> {
    try {
      const { error } = await supabase
        .from('queued_calls')
        .update({
          status: 'completed',
          outcome: outcome,
          completed_at: new Date().toISOString(),
        })
        .eq('id', callId);

      if (error) throw error;

      // Log call in history
      await this.logCallHistory(callId, outcome);

      // Handle next action
      if (outcome.nextAction === 'callback' && outcome.callbackDate) {
        await this.scheduleCallback(callId, outcome.callbackDate);
      }

      this.activeCall = null;
      this.notifyListeners();
    } catch (error) {
      throw error;
    }
  }

  static async markCallFailed(callId: string, reason: string): Promise<void> {
    await supabase
      .from('queued_calls')
      .update({
        status: 'failed',
        outcome: { status: 'failed', notes: reason },
      })
      .eq('id', callId);

    if (this.activeCall?.id === callId) {
      this.activeCall = null;
      this.notifyListeners();
    }
  }

  static async getNextCall(queueId: string): Promise<QueuedCall | null> {
    const { data, error } = await supabase
      .from('queued_calls')
      .select('*')
      .eq('queue_id', queueId)
      .eq('status', 'pending')
      .order('position', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      contactId: data.contact_id,
      contactName: data.contact_name,
      phoneNumber: data.phone_number,
      queueId: data.queue_id,
      position: data.position,
      status: data.status,
      attemptCount: data.attempt_count,
      createdAt: new Date(data.created_at),
      lastAttemptAt: data.last_attempt_at ? new Date(data.last_attempt_at) : undefined,
    };
  }

  static async getQueueProgress(queueId: string): Promise<{
    total: number;
    completed: number;
    failed: number;
    pending: number;
    calling: number;
  }> {
    const { data, error } = await supabase
      .from('queued_calls')
      .select('status')
      .eq('queue_id', queueId);

    if (error || !data) {
      return { total: 0, completed: 0, failed: 0, pending: 0, calling: 0 };
    }

    const counts = data.reduce(
      (acc: any, call: any) => {
        acc[call.status] = (acc[call.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: data.length,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      pending: counts.pending || 0,
      calling: counts.calling || 0,
    };
  }

  private static async logCallHistory(callId: string, outcome: CallOutcome): Promise<void> {
    const { data: callData } = await supabase
      .from('queued_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (!callData) return;

    await supabase.from('call_history').insert({
      contact_id: callData.contact_id,
      phone_number: callData.phone_number,
      direction: 'outbound',
      status: outcome.status,
      duration: outcome.duration,
      notes: outcome.notes,
      recording_url: outcome.recordingUrl,
      call_sid: callData.call_sid,
      created_at: new Date().toISOString(),
    });
  }

  private static async scheduleCallback(callId: string, callbackDate: Date): Promise<void> {
    const { data: callData } = await supabase
      .from('queued_calls')
      .select('*')
      .eq('id', callId)
      .single();

    if (!callData) return;

    // Create a new queued call for the callback
    await supabase.from('queued_calls').insert({
      contact_id: callData.contact_id,
      contact_name: callData.contact_name,
      phone_number: callData.phone_number,
      queue_id: callData.queue_id,
      position: 999, // End of queue
      status: 'pending',
      attempt_count: 0,
      scheduled_for: callbackDate.toISOString(),
      created_at: new Date().toISOString(),
    });
  }

  static onCallUpdate(listener: (_call: QueuedCall) => void): () => void {
    this.callListeners.push(listener);
    return () => {
      this.callListeners = this.callListeners.filter(
        (existingListener) => existingListener !== listener
      );
    };
  }

  private static notifyListeners(): void {
    if (this.activeCall) {
      this.callListeners.forEach((listener) => listener(this.activeCall!));
    }
  }

  static getActiveCall(): QueuedCall | null {
    return this.activeCall;
  }

  // Queue persistence and recovery methods
  private static async saveQueueMetadata(queueId: string, totalContacts: number): Promise<void> {
    const metadata = {
      queueId,
      totalContacts,
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`queue_metadata_${queueId}`, JSON.stringify(metadata));
    } catch {
      // Ignore localStorage errors
    }
  }

  private static async cleanupFailedQueue(queueId: string): Promise<void> {
    try {
      await supabase.from('queued_calls').delete().eq('queue_id', queueId);

      localStorage.removeItem(`queue_metadata_${queueId}`);
    } catch {
      // Ignore cleanup errors
    }
  }

  static async recoverQueue(queueId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('queued_calls')
        .select('*')
        .eq('queue_id', queueId)
        .order('position', { ascending: true });

      if (error || !data || data.length === 0) {
        return false;
      }

      // Check if queue has pending calls
      const hasPendingCalls = data.some((call: any) => call.status === 'pending');
      if (!hasPendingCalls) {
        return false;
      }

      // Update metadata
      await this.saveQueueMetadata(queueId, data.length);

      return true;
    } catch {
      return false;
    }
  }

  static async getRecentQueues(): Promise<
    Array<{ queueId: string; totalContacts: number; createdAt: string }>
  > {
    const queues: Array<{ queueId: string; totalContacts: number; createdAt: string }> = [];

    try {
      // Get from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('queue_metadata_')) {
          const metadata = JSON.parse(localStorage.getItem(key) || '{}');
          queues.push(metadata);
        }
      }

      // Sort by most recent
      queues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Keep only last 10
      return queues.slice(0, 10);
    } catch {
      return [];
    }
  }
}
