// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  LinearProgress,
  Collapse,
  Stack,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  Alert,
  CircularProgress,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  PhoneInTalk as PhoneInTalkIcon,
  PhoneMissed as PhoneMissedIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentNeutral as SentimentNeutralIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  AccessTime as AccessTimeIcon,
  CalendarToday as CalendarIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallHistory, CallHistoryFilters } from '../hooks/useCallHistory';
import { CallSummary } from '../types/callSummary';

interface AudioPlayerProps {
  url: string;
  onPlay?: () => void;
  onPause?: () => void;
  onStop?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, onPlay, onPause, onStop }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      setIsPlaying(false);
      onStop?.();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onStop]);

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      onPause?.();
    } else {
      audio.play();
      onPlay?.();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    onStop?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' } as any}>
      <audio ref={audioRef} src={url} />
      <IconButton onClick={handlePlayPause} size="small">
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </IconButton>
      <IconButton onClick={handleStop} size="small" disabled={!isPlaying && currentTime === 0}>
        <StopIcon />
      </IconButton>
      <div style={{ flex: 1, margin: '0 16px' } as any}>
        <LinearProgress
          variant="determinate"
          value={duration > 0 ? (currentTime / duration) * 100 : 0}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </div>
      <Typography variant="caption" sx={{ minWidth: 60 } as any}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </Typography>
    </div>
  );
};

interface CallHistoryDashboardProps {
  open: boolean;
  onClose: () => void;
}

export const CallHistoryDashboard: React.FC<CallHistoryDashboardProps> = ({ open, onClose }) => {
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [filters, setFilters] = useState<CallHistoryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());

  const {
    calls,
    loading,
    error,
    hasMore,
    totalCount,
    stats,
    loadMore,
    refresh,
    exportToPDF,
    exportToCSV,
  } = useCallHistory({ filters });

  const handleFilterChange = (newFilters: Partial<CallHistoryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleCallToggle = (callId: string) => {
    setExpandedCallId(prev => prev === callId ? null : callId);
  };

  const handleSelectCall = (callId: string) => {
    setSelectedCalls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };

  const handleExport = (format: 'pdf' | 'csv') => {
    const callIds = selectedCalls.size > 0 ? Array.from(selectedCalls) : undefined;
    if (format === 'pdf') {
      exportToPDF(callIds);
    } else {
      exportToCSV(callIds);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <SentimentSatisfiedIcon sx={{ color: 'success.main' }} />;
      case 'negative':
        return <SentimentDissatisfiedIcon sx={{ color: 'error.main' }} />;
      default:
        return <SentimentNeutralIcon sx={{ color: 'warning.main' }} />;
    }
  };

  const getCallIcon = (type: string, status: string) => {
    if (status === 'missed') return <PhoneMissedIcon sx={{ color: 'error.main' }} />;
    if (type === 'inbound') return <PhoneInTalkIcon sx={{ color: 'info.main' }} />;
    return <PhoneIcon sx={{ color: 'success.main' }} />;
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        background: 'rgba(0, 0, 0, 0.8)',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'linear-gradient(180deg, #0a0a0a 0%, rgba(10, 10, 10, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Call History Dashboard
              </Typography>
              <IconButton onClick={onClose} sx={{ color: 'text.secondary' } as any}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Container>
        </div>

        <Container maxWidth="xl" sx={{ py: 4 } as any}>
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 } as any}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total Calls</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 } as any}>{stats.totalCalls}</Typography>
                    </Box>
                    <PhoneIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.2)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Avg Duration</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 } as any}>
                        {Math.floor(stats.avgDuration / 60)}:{(Math.floor(stats.avgDuration) % 60).toString().padStart(2, '0')}
                      </Typography>
                    </Box>
                    <AccessTimeIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Positive Calls</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 } as any}>
                        {stats.sentimentCounts.positive || 0}
                      </Typography>
                    </Box>
                    <SentimentSatisfiedIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                sx={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Needs Attention</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700 } as any}>
                        {stats.sentimentCounts.negative || 0}
                      </Typography>
                    </Box>
                    <SentimentDissatisfiedIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.5 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters and Actions Bar */}
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' } as any}>
              <TextField
                placeholder="Search calls..."
                size="small"
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />
              
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? 'contained' : 'outlined'}
                size="small"
              >
                Filters
              </Button>

              <Button
                startIcon={<RefreshIcon />}
                onClick={refresh}
                variant="outlined"
                size="small"
                disabled={loading}
              >
                Refresh
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              <Button
                startIcon={<PdfIcon />}
                onClick={() => handleExport('pdf')}
                variant="outlined"
                size="small"
                disabled={calls.length === 0}
              >
                Export PDF
              </Button>

              <Button
                startIcon={<CsvIcon />}
                onClick={() => handleExport('csv')}
                variant="outlined"
                size="small"
                disabled={calls.length === 0}
              >
                Export CSV
              </Button>
            </Box>

            {/* Expanded Filters */}
            <Collapse in={showFilters}>
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' } as any}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="Start Date"
                        value={filters.dateRange?.start || null}
                        onChange={(date) => {
                          if (date) {
                            handleFilterChange({
                              dateRange: {
                                start: date,
                                end: filters.dateRange?.end || new Date(),
                              },
                            });
                          }
                        }}
                        slotProps={{
                          textField: { fullWidth: true, size: 'small' }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <DatePicker
                        label="End Date"
                        value={filters.dateRange?.end || null}
                        onChange={(date) => {
                          if (date) {
                            handleFilterChange({
                              dateRange: {
                                start: filters.dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                                end: date,
                              },
                            });
                          }
                        }}
                        slotProps={{
                          textField: { fullWidth: true, size: 'small' }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sentiment</InputLabel>
                      <Select
                        value={filters.sentiment || ''}
                        onChange={(e) => handleFilterChange({ sentiment: e.target.value as any })}
                        label="Sentiment"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="positive">Positive</MenuItem>
                        <MenuItem value="neutral">Neutral</MenuItem>
                        <MenuItem value="negative">Negative</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.outcome || ''}
                        onChange={(e) => handleFilterChange({ outcome: e.target.value })}
                        label="Status"
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="missed">Missed</MenuItem>
                        <MenuItem value="voicemail">Voicemail</MenuItem>
                        <MenuItem value="busy">Busy</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Paper>

          {/* Tabs */}
          <Tabs
            value={selectedTab}
            onChange={(_, value) => setSelectedTab(value)}
            sx={{ mb: 3 }}
          >
            <Tab label="All Calls" />
            <Tab label="With Transcriptions" />
            <Tab label="Analyzed" />
          </Tabs>

          {/* Call List */}
          {loading && calls.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 } as any}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 } as any}>{error}</Alert>
          ) : calls.length === 0 ? (
            <Paper
              sx={{
                p: 8,
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <PhoneIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No calls found
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Try adjusting your filters or make some calls to see them here.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {calls
                .filter(call => {
                  if (selectedTab === 1) return call.transcription;
                  if (selectedTab === 2) return call.has_analysis;
                  return true;
                })
                .map((call) => (
                <motion.div
                  key={call.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper
                    sx={{
                      overflow: 'hidden',
                      background: expandedCallId === call.id
                        ? 'rgba(99, 102, 241, 0.05)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid',
                      borderColor: expandedCallId === call.id
                        ? 'rgba(99, 102, 241, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        background: 'rgba(99, 102, 241, 0.03)',
                      },
                    }}
                  >
                    {/* Call Header */}
                    <Box
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                      }}
                      onClick={() => handleCallToggle(call.id)}
                    >
                      <Avatar sx={{ bgcolor: 'primary.main' } as any}>
                        {getCallIcon(call.type, call.status)}
                      </Avatar>

                      <Box sx={{ flex: 1 } as any}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 } as any}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 } as any}>
                            {call.contact_name || 'Unknown Contact'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            • {call.phone_number}
                          </Typography>
                          {call.analysis && (
                            <>
                              <Typography variant="body2" color="text.secondary">•</Typography>
                              {getSentimentIcon(call.analysis.sentiment_analysis.overall)}
                            </>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 } as any}>
                          <Typography variant="caption" color="text.secondary">
                            <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            {new Date(call.created_at).toLocaleString()}
                          </Typography>
                          {call.duration && (
                            <Typography variant="caption" color="text.secondary">
                              <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                            </Typography>
                          )}
                          <Chip
                            label={call.status}
                            size="small"
                            color={call.status === 'completed' ? 'success' : 'default'}
                            sx={{ height: 20 }}
                          />
                          {call.has_analysis && (
                            <Chip
                              icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                              label="AI Analyzed"
                              size="small"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      </Box>

                      <IconButton size="small">
                        {expandedCallId === call.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>

                    {/* Expanded Content */}
                    <Collapse in={expandedCallId === call.id}>
                      <Divider />
                      <Box sx={{ p: 3 } as any}>
                        {/* Recording Player */}
                        {call.recording_url && (
                          <Box sx={{ mb: 3 } as any}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 } as any}>
                              Call Recording
                            </Typography>
                            <Paper sx={{ p: 2, background: 'rgba(0, 0, 0, 0.2)' } as any}>
                              <AudioPlayer url={call.recording_url} />
                            </Paper>
                          </Box>
                        )}

                        {/* AI Summary */}
                        {call.analysis && (
                          <Box sx={{ mb: 3 } as any}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 } as any}>
                              AI Summary
                            </Typography>
                            <Paper sx={{ p: 2, background: 'rgba(0, 0, 0, 0.2)' } as any}>
                              <Typography variant="body2" paragraph>
                                {call.analysis.executive_summary}
                              </Typography>
                              
                              {call.analysis.key_points.length > 0 && (
                                <>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' } as any}>
                                    Key Points:
                                  </Typography>
                                  <Box component="ul" sx={{ my: 1, pl: 2 } as any}>
                                    {call.analysis.key_points.map((point, idx) => (
                                      <Typography key={idx} component="li" variant="body2">
                                        {point}
                                      </Typography>
                                    ))}
                                  </Box>
                                </>
                              )}

                              {call.analysis.action_items.length > 0 && (
                                <>
                                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'secondary.main' } as any}>
                                    Action Items:
                                  </Typography>
                                  <Box sx={{ mt: 1 } as any}>
                                    {call.analysis.action_items.map((item, idx) => (
                                      <Chip
                                        key={idx}
                                        label={item.task}
                                        size="small"
                                        sx={{ mr: 1, mb: 1 }}
                                        color={item.priority === 'high' ? 'error' : 'default'}
                                      />
                                    ))}
                                  </Box>
                                </>
                              )}
                            </Paper>
                          </Box>
                        )}

                        {/* Transcription */}
                        {call.transcription && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 } as any}>
                              Transcription
                            </Typography>
                            <Paper
                              sx={{
                                p: 2,
                                background: 'rgba(0, 0, 0, 0.2)',
                                maxHeight: 300,
                                overflow: 'auto',
                              }}
                            >
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' } as any}>
                                {call.transcription}
                              </Typography>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                </motion.div>
              ))}
            </Stack>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 } as any}>
              <Button
                onClick={loadMore}
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  background: 'rgba(99, 102, 241, 0.1)',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.2)',
                  },
                }}
              >
                Load More Calls
              </Button>
            </Box>
          )}

          {loading && calls.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 } as any}>
              <CircularProgress size={30} />
            </Box>
          )}
        </Container>
      </div>
    </motion.div>
  );
};