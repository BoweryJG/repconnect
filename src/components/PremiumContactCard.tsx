import React, { useState } from 'react';
import { Box, Typography, Avatar, Chip, IconButton, Tooltip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import MessageIcon from '@mui/icons-material/Message';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
// Premium glassmorphism styles will be defined inline

interface PremiumContactCardProps {
  contact: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    avatar?: string;
    lastCall?: Date;
    callCount: number;
    notes?: string;
    tags?: string[];
    isFavorite?: boolean;
  };
  onClick?: () => void;
  onCall?: () => void;
}

export const PremiumContactCard: React.FC<PremiumContactCardProps> = ({ contact, onClick, onCall }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  return (
    <motion.div
      style={{ position: 'relative', height: 280 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFlipped ? 'back' : 'front'}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            cursor: 'pointer',
          }}
          initial={{ rotateY: isFlipped ? -180 : 0, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: isFlipped ? 0 : 180, opacity: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            // Front of card
            <Box
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: contact.isFavorite 
                  ? '0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.3)' 
                  : '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 3,
                transition: 'all 0.4s ease',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  background: 'linear-gradient(135deg, #6366F1, #EC4899, #3B82F6)',
                  backgroundSize: '300% 300%',
                  borderRadius: 'inherit',
                  opacity: 0.3,
                  filter: 'blur(10px)',
                  zIndex: -1,
                },
              }}
            >
              {/* Animated background gradient */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -100,
                  right: -100,
                  width: 200,
                  height: 200,
                  background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  opacity: isHovered ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              />

              {/* Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={contact.avatar}
                  sx={{
                    width: 56,
                    height: 56,
                    background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  {!contact.avatar && getInitials(contact.name)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #D1D5DB 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {contact.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                    {formatPhoneNumber(contact.phoneNumber)}
                  </Typography>
                </Box>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle favorite
                  }}
                  sx={{ 
                    color: contact.isFavorite ? '#F59E0B' : 'text.secondary',
                    '&:hover': {
                      transform: 'scale(1.2) rotate(10deg)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {contact.isFavorite ? <StarIcon /> : <StarBorderIcon />}
                </IconButton>
              </Box>

              {/* Stats */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ 
                  flex: 1, 
                  p: 1.5, 
                  borderRadius: 2,
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon sx={{ fontSize: 18, color: '#6366F1' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Calls
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#6366F1' }}>
                    {contact.callCount}
                  </Typography>
                </Box>
                {contact.lastCall && (
                  <Box sx={{ 
                    flex: 1, 
                    p: 1.5, 
                    borderRadius: 2,
                    background: 'rgba(236, 72, 153, 0.1)',
                    border: '1px solid rgba(236, 72, 153, 0.2)',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 18, color: '#EC4899' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Last Call
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#EC4899' }}>
                      {new Date(contact.lastCall).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {contact.tags.slice(0, 3).map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      size="small"
                      sx={{
                        background: 'rgba(99, 102, 241, 0.1)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818CF8',
                        fontWeight: 500,
                        '&:hover': {
                          background: 'rgba(99, 102, 241, 0.2)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    />
                  ))}
                  {contact.tags.length > 3 && (
                    <Chip
                      label={`+${contact.tags.length - 3}`}
                      size="small"
                      sx={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'text.secondary',
                      }}
                    />
                  )}
                </Box>
              )}

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                <Tooltip title="Call">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onCall?.();
                    }}
                    sx={{
                      flex: 1,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      color: '#10B981',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
                      },
                    }}
                  >
                    <PhoneIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Message">
                  <IconButton
                    sx={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: '#3B82F6',
                        background: 'rgba(59, 130, 246, 0.1)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <MessageIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Email">
                  <IconButton
                    sx={{
                      flex: 1,
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: '#EC4899',
                        background: 'rgba(236, 72, 153, 0.1)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    disabled={!contact.email}
                  >
                    <EmailIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            // Back of card
            <Box
              sx={{
                height: '100%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
                borderRadius: 3,
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                Contact Details
              </Typography>
              
              {contact.email && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {contact.email}
                  </Typography>
                </Box>
              )}

              {contact.notes && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Notes
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {contact.notes}
                  </Typography>
                </Box>
              )}

              {contact.tags && contact.tags.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    All Tags
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {contact.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          color: '#818CF8',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Typography 
                variant="caption" 
                sx={{ 
                  mt: 'auto', 
                  textAlign: 'center', 
                  color: 'text.secondary',
                  opacity: 0.6,
                }}
              >
                Click to flip back
              </Typography>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};