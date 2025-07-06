import { createClient } from '@supabase/supabase-js';

// Types
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
}

export interface ActionItem {
  task: string;
  assignee?: string;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
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

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class CallSummaryService {
  private supabase;
  private openAIApiKey: string;
  private openAIBaseUrl = 'https://api.openai.com/v1';

  constructor() {
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    this.openAIApiKey = process.env.OPENAI_API_KEY || '';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async generateSummary(request: CallSummaryRequest): Promise<CallSummary> {
    const startTime = Date.now();
    
    try {
      // Generate summary using OpenAI
      const prompt = this.buildPrompt(request.transcription, request.format || 'detailed');
      const aiResponse = await this.callOpenAI(prompt);
      
      const summary = this.parseAIResponse(aiResponse.choices[0].message.content);
      
      // Save to database
      await this.saveSummaryToDatabase({
        callSid: request.callSid,
        summary,
        format: request.format || 'detailed',
        aiModel: 'gpt-4-turbo-preview',
        processingTimeMs: Date.now() - startTime,
        tokenCount: {
          input: aiResponse.usage?.prompt_tokens || 0,
          output: aiResponse.usage?.completion_tokens || 0
        },
        regenerate: request.regenerate || false
      });
      
      // Update calls table
      await this.updateCallAnalysisStatus(request.callSid, true);
      
      return summary;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate call summary');
    }
  }

  private buildPrompt(transcription: string, format: 'brief' | 'detailed' | 'executive'): string {
    const formatInstructions = {
      brief: 'Provide a concise summary in 2-3 sentences, highlighting only the most critical points.',
      detailed: 'Provide a comprehensive summary including all important details, context, and nuances.',
      executive: 'Provide a high-level executive summary focusing on business impact, decisions, and strategic outcomes.'
    };

    return `Analyze the following call transcription and provide a structured summary.

Format: ${format} - ${formatInstructions[format]}

Transcription:
${transcription}

Please provide your analysis in the following JSON format:
{
  "executiveSummary": "A clear, concise overview of the call",
  "keyPoints": ["Array of main discussion points"],
  "actionItems": [
    {
      "task": "Description of the action item",
      "assignee": "Person responsible (if mentioned)",
      "priority": "high/medium/low",
      "dueDate": "Due date if mentioned"
    }
  ],
  "sentimentAnalysis": {
    "overall": "positive/neutral/negative",
    "score": 0.0,
    "emotions": {
      "satisfaction": 0.0,
      "frustration": 0.0,
      "confusion": 0.0,
      "enthusiasm": 0.0
    },
    "keyMoments": [
      {
        "sentiment": "Description of sentiment",
        "text": "Quote from the call"
      }
    ]
  },
  "nextSteps": ["Array of recommended next steps"]
}

Important guidelines:
1. Be objective and accurate
2. Extract concrete action items with clear ownership when possible
3. Identify sentiment based on tone, language, and context
4. Provide actionable next steps
5. For ${format} format, adjust the level of detail accordingly`;
  }

  private async callOpenAI(prompt: string): Promise<OpenRouterResponse> {
    const response = await fetch(`${this.openAIBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant specialized in analyzing business calls and providing structured summaries. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return await response.json();
  }

  private parseAIResponse(content: string): CallSummary {
    try {
      // Extract JSON from the response (in case it includes markdown formatting)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        executiveSummary: parsed.executiveSummary || 'No summary available',
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map((item: any) => ({
          task: item.task || '',
          assignee: item.assignee,
          priority: item.priority || 'medium',
          dueDate: item.dueDate
        })) : [],
        sentimentAnalysis: {
          overall: parsed.sentimentAnalysis?.overall || 'neutral',
          score: parsed.sentimentAnalysis?.score || 0,
          emotions: parsed.sentimentAnalysis?.emotions || {},
          keyMoments: Array.isArray(parsed.sentimentAnalysis?.keyMoments) 
            ? parsed.sentimentAnalysis.keyMoments 
            : []
        },
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : []
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  private async saveSummaryToDatabase(data: {
    callSid: string;
    summary: CallSummary;
    format: string;
    aiModel: string;
    processingTimeMs: number;
    tokenCount: { input: number; output: number };
    regenerate: boolean;
  }) {
    const { callSid, summary, format, aiModel, processingTimeMs, tokenCount, regenerate } = data;

    // Get call_id from calls table
    const { data: callData, error: callError } = await this.supabase
      .from('calls')
      .select('id')
      .eq('call_sid', callSid)
      .single();

    if (callError || !callData) {
      console.error('Call not found:', callError);
      // Continue without call_id
    }

    const analysisData = {
      call_sid: callSid,
      call_id: callData?.id,
      executive_summary: summary.executiveSummary,
      key_points: summary.keyPoints,
      action_items: summary.actionItems,
      sentiment_analysis: summary.sentimentAnalysis,
      next_steps: summary.nextSteps,
      summary_format: format,
      ai_model: aiModel,
      ai_provider: 'openrouter',
      processing_time_ms: processingTimeMs,
      token_count: tokenCount,
      regenerated_at: regenerate ? new Date().toISOString() : null
    };

    if (regenerate) {
      // Get current summary version
      const { data: existingAnalysis } = await this.supabase
        .from('call_analysis')
        .select('summary_version')
        .eq('call_sid', callSid)
        .single();

      // Update existing analysis
      const { error } = await this.supabase
        .from('call_analysis')
        .update({
          ...analysisData,
          summary_version: (existingAnalysis?.summary_version || 0) + 1
        })
        .eq('call_sid', callSid);

      if (error) throw error;
    } else {
      // Insert new analysis
      const { error } = await this.supabase
        .from('call_analysis')
        .insert(analysisData);

      if (error) throw error;
    }
  }

  private async updateCallAnalysisStatus(callSid: string, hasAnalysis: boolean) {
    const { error } = await this.supabase
      .from('calls')
      .update({ has_analysis: hasAnalysis })
      .eq('call_sid', callSid);

    if (error) {
      console.error('Error updating call analysis status:', error);
    }
  }

  async getSummary(callSid: string): Promise<CallSummary | null> {
    const { data, error } = await this.supabase
      .from('call_analysis')
      .select('*')
      .eq('call_sid', callSid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      executiveSummary: data.executive_summary,
      keyPoints: data.key_points || [],
      actionItems: data.action_items || [],
      sentimentAnalysis: data.sentiment_analysis || {},
      nextSteps: data.next_steps || []
    };
  }

  async updateSummary(callSid: string, updates: Partial<CallSummary>): Promise<void> {
    const updateData: any = {};
    
    if (updates.executiveSummary) updateData.executive_summary = updates.executiveSummary;
    if (updates.keyPoints) updateData.key_points = updates.keyPoints;
    if (updates.actionItems) updateData.action_items = updates.actionItems;
    if (updates.sentimentAnalysis) updateData.sentiment_analysis = updates.sentimentAnalysis;
    if (updates.nextSteps) updateData.next_steps = updates.nextSteps;

    const { error } = await this.supabase
      .from('call_analysis')
      .update(updateData)
      .eq('call_sid', callSid);

    if (error) {
      throw new Error('Failed to update summary');
    }
  }
}

// Export singleton instance
export const callSummaryService = new CallSummaryService();