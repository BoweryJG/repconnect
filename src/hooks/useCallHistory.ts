import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CallAnalysisRecord } from '../types/callSummary';

export interface CallHistoryItem {
  id: string;
  call_sid?: string;
  contact_id?: string;
  contact_name?: string;
  phone_number: string;
  type: 'inbound' | 'outbound';
  status: string;
  duration?: number;
  created_at: string;
  ended_at?: string;
  recording_url?: string;
  transcription?: string;
  has_analysis?: boolean;
  analysis?: CallAnalysisRecord;
}

export interface CallHistoryFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  contactId?: string;
  outcome?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  search?: string;
}

export interface UseCallHistoryOptions {
  pageSize?: number;
  autoRefresh?: boolean;
  filters?: CallHistoryFilters;
}

export const useCallHistory = (options: UseCallHistoryOptions = {}) => {
  const { pageSize = 20, autoRefresh = true, filters = {} } = options;
  
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch calls with filters and pagination
  const fetchCalls = useCallback(async (reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentPage = reset ? 0 : page;
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      // Build query
      // NOTE: This assumes the table is 'call_logs'. If it's actually 'calls', 
      // change this to .from('calls')
      let query = supabase
        .from('call_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      if (filters.contactId) {
        query = query.eq('contact_id', filters.contactId);
      }

      if (filters.outcome) {
        query = query.eq('status', filters.outcome);
      }

      if (filters.search) {
        query = query.or(
          `phone_number.ilike.%${filters.search}%,transcription.ilike.%${filters.search}%`
        );
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // Fetch contact names if there are contact IDs
      const contactIds = [...new Set((data || []).filter(call => call.contact_id).map(call => call.contact_id))];
      let contactsMap: Record<string, string> = {};
      
      if (contactIds.length > 0) {
        try {
          const { data: contacts, error: contactError } = await supabase
            .from('contacts')
            .select('id, name')
            .in('id', contactIds);
          
          if (!contactError && contacts) {
            contactsMap = contacts.reduce((acc, contact) => {
              acc[contact.id] = contact.name;
              return acc;
            }, {} as Record<string, string>);
          }
        } catch (err) {
        }
      }

      // Fetch call analysis data if available
      const callSids = (data || []).filter(call => call.call_sid).map(call => call.call_sid);
      let analysisMap: Record<string, CallAnalysisRecord> = {};
      
      if (callSids.length > 0) {
        try {
          const { data: analyses, error: analysisError } = await supabase
            .from('call_analysis')
            .select('*')
            .in('call_sid', callSids);
          
          if (!analysisError && analyses) {
            analysisMap = analyses.reduce((acc, analysis) => {
              acc[analysis.call_sid] = {
                id: analysis.id,
                call_sid: analysis.call_sid,
                call_id: analysis.call_id,
                executive_summary: analysis.executive_summary,
                key_points: analysis.key_points || [],
                action_items: analysis.action_items || [],
                sentiment_analysis: analysis.sentiment_analysis || {},
                next_steps: analysis.next_steps || [],
                summary_format: analysis.summary_format,
                summary_version: analysis.summary_version,
                ai_model: analysis.ai_model,
                ai_provider: analysis.ai_provider,
                processing_time_ms: analysis.processing_time_ms,
                token_count: analysis.token_count,
                created_at: analysis.created_at,
                updated_at: analysis.updated_at,
                regenerated_at: analysis.regenerated_at,
              };
              return acc;
            }, {} as Record<string, CallAnalysisRecord>);
          }
        } catch (err) {
        }
      }

      // Process the data with contact names and analysis
      const processedCalls: CallHistoryItem[] = (data || []).map(call => ({
        id: call.id,
        call_sid: call.call_sid,
        contact_id: call.contact_id,
        contact_name: call.contact_id ? contactsMap[call.contact_id] : undefined,
        phone_number: call.phone_number,
        // Handle potential type mismatch between DB and interface
        type: call.type === 'incoming' ? 'inbound' : call.type === 'outgoing' ? 'outbound' : call.type,
        status: call.status,
        duration: call.duration,
        created_at: call.created_at,
        ended_at: call.ended_at,
        recording_url: call.recording_url,
        transcription: call.transcription,
        has_analysis: call.has_analysis,
        analysis: call.call_sid ? analysisMap[call.call_sid] : undefined,
      }));

      // Apply sentiment filter if needed
      let filteredCalls = processedCalls;
      if (filters.sentiment && processedCalls.length > 0) {
        filteredCalls = processedCalls.filter(call => 
          call.analysis?.sentiment_analysis?.overall === filters.sentiment
        );
      }

      if (reset) {
        setCalls(filteredCalls);
        setPage(0);
      } else {
        setCalls(prev => [...prev, ...filteredCalls]);
      }

      setHasMore(filteredCalls.length === pageSize);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calls');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  // Load more calls
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }, [loading, hasMore]);

  // Refresh calls
  const refresh = useCallback(() => {
    fetchCalls(true);
  }, [fetchCalls]);

  // Set up real-time subscription
  useEffect(() => {
    if (!autoRefresh) return;

    const channel = supabase
      .channel('call-updates')
      .on(
        'postgres_changes' as const,
        { 
          event: '*', 
          schema: 'public', 
          table: 'call_logs' 
        },
        (payload) => {
          // Refresh the list when there's any change
          refresh();
        }
      )
      .on(
        'postgres_changes' as const,
        { 
          event: '*', 
          schema: 'public', 
          table: 'call_analysis' 
        },
        (payload) => {
          // Refresh to get updated analysis
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [autoRefresh, refresh]);

  // Initial fetch and refetch when filters change
  useEffect(() => {
    fetchCalls(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Fetch when page changes
  useEffect(() => {
    if (page > 0) {
      fetchCalls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Export functions
  const exportToPDF = useCallback(async (callIds?: string[]) => {
    try {
      const callsToExport = callIds 
        ? calls.filter(c => callIds.includes(c.id))
        : calls;

      if (callsToExport.length === 0) {
        throw new Error('No calls to export');
      }

      // Create a simple HTML document for printing as PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Call History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            .call-report { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; }
            .call-header { font-weight: bold; margin-bottom: 10px; }
            .call-detail { margin: 5px 0; }
            .sentiment-positive { color: #22c55e; }
            .sentiment-negative { color: #ef4444; }
            .sentiment-neutral { color: #6b7280; }
            .summary { margin-top: 10px; padding: 10px; background-color: #f3f4f6; }
            @media print { .call-report { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <h1>Call History Report</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Calls: ${callsToExport.length}</p>
          <hr>
          ${callsToExport.map(call => `
            <div class="call-report">
              <div class="call-header">
                ${new Date(call.created_at).toLocaleString()} - 
                ${call.contact_name || call.phone_number || 'Unknown Contact'}
              </div>
              <div class="call-detail">Type: ${call.type}</div>
              <div class="call-detail">Phone: ${call.phone_number}</div>
              <div class="call-detail">Duration: ${
                call.duration 
                  ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` 
                  : 'N/A'
              }</div>
              <div class="call-detail">Status: ${call.status}</div>
              ${call.analysis ? `
                <div class="call-detail sentiment-${call.analysis.sentiment_analysis?.overall || 'neutral'}">
                  Sentiment: ${call.analysis.sentiment_analysis?.overall || 'N/A'}
                </div>
                <div class="summary">
                  <strong>Summary:</strong><br>
                  ${call.analysis.executive_summary || 'No summary available'}
                </div>
                ${call.analysis.key_points?.length > 0 ? `
                  <div class="summary">
                    <strong>Key Points:</strong>
                    <ul>
                      ${call.analysis.key_points.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${call.analysis.action_items?.length > 0 ? `
                  <div class="summary">
                    <strong>Action Items:</strong>
                    <ul>
                      ${call.analysis.action_items.map(item => 
                        `<li>${item.task} (${item.priority})</li>`
                      ).join('')}
                    </ul>
                  </div>
                ` : ''}
              ` : '<div class="call-detail">No analysis available</div>'}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      // Open in new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Failed to open print window. Please check your popup blocker settings.');
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print dialog
      printWindow.onload = () => {
        printWindow.print();
      };

      return true;
    } catch (error) {
      throw error;
    }
  }, [calls]);

  const exportToCSV = useCallback(async (callIds?: string[]) => {
    const callsToExport = callIds 
      ? calls.filter(c => callIds.includes(c.id))
      : calls;

    const headers = [
      'Date',
      'Contact',
      'Phone Number',
      'Type',
      'Duration',
      'Status',
      'Sentiment',
      'Summary'
    ];

    const rows = callsToExport.map(call => [
      new Date(call.created_at).toLocaleString(),
      call.contact_name || call.phone_number || 'Unknown',
      call.phone_number,
      call.type,
      call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'N/A',
      call.status,
      call.analysis?.sentiment_analysis?.overall || 'N/A',
      call.analysis?.executive_summary || 'No summary available'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [calls]);

  // Memoized values
  const stats = useMemo(() => {
    const totalCalls = calls.length;
    const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
    const avgDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
    
    const sentimentCounts = calls.reduce((acc, call) => {
      const sentiment = call.analysis?.sentiment_analysis?.overall || 'unknown';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCalls,
      totalDuration,
      avgDuration,
      sentimentCounts,
    };
  }, [calls]);

  return {
    calls,
    loading,
    error,
    hasMore,
    totalCount,
    page,
    stats,
    loadMore,
    refresh,
    exportToPDF,
    exportToCSV,
  };
};