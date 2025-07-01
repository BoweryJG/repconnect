import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CallAnalysisRecord, CallSummary } from '../types/callSummary';

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
      let query = supabase
        .from('calls')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name
          ),
          call_analysis (*)
        `, { count: 'exact' })
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

      // Process the data
      const processedCalls: CallHistoryItem[] = (data || []).map(call => ({
        id: call.id,
        call_sid: call.call_sid,
        contact_id: call.contact_id,
        contact_name: call.contacts 
          ? `${call.contacts.first_name || ''} ${call.contacts.last_name || ''}`.trim()
          : undefined,
        phone_number: call.phone_number,
        type: call.type,
        status: call.status,
        duration: call.duration,
        created_at: call.created_at,
        ended_at: call.ended_at,
        recording_url: call.recording_url,
        transcription: call.transcription,
        has_analysis: call.has_analysis,
        analysis: call.call_analysis?.[0] || null,
      }));

      // Apply sentiment filter if needed (client-side for now)
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
      console.error('Error fetching calls:', err);
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
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'calls' 
        },
        (payload) => {
          console.log('Call update:', payload);
          // Refresh the list when there's any change
          refresh();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'call_analysis' 
        },
        (payload) => {
          console.log('Call analysis update:', payload);
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
  }, [filters]);

  // Fetch when page changes
  useEffect(() => {
    if (page > 0) {
      fetchCalls();
    }
  }, [page]);

  // Export functions
  const exportToPDF = useCallback(async (callIds?: string[]) => {
    // This would be implemented with a PDF library like jsPDF
    // For now, we'll just log the intent
    console.log('Export to PDF:', callIds || 'all calls');
    // TODO: Implement PDF export
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
      call.contact_name || 'Unknown',
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