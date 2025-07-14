// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Refresh as RefreshIcon, Download as DownloadIcon } from '@mui/icons-material';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

interface CallSummaryViewProps {
  callSid: string;
  transcription?: string;
}

interface CallSummary {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: {
    task: string;
    assignee?: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: string;
  }[];
  sentimentAnalysis: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
    emotions: {
      satisfaction?: number;
      frustration?: number;
      confusion?: number;
      enthusiasm?: number;
    };
    keyMoments: {
      sentiment: string;
      text: string;
    }[];
  };
  nextSteps: string[];
  metadata?: {
    format: string;
    version: number;
    createdAt: string;
    updatedAt: string;
  };
}

export const CallSummaryView: React.FC<CallSummaryViewProps> = ({ callSid, transcription }) => {
  const [summary, setSummary] = useState<CallSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<'brief' | 'detailed' | 'executive'>('detailed');

  useEffect(() => {
    fetchSummary();
  }, [callSid]);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/calls/${callSid}/summary`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else if (response.status === 404) {
        // Summary doesn't exist yet
        setSummary(null);
      } else {
        throw new Error('Failed to fetch summary');
      }
    } catch (err) {
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (!transcription) {
      setError('No transcription available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/calls/${callSid}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription,
          format,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        throw new Error('Failed to generate summary');
      }
    } catch (err) {
      setError('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const regenerateSummary = async () => {
    if (!transcription) {
      setError('No transcription available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/calls/${callSid}/summary/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription,
          format,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      } else {
        throw new Error('Failed to regenerate summary');
      }
    } catch (err) {
      setError('Failed to regenerate summary');
    } finally {
      setLoading(false);
    }
  };

  const downloadSummary = () => {
    if (!summary) return;

    const content = `Call Summary - ${callSid}
=====================

Executive Summary:
${summary.executiveSummary}

Key Points:
${summary.keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

Action Items:
${summary.actionItems
  .map(
    (item, i) =>
      `${i + 1}. ${item.task}
   - Assignee: ${item.assignee || 'Unassigned'}
   - Priority: ${item.priority}
   - Due: ${item.dueDate || 'No due date'}`
  )
  .join('\n\n')}

Sentiment Analysis:
- Overall: ${summary.sentimentAnalysis.overall} (Score: ${summary.sentimentAnalysis.score})
- Key Moments:
${summary.sentimentAnalysis.keyMoments
  .map((moment) => `  * ${moment.sentiment}: "${moment.text}"`)
  .join('\n')}

Next Steps:
${summary.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

Generated: ${summary.metadata?.createdAt || new Date().toISOString()}
Version: ${summary.metadata?.version || 1}
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-summary-${callSid}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
      >
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!summary) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Summary Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Generate an AI-powered summary of this call
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
          <InputLabel>Format</InputLabel>
          <Select value={format} label="Format" onChange={(e) => setFormat(e.target.value as any)}>
            <MenuItem value="brief">Brief</MenuItem>
            <MenuItem value="detailed">Detailed</MenuItem>
            <MenuItem value="executive">Executive</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={generateSummary} disabled={!transcription}>
          Generate Summary
        </Button>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Typography variant="h5">Call Summary</Typography>
        <Stack direction="row" spacing={1}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={format}
              label="Format"
              onChange={(e) => setFormat(e.target.value as any)}
            >
              <MenuItem value="brief">Brief</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
              <MenuItem value="executive">Executive</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<RefreshIcon />} onClick={regenerateSummary} disabled={!transcription}>
            Regenerate
          </Button>
          <Button startIcon={<DownloadIcon />} onClick={downloadSummary}>
            Download
          </Button>
        </Stack>
      </div>

      {summary.metadata && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Format: {summary.metadata.format} | Version: {summary.metadata.version} | Updated:{' '}
          {new Date(summary.metadata.updatedAt).toLocaleString()}
        </Typography>
      )}

      <div style={{ marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>
          Executive Summary
        </Typography>
        <Typography variant="body1">{summary.executiveSummary}</Typography>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>
          Sentiment Analysis
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Chip
            label={`Overall: ${summary.sentimentAnalysis.overall}`}
            color={getSentimentColor(summary.sentimentAnalysis.overall)}
          />
          <Typography variant="body2">
            Score: {summary.sentimentAnalysis.score.toFixed(2)}
          </Typography>
        </Stack>
        {Object.entries(summary.sentimentAnalysis.emotions).length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
            {Object.entries(summary.sentimentAnalysis.emotions).map(([emotion, value]) => (
              <Chip
                key={emotion}
                label={`${emotion}: ${(value * 100).toFixed(0)}%`}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>
          Key Points
        </Typography>
        <Stack spacing={1}>
          {summary.keyPoints.map((point, index) => (
            <Typography key={index} variant="body2">
              • {point}
            </Typography>
          ))}
        </Stack>
      </div>

      {summary.actionItems.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Typography variant="h6" gutterBottom>
            Action Items
          </Typography>
          <Stack spacing={2}>
            {summary.actionItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Chip label={item.priority} size="small" color={getPriorityColor(item.priority)} />
                <div style={{ flex: 1 }}>
                  <Typography variant="body2">{item.task}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.assignee && `Assignee: ${item.assignee}`}
                    {item.dueDate && ` | Due: ${item.dueDate}`}
                  </Typography>
                </div>
              </div>
            ))}
          </Stack>
        </div>
      )}

      {summary.nextSteps.length > 0 && (
        <div>
          <Typography variant="h6" gutterBottom>
            Recommended Next Steps
          </Typography>
          <Stack spacing={1}>
            {summary.nextSteps.map((step, index) => (
              <Typography key={index} variant="body2">
                {index + 1}. {step}
              </Typography>
            ))}
          </Stack>
        </div>
      )}
    </Paper>
  );
};
