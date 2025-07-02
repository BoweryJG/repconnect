import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { motion } from 'framer-motion';
import { EnrichedLead } from '../lib/enrichment/EnrichmentEngine';

interface LeadHeatMapProps {
  leads: EnrichedLead[];
}

// interface HeatMapCell {
//   lead: EnrichedLead;
//   x: number;
//   y: number;
// }

export const LeadHeatMap: React.FC<LeadHeatMapProps> = ({ leads }) => {
  const [groupBy, setGroupBy] = useState<'industry' | 'companySize' | 'segment'>('industry');
  const [sortBy, setSortBy] = useState<'heatScore' | 'alphabetical'>('heatScore');

  const groupedLeads = useMemo(() => {
    const groups: Record<string, EnrichedLead[]> = {};
    
    leads.forEach(lead => {
      let key = '';
      switch (groupBy) {
        case 'industry':
          key = lead.enriched.industry || 'Unknown';
          break;
        case 'companySize':
          key = lead.enriched.companySize || 'Unknown';
          break;
        case 'segment':
          key = lead.enriched.segment;
          break;
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(lead);
    });

    // Sort groups
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        if (sortBy === 'heatScore') {
          return b.enriched.heatScore - a.enriched.heatScore;
        } else {
          return a.enriched.fullName.localeCompare(b.enriched.fullName);
        }
      });
    });

    return groups;
  }, [leads, groupBy, sortBy]);

  const getHeatColor = (score: number) => {
    // Create gradient from blue (cold) to red (hot)
    const colors = [
      { score: 0, r: 0, g: 122, b: 255 },     // Blue
      { score: 25, r: 0, g: 212, b: 255 },    // Cyan
      { score: 50, r: 255, g: 215, b: 0 },    // Gold
      { score: 75, r: 255, g: 107, b: 53 },   // Orange
      { score: 100, r: 255, g: 0, b: 64 }     // Red
    ];

    // Find the two colors to interpolate between
    let lowerColor = colors[0];
    let upperColor = colors[colors.length - 1];
    
    for (let i = 0; i < colors.length - 1; i++) {
      if (score >= colors[i].score && score <= colors[i + 1].score) {
        lowerColor = colors[i];
        upperColor = colors[i + 1];
        break;
      }
    }

    // Interpolate
    const range = upperColor.score - lowerColor.score;
    const factor = (score - lowerColor.score) / range;
    
    const r = Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * factor);
    const g = Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * factor);
    const b = Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * factor);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getSegmentEmoji = (segment: string) => {
    const emojis = {
      'champion': '👑',
      'decision-maker': '🎯',
      'researcher': '🔍',
      'quick-win': '⚡',
      'cold': '❄️'
    };
    return emojis[segment as keyof typeof emojis] || '📊';
  };

  return (
    <Box>
      {/* Controls */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Lead Heat Map
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Visualize your leads by engagement and potential
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Group By</InputLabel>
              <Select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                label="Group By"
              >
                <MenuItem value="industry">Industry</MenuItem>
                <MenuItem value="companySize">Company Size</MenuItem>
                <MenuItem value="segment">Segment</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                label="Sort By"
              >
                <MenuItem value="heatScore">Heat Score</MenuItem>
                <MenuItem value="alphabetical">Alphabetical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Heat Map Legend */}
      <Paper sx={{ 
        p: 2, 
        mb: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle2">Heat Score:</Typography>
          <Box sx={{ 
            flex: 1, 
            height: 20,
            borderRadius: 2,
            background: `linear-gradient(to right, 
              ${getHeatColor(0)} 0%, 
              ${getHeatColor(25)} 25%, 
              ${getHeatColor(50)} 50%, 
              ${getHeatColor(75)} 75%, 
              ${getHeatColor(100)} 100%
            )`
          }} />
          <Typography variant="caption">Cold (0)</Typography>
          <Typography variant="caption">Hot (100)</Typography>
        </Box>
      </Paper>

      {/* Heat Map Grid */}
      <Grid container spacing={3}>
        {Object.entries(groupedLeads).map(([groupName, groupLeads]) => (
          <Grid item xs={12} key={groupName}>
            <Paper sx={{ 
              p: 3,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {groupName} ({groupLeads.length})
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 1
              }}>
                {groupLeads.map((lead, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    whileHover={{ scale: 1.05, zIndex: 10 }}
                  >
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="subtitle2">{lead.enriched.fullName}</Typography>
                          <Typography variant="caption">{lead.enriched.title}</Typography>
                          <Typography variant="caption" display="block">{lead.enriched.company}</Typography>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption">Heat Score: {lead.enriched.heatScore}</Typography>
                          </Box>
                        </Box>
                      }
                      arrow
                    >
                      <Card
                        sx={{
                          height: 80,
                          background: getHeatColor(lead.enriched.heatScore),
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: `0 8px 24px ${getHeatColor(lead.enriched.heatScore)}60`,
                            borderColor: 'rgba(255, 255, 255, 0.4)'
                          }
                        }}
                      >
                        <CardContent sx={{ 
                          p: 1.5, 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 600,
                              color: 'white',
                              lineHeight: 1.2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {lead.enriched.fullName.split(' ')[1]}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontWeight: 800,
                                color: 'white',
                                fontSize: '16px'
                              }}
                            >
                              {lead.enriched.heatScore}
                            </Typography>
                            <Typography sx={{ fontSize: '16px' }}>
                              {getSegmentEmoji(lead.enriched.segment)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Tooltip>
                  </motion.div>
                ))}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(255, 0, 64, 0.1) 0%, rgba(255, 0, 64, 0.05) 100%)',
            border: '1px solid rgba(255, 0, 64, 0.2)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Hottest Group
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                {Object.entries(groupedLeads)
                  .map(([name, leads]) => ({
                    name,
                    avgScore: leads.reduce((sum, l) => sum + l.enriched.heatScore, 0) / leads.length
                  }))
                  .sort((a, b) => b.avgScore - a.avgScore)[0]?.name || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Largest Group
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                {Object.entries(groupedLeads)
                  .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Champions Found
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1 }}>
                {leads.filter(l => l.enriched.segment === 'champion').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};