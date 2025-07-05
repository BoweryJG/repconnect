import axios from 'axios';
import { supabase } from '../lib/supabase';

// OSBackend API configuration
const OSBACKEND_URL = process.env.REACT_APP_OSBACKEND_URL || 'https://osbackend.onrender.com';
const OSBACKEND_API_KEY = process.env.REACT_APP_OSBACKEND_API_KEY;

export interface PhoneNumber {
  id: string;
  phone_number: string;
  friendly_name?: string;
  capabilities: {
    voice: boolean;
    SMS: boolean;
    MMS: boolean;
  };
  provider: 'twilio' | 'voipms';
  status: 'active' | 'inactive';
  assigned_to?: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  call_sid?: string;
  from_number: string;
  to_number: string;
  direction: 'inbound' | 'outbound';
  status: string;
  duration?: number;
  recording_url?: string;
  transcription?: string;
  ai_summary?: string;
  created_at: string;
}

export interface SMSMessage {
  id: string;
  message_sid?: string;
  from_number: string;
  to_number: string;
  body: string;
  direction: 'inbound' | 'outbound';
  status: string;
  created_at: string;
}

class PhoneService {
  private apiClient = axios.create({
    baseURL: `${OSBACKEND_URL}/api/phone`,
    headers: {
      'Authorization': `Bearer ${OSBACKEND_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  // Phone Number Management
  async getPhoneNumbers(): Promise<PhoneNumber[]> {
    const { data: numbers, error } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('assigned_to', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return numbers || [];
  }

  async searchAvailableNumbers(params: {
    areaCode?: string;
    numberType?: string;
    pattern?: string;
  }) {
    try {
      const response = await this.apiClient.post('/phone-numbers/search', params);
      return response.data;
    } catch (error) {
      console.error('Error searching numbers:', error);
      throw error;
    }
  }

  async provisionNumber(phoneNumber: string, friendlyName?: string) {
    try {
      const user = await supabase.auth.getUser();
      const response = await this.apiClient.post('/phone-numbers/provision', {
        clientId: user.data.user?.id,
        phoneNumber,
        friendlyName,
        capabilities: {
          voice: true,
          SMS: true,
          MMS: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error provisioning number:', error);
      throw error;
    }
  }

  // Call Management
  async initiateCall(from: string, to: string, recordCall = true) {
    try {
      const response = await this.apiClient.post('/calls/initiate', {
        from,
        to,
        recordCall
      });
      return response.data;
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  async getCallHistory(phoneNumber?: string): Promise<CallLog[]> {
    let query = supabase
      .from('call_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (phoneNumber) {
      query = query.or(`from_number.eq.${phoneNumber},to_number.eq.${phoneNumber}`);
    }

    const { data: calls, error } = await query;
    if (error) throw error;
    return calls || [];
  }

  async getCallDetails(callId: string) {
    const { data: call, error } = await supabase
      .from('call_logs')
      .select('*')
      .eq('id', callId)
      .single();

    if (error) throw error;
    return call;
  }

  async getCallRecording(callId: string) {
    try {
      const response = await this.apiClient.get(`/calls/${callId}/recording`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recording:', error);
      throw error;
    }
  }

  // SMS Management
  async sendSMS(from: string, to: string, body: string) {
    try {
      const response = await this.apiClient.post('/sms/send', {
        from,
        to,
        body
      });
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async getSMSConversations(phoneNumber?: string) {
    let query = supabase
      .from('sms_conversations')
      .select(`
        *,
        phone_numbers!inner(phone_number, friendly_name)
      `)
      .order('last_message_at', { ascending: false });

    if (phoneNumber) {
      query = query.eq('participant_number', phoneNumber);
    }

    const { data: conversations, error } = await query;
    if (error) throw error;
    return conversations || [];
  }

  async getSMSMessages(conversationId: string): Promise<SMSMessage[]> {
    const { data: messages, error } = await supabase
      .from('sms_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return messages || [];
  }

  // Usage Tracking
  async getUsageSummary(startDate?: string, endDate?: string) {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await this.apiClient.get(`/usage/summary?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching usage summary:', error);
      throw error;
    }
  }

  async getPhoneUsageStats(phoneNumberId: string, billingPeriod?: string) {
    const { data: usage, error } = await supabase
      .from('phone_usage_records')
      .select('type, quantity, total_cost')
      .eq('phone_number_id', phoneNumberId)
      .eq('billing_period', billingPeriod || new Date().toISOString().slice(0, 7));

    if (error) throw error;

    // Aggregate by type
    const stats = usage?.reduce((acc, record) => {
      if (!acc[record.type]) {
        acc[record.type] = { quantity: 0, cost: 0 };
      }
      acc[record.type].quantity += record.quantity || 0;
      acc[record.type].cost += record.total_cost || 0;
      return acc;
    }, {} as Record<string, { quantity: number; cost: number }>);

    return stats || {};
  }

  // Real-time subscriptions
  subscribeToIncomingCalls(phoneNumber: string, callback: (call: CallLog) => void) {
    return supabase
      .channel(`calls:${phoneNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_logs',
          filter: `to_number=eq.${phoneNumber}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToIncomingSMS(phoneNumber: string, callback: (message: SMSMessage) => void) {
    return supabase
      .channel(`sms:${phoneNumber}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sms_messages',
          filter: `to_number=eq.${phoneNumber},direction=eq.inbound`
        },
        callback
      )
      .subscribe();
  }
}

export const phoneService = new PhoneService();