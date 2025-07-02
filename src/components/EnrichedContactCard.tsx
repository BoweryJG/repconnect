import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
  Grid,
  Divider,
  LinearProgress,
  Tooltip,
  Button,
  Link
} from '@mui/material';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import FaxIcon from '@mui/icons-material/Fax';
import LanguageIcon from '@mui/icons-material/Language';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import AccessibleIcon from '@mui/icons-material/Accessible';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import StarIcon from '@mui/icons-material/Star';
import { EnrichedContact } from '../lib/mockData/enrichmentGenerator';

interface EnrichedContactCardProps {
  contact: EnrichedContact;
}

export const EnrichedContactCard: React.FC<EnrichedContactCardProps> = ({ contact }) => {
  const [expanded, setExpanded] = useState(false);

  const getSegmentColor = (segment: string) => {
    const colors = {
      'champion': '#ff0040',
      'decision-maker': '#ff8800',
      'researcher': '#00d4ff',
      'quick-win': '#00ff88',
      'cold': '#6366f1'
    };
    return colors[segment as keyof typeof colors] || '#666';
  };

  const getLeadQualityColor = (quality: string) => {
    const colors = {
      'A+': '#00ff88',
      'A': '#4bd48e',
      'B': '#ffd93d',
      'C': '#ff8800',
      'D': '#ff0040'
    };
    return colors[quality as keyof typeof colors] || '#666';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }
      }}>
        <CardContent>
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {contact.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {contact.title} • {contact.yearsExperience} years experience
              </Typography>
              <Typography variant="body2" color="primary" sx={{ mt: 0.5 }}>
                {contact.practice_name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Chip
                label={contact.segment}
                size="small"
                sx={{
                  backgroundColor: `${getSegmentColor(contact.segment)}20`,
                  borderColor: getSegmentColor(contact.segment),
                  color: getSegmentColor(contact.segment),
                  border: '1px solid',
                  fontWeight: 600
                }}
              />
              <Chip
                label={contact.leadQuality}
                size="small"
                sx={{
                  backgroundColor: `${getLeadQualityColor(contact.leadQuality)}20`,
                  borderColor: getLeadQualityColor(contact.leadQuality),
                  color: getLeadQualityColor(contact.leadQuality),
                  border: '1px solid',
                  fontWeight: 600
                }}
              />
            </Box>
          </Box>

          {/* Heat Score and Ratings */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">Heat Score</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={contact.heatScore}
                    sx={{
                      width: 100,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        background: contact.heatScore > 80 
                          ? 'linear-gradient(90deg, #ff6b6b 0%, #ff0040 100%)'
                          : contact.heatScore > 60
                          ? 'linear-gradient(90deg, #ffd43b 0%, #ff8800 100%)'
                          : 'linear-gradient(90deg, #4ecdc4 0%, #00d4ff 100%)'
                      }
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {contact.heatScore}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Overall Rating</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <StarIcon sx={{ color: '#ffd93d', fontSize: 20 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {contact.overallRating}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({contact.totalReviews} reviews)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Quick Actions */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Tooltip title={contact.email}>
              <IconButton size="small" sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={contact.phone}>
              <IconButton size="small" sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                <PhoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={contact.mobile}>
              <IconButton size="small" sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                <SmartphoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Visit Website">
              <IconButton 
                size="small" 
                sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                onClick={() => window.open(`https://${contact.website}`, '_blank')}
              >
                <LanguageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="LinkedIn Profile">
              <IconButton 
                size="small" 
                sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}
                onClick={() => window.open(contact.linkedin, '_blank')}
              >
                <LinkedInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Key Info Chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {contact.acceptingNewPatients && (
              <Chip
                icon={<CheckCircleIcon />}
                label="Accepting New Patients"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
            {contact.telehealth && (
              <Chip
                icon={<VideoCallIcon />}
                label="Telehealth Available"
                size="small"
                color="info"
                variant="outlined"
              />
            )}
            {contact.parkingAvailable && (
              <Chip
                icon={<DirectionsCarIcon />}
                label="Parking"
                size="small"
                variant="outlined"
              />
            )}
            {contact.wheelchairAccessible && (
              <Chip
                icon={<AccessibleIcon />}
                label="Wheelchair Accessible"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          {/* Expand Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          {/* Expanded Content */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              {/* Contact Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Contact Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{contact.email}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{contact.phone}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmartphoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{contact.mobile}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaxIcon fontSize="small" color="action" />
                    <Typography variant="body2">{contact.fax}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LanguageIcon fontSize="small" color="action" />
                    <Link href={`https://${contact.website}`} target="_blank" rel="noopener">
                      {contact.website}
                    </Link>
                  </Box>
                </Box>
              </Grid>

              {/* Location */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Box>
                    <Typography variant="body2">{contact.address}</Typography>
                    {contact.suite && <Typography variant="body2">{contact.suite}</Typography>}
                    <Typography variant="body2">
                      {contact.city}, {contact.state} {contact.zipCode}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Professional Info */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Professional Background
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{contact.bio}</Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Education</Typography>
                  {contact.education.map((edu, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      • {edu}
                    </Typography>
                  ))}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Certifications</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {contact.certifications.map((cert, index) => (
                      <Chip key={index} label={cert} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Languages</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {contact.languages.map((lang, index) => (
                      <Chip key={index} label={lang} size="small" color="primary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              </Grid>

              {/* Practice Details */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Insurance Accepted
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {contact.insuranceAccepted.slice(0, 5).map((ins, index) => (
                    <Chip key={index} label={ins} size="small" variant="outlined" />
                  ))}
                  {contact.insuranceAccepted.length > 5 && (
                    <Chip 
                      label={`+${contact.insuranceAccepted.length - 5} more`} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </Grid>

              {/* Office Hours */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Office Hours
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 0.5 }}>
                  {Object.entries(contact.officeHours).map(([day, hours]) => (
                    <React.Fragment key={day}>
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                        {day}:
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {hours}
                      </Typography>
                    </React.Fragment>
                  ))}
                </Box>
              </Grid>

              {/* Ratings Breakdown */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Ratings & Reviews
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Google</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ color: '#ffd93d', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {contact.googleRating}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        ({contact.googleReviewCount})
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Yelp</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ color: '#ffd93d', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {contact.yelpRating}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        ({contact.yelpReviewCount})
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Healthgrades</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <StarIcon sx={{ color: '#ffd93d', fontSize: 16 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {contact.healthgradesRating}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        ({contact.healthgradesReviewCount})
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Social Media */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Social Media & Online Presence
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<LinkedInIcon />}
                    onClick={() => window.open(contact.linkedin, '_blank')}
                    variant="outlined"
                  >
                    LinkedIn
                  </Button>
                  <Button
                    size="small"
                    startIcon={<FacebookIcon />}
                    onClick={() => window.open(contact.facebook, '_blank')}
                    variant="outlined"
                  >
                    Facebook
                  </Button>
                  <Button
                    size="small"
                    startIcon={<TwitterIcon />}
                    onClick={() => window.open(contact.twitter, '_blank')}
                    variant="outlined"
                  >
                    Twitter
                  </Button>
                  <Button
                    size="small"
                    startIcon={<InstagramIcon />}
                    onClick={() => window.open(`https://instagram.com/${contact.instagram.replace('@', '')}`, '_blank')}
                    variant="outlined"
                  >
                    Instagram
                  </Button>
                  <Button
                    size="small"
                    startIcon={<LocalHospitalIcon />}
                    onClick={() => window.open(contact.healthgrades, '_blank')}
                    variant="outlined"
                  >
                    Healthgrades
                  </Button>
                </Box>
              </Grid>

              {/* Metadata */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Enriched: {new Date(contact.lastEnriched).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      Source: {contact.enrichmentSource}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Data Completeness:
                    </Typography>
                    <Chip
                      label={`${contact.dataCompleteness}%`}
                      size="small"
                      color={contact.dataCompleteness === 100 ? 'success' : 'warning'}
                    />
                    <Chip
                      label={contact.verificationStatus}
                      size="small"
                      color={contact.verificationStatus === 'verified' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};