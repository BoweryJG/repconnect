export interface CallSummaryRequest {
  callSid: string;
  transcription: string;
  format?: 'brief' | 'detailed' | 'executive';
  regenerate?: boolean;
}

export interface CallSummary {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  sentimentAnalysis: SentimentAnalysis;
  nextSteps: string[];
  metadata?: CallSummaryMetadata;
}

export interface ActionItem {
  task: string;
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number;
  emotions: {
    satisfaction?: number;
    frustration?: number;
    confusion?: number;
    enthusiasm?: number;
  };
  keyMoments: {
    timestamp?: string;
    sentiment: string;
    text: string;
  }[];
}

export interface CallSummaryMetadata {
  format: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CallAnalysisRecord {
  id: string;
  call_sid: string;
  call_id?: string;
  executive_summary: string;
  key_points: string[];
  action_items: ActionItem[];
  sentiment_analysis: SentimentAnalysis;
  next_steps: string[];
  summary_format: 'brief' | 'detailed' | 'executive';
  summary_version: number;
  ai_model?: string;
  ai_provider: string;
  processing_time_ms?: number;
  token_count?: {
    input: number;
    output: number;
  };
  created_at: string;
  updated_at: string;
  regenerated_at?: string;
}
