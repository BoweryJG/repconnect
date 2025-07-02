import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import { motion } from 'framer-motion';
import FireIcon from '@mui/icons-material/Whatshot';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import StarIcon from '@mui/icons-material/Star';
import { EnrichedLead } from '../lib/enrichment/EnrichmentEngine';

interface HottestLeadsShowcaseProps {
  leads: EnrichedLead[];
}

export const HottestLeadsShowcase: React.FC<HottestLeadsShowcaseProps> = ({ leads }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#ff0040';
    if (score >= 80) return '#ff4757';
    if (score >= 70) return '#ff6348';
    if (score >= 60) return '#ffa502';
    return '#00d2d3';
  };

  const getSegmentIcon = (segment: string) => {
    switch (segment) {
      case 'champion':
        return '👑';
      case 'decision-maker':
        return '🎯';
      case 'researcher':
        return '🔍';
      case 'quick-win':
        return '⚡';
      default:
        return '❄️';
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <Paper sx={{ 
        p: 4, 
        mb: 4,
        background: 'linear-gradient(135deg, rgba(255, 0, 64, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)',
        border: '1px solid rgba(255, 0, 64, 0.2)',
        textAlign: 'center'
      }}>
        <FireIcon sx={{ fontSize: 60, color: '#ff0040', mb: 2 }} />
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
          Your 10 Hottest Leads
        </Typography>
        <Typography variant="h6" color="text.secondary">
          These contacts show the highest engagement and buying potential
        </Typography>
      </Paper>

      {/* Lead Cards */}
      <Grid container spacing={3}>
        {leads.map((lead, index) => (
          <Grid item xs={12} md={6} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card sx={{ 
                height: '100%',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
                overflow: 'visible',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: `${getScoreColor(lead.enriched.heatScore)}40`,
                  boxShadow: `0 8px 32px ${getScoreColor(lead.enriched.heatScore)}20`
                }
              }}>
                {/* Rank Badge */}
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: 20,
                  background: `linear-gradient(135deg, ${getScoreColor(lead.enriched.heatScore)} 0%, ${getScoreColor(lead.enriched.heatScore)}dd 100%)`,
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 4px 20px ${getScoreColor(lead.enriched.heatScore)}60`
                }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                    {index + 1}
                  </Typography>
                </div>

                <CardContent sx={{ pt: 4 }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Avatar sx={{ 
                        width: 56, 
                        height: 56,
                        background: `linear-gradient(135deg, ${getScoreColor(lead.enriched.heatScore)}40 0%, ${getScoreColor(lead.enriched.heatScore)}20 100%)`,
                        border: `2px solid ${getScoreColor(lead.enriched.heatScore)}60`
                      }}>
                        <PersonIcon />
                      </Avatar>
                      <div>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {lead.enriched.fullName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.enriched.title}
                        </Typography>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <BusinessIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {lead.enriched.company} • {lead.enriched.companySize}
                          </Typography>
                        </div>
                      </div>
                    </div>
                    
                    {/* Heat Score */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        position: 'relative',
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          background: `conic-gradient(${getScoreColor(lead.enriched.heatScore)} ${lead.enriched.heatScore * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`,
                        }} />
                        <div style={{
                          position: 'absolute',
                          inset: 4,
                          borderRadius: '50%',
                          background: '#0a0a0a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: getScoreColor(lead.enriched.heatScore) }}>
                            {lead.enriched.heatScore}
                          </Typography>
                        </div>
                      </div>
                      <Typography variant="caption" color="text.secondary">
                        Heat Score
                      </Typography>
                    </div>
                  </div>

                  {/* Segment & Industry */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    <Chip
                      icon={<span style={{ fontSize: 16 }}>{getSegmentIcon(lead.enriched.segment)}</span>}
                      label={lead.enriched.segment}
                      size="small"
                      sx={{
                        background: `${getScoreColor(lead.enriched.heatScore)}20`,
                        border: `1px solid ${getScoreColor(lead.enriched.heatScore)}40`
                      }}
                    />
                    <Chip
                      label={lead.enriched.industry}
                      size="small"
                      variant="outlined"
                    />
                    {lead.enriched.titleLevel && (
                      <Chip
                        label={lead.enriched.titleLevel}
                        size="small"
                        variant="outlined"
                        color={lead.enriched.titleLevel === 'C-Suite' ? 'error' : 'default'}
                      />
                    )}
                  </div>

                  {/* Scoring Factors */}
                  <div style={{ marginBottom: 24 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Why they're hot:
                    </Typography>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {lead.enriched.scoringFactors.slice(0, 3).map((factor, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TrendingUpIcon sx={{ 
                            fontSize: 16, 
                            color: factor.impact === 'positive' ? '#00ff88' : '#ff4757' 
                          }} />
                          <Typography variant="caption">
                            {factor.factor} (+{factor.weight})
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engagement History */}
                  {lead.enriched.engagementHistory && (
                    <div style={{ marginBottom: 24, padding: 16, background: 'rgba(0, 255, 136, 0.05)', borderRadius: 8 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        Recent Activity:
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Website Visits
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {lead.enriched.engagementHistory.websiteVisits}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Content Downloads
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {lead.enriched.engagementHistory.contentDownloads}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Webinars Attended
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {lead.enriched.engagementHistory.webinarAttendance}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Last Seen
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {lead.enriched.engagementHistory.lastEngagement ? new Date(lead.enriched.engagementHistory.lastEngagement).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </div>
                  )}

                  {/* Contact Actions */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Tooltip title={lead.enriched.email}>
                      <IconButton 
                        size="small"
                        sx={{ 
                          background: 'rgba(99, 102, 241, 0.1)',
                          '&:hover': { background: 'rgba(99, 102, 241, 0.2)' }
                        }}
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={lead.enriched.phone}>
                      <IconButton 
                        size="small"
                        sx={{ 
                          background: 'rgba(236, 72, 153, 0.1)',
                          '&:hover': { background: 'rgba(236, 72, 153, 0.2)' }
                        }}
                      >
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {lead.enriched.linkedin && (
                      <Tooltip title="View LinkedIn">
                        <IconButton 
                          size="small"
                          onClick={() => window.open(lead.enriched.linkedin, '_blank')}
                          sx={{ 
                            background: 'rgba(0, 119, 181, 0.1)',
                            '&:hover': { background: 'rgba(0, 119, 181, 0.2)' }
                          }}
                        >
                          <LinkedInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <div style={{ flex: 1 }} />
                    <Tooltip title="Add to favorites">
                      <IconButton 
                        size="small"
                        sx={{ 
                          background: 'rgba(255, 215, 0, 0.1)',
                          '&:hover': { background: 'rgba(255, 215, 0, 0.2)' }
                        }}
                      >
                        <StarIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};