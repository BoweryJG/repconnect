export interface Database {
  public: {
    Tables: {
      calls: {
        Row: {
          id: string;
          call_sid?: string;
          contact_id?: string;
          phone_number: string;
          type: 'inbound' | 'outbound';
          status: string;
          duration?: number;
          created_at: string;
          ended_at?: string;
          recording_url?: string;
          transcription?: string;
          has_analysis?: boolean;
        };
        Insert: {
          id?: string;
          call_sid?: string;
          contact_id?: string;
          phone_number: string;
          type: 'inbound' | 'outbound';
          status: string;
          duration?: number;
          created_at?: string;
          ended_at?: string;
          recording_url?: string;
          transcription?: string;
          has_analysis?: boolean;
        };
        Update: {
          id?: string;
          call_sid?: string;
          contact_id?: string;
          phone_number?: string;
          type?: 'inbound' | 'outbound';
          status?: string;
          duration?: number;
          created_at?: string;
          ended_at?: string;
          recording_url?: string;
          transcription?: string;
          has_analysis?: boolean;
        };
      };
      contacts: {
        Row: {
          id: string;
          first_name?: string;
          last_name?: string;
          phone_number?: string;
          cell?: string;
          email?: string;
          notes?: string;
          summary?: string;
          tech_interests?: string;
          specialty?: string;
          lead_tier?: string;
          contact_priority?: string;
          territory?: string;
          created_at: string;
        };
      };
      call_analysis: {
        Row: {
          id: string;
          call_sid: string;
          call_id?: string;
          executive_summary: string;
          key_points: string[];
          action_items: any[];
          sentiment_analysis: any;
          next_steps: string[];
          summary_format: 'brief' | 'detailed' | 'executive';
          summary_version: number;
          ai_model?: string;
          ai_provider: string;
          processing_time_ms?: number;
          token_count?: any;
          created_at: string;
          updated_at: string;
          regenerated_at?: string;
        };
      };
    };
  };
}