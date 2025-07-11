import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Tabs,
  Tab,
  Card,
  LinearProgress,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { motion } from 'framer-motion';

interface PerformanceHistoryProps {
  open: boolean;
  onClose: () => void;
}

interface PerformanceMetric {
  label: string;
  value: number;
  change: number;
  max: number;
}

interface CallRecord {
  id: string;
  contactName: string;
  phoneNumber: string;
  duration: string;
  outcome: 'success' | 'no-answer' | 'failed' | 'voicemail';
  timestamp: Date;
  notes?: string;
}

export const PerformanceHistory: React.FC<PerformanceHistoryProps> = ({ open, onClose }) => {
  const [tabValue, setTabValue] = useState(0);

  // Mock data - replace with real data from store/API
  const metrics: PerformanceMetric[] = [
    { label: 'Call Success Rate', value: 78, change: 5.2, max: 100 },
    { label: 'Avg Call Duration', value: 4.5, change: 0.3, max: 10 },
    { label: 'Contacts Reached', value: 156, change: 12, max: 200 },
    { label: 'Deals Closed', value: 23, change: -2, max: 50 },
  ];

  const recentCalls: CallRecord[] = [
    {
      id: '1',
      contactName: 'John Smith',
      phoneNumber: '+1 (555) 123-4567',
      duration: '5:23',
      outcome: 'success',
      timestamp: new Date(),
      notes: 'Interested in premium package',
    },
    {
      id: '2',
      contactName: 'Sarah Johnson',
      phoneNumber: '+1 (555) 987-6543',
      duration: '2:15',
      outcome: 'voicemail',
      timestamp: new Date(Date.now() - 3600000),
    },
    {
      id: '3',
      contactName: 'Mike Davis',
      phoneNumber: '+1 (555) 456-7890',
      duration: '8:45',
      outcome: 'success',
      timestamp: new Date(Date.now() - 7200000),
      notes: 'Scheduled follow-up for next week',
    },
  ];

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return 'success';
      case 'no-answer':
        return 'warning';
      case 'failed':
        return 'error';
      case 'voicemail':
        return 'info';
      default:
        return 'default';
    }
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'success':
        return <CheckCircleIcon />;
      case 'no-answer':
        return <AccessTimeIcon />;
      case 'failed':
        return <CancelIcon />;
      case 'voicemail':
        return <PhoneIcon />;
      default:
        return <PhoneIcon />;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background:
            'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(40, 40, 40, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3,
          height: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          pb: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Pipeline Logo Link */}
          <div
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
            }}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <div style={{ width: 24, height: 24, position: 'relative' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                style={{ width: '100%', height: '100%' }}
              >
                <defs>
                  <linearGradient id="pipelineGradPerf" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9f58fa" />
                    <stop offset="100%" stopColor="#4B96DC" />
                  </linearGradient>
                </defs>
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="url(#pipelineGradPerf)"
                  strokeWidth="2"
                  opacity="0.8"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="8"
                  fill="none"
                  stroke="url(#pipelineGradPerf)"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <circle cx="16" cy="16" r="3" fill="url(#pipelineGradPerf)" />
              </svg>
            </div>
            <Typography
              sx={{
                fontFamily: 'Orbitron, monospace',
                fontWeight: 600,
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}
            >
              Pipeline
            </Typography>
          </div>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #FFFFFF 0%, #EC4899 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Performance History
          </Typography>
        </div>
        <IconButton onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2, p: 0 }}>
        <Tabs
          value={tabValue}
          onChange={(_, value) => setTabValue(value)}
          sx={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            px: 3,
          }}
        >
          <Tab label="Overview" />
          <Tab label="Call History" />
          <Tab label="Analytics" />
          <Tab label="AI Insights" />
        </Tabs>

        <div style={{ padding: 24 }}>
          {tabValue === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Performance Metrics */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {metrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card
                      sx={{
                        p: 3,
                        background: 'rgba(255, 255, 255, 0.03)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {metric.label}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                        {metric.value}
                        {metric.max === 100 ? '%' : ''}
                      </Typography>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}
                      >
                        {metric.change > 0 ? (
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: metric.change > 0 ? 'success.main' : 'error.main',
                            fontWeight: 600,
                          }}
                        >
                          {metric.change > 0 ? '+' : ''}
                          {metric.change}%
                        </Typography>
                      </div>
                      <LinearProgress
                        variant="determinate"
                        value={(metric.value / metric.max) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Recent Activity */}
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Calls
              </Typography>
              <Card
                sx={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <List>
                  {recentCalls.map((call, index) => (
                    <ListItem
                      key={call.id}
                      sx={{
                        borderBottom:
                          index < recentCalls.length - 1
                            ? '1px solid rgba(255, 255, 255, 0.05)'
                            : 'none',
                      }}
                    >
                      <ListItemIcon>
                        <Avatar
                          sx={{
                            bgcolor: `${getOutcomeColor(call.outcome)}.main`,
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getOutcomeIcon(call.outcome)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={call.contactName}
                        secondary={
                          <div>
                            <Typography variant="body2" color="text.secondary">
                              {call.phoneNumber} • {call.duration}
                            </Typography>
                            {call.notes && (
                              <Typography variant="caption" color="text.secondary">
                                {call.notes}
                              </Typography>
                            )}
                          </div>
                        }
                      />
                      <div style={{ textAlign: 'right' }}>
                        <Chip
                          label={call.outcome.replace('-', ' ')}
                          size="small"
                          color={getOutcomeColor(call.outcome) as any}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption" display="block" color="text.secondary">
                          {new Date(call.timestamp).toLocaleTimeString()}
                        </Typography>
                      </div>
                    </ListItem>
                  ))}
                </List>
              </Card>
            </motion.div>
          )}

          {tabValue === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>
                Complete Call History
              </Typography>
              {/* Add full call history table/list here */}
              <Typography color="text.secondary">
                Full call history with filters and search coming soon...
              </Typography>
            </motion.div>
          )}

          {tabValue === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>
                Advanced Analytics
              </Typography>
              {/* Add charts and graphs here */}
              <Typography color="text.secondary">
                Performance charts and analytics coming soon...
              </Typography>
            </motion.div>
          )}

          {tabValue === 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>
                AI-Powered Insights
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      p: 3,
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Best Call Times
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI analysis shows your highest success rate is between 2-4 PM on Tuesdays and
                      Thursdays.
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      p: 3,
                      background: 'rgba(236, 72, 153, 0.1)',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                    }}
                  >
                    <Typography variant="h6" gutterBottom>
                      Conversation Patterns
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Calls with product demonstrations have 45% higher close rates.
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
