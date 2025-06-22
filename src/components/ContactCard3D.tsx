import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, Avatar, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import NotesIcon from '@mui/icons-material/Notes';
// Removed glassmorphism imports - using inline styles for TypeScript compatibility
import { adaptiveRenderer } from '../lib/performance/AdaptiveRenderer';

interface ContactCard3DProps {
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
  };
  onClick?: () => void;
  onCall?: () => void;
}

export const ContactCard3D: React.FC<ContactCard3DProps> = ({ contact, onClick, onCall }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [enable3D, setEnable3D] = useState(true);

  useEffect(() => {
    const unsubscribe = adaptiveRenderer.subscribe((settings) => {
      setEnable3D(settings.enable3D);
    });
    return () => unsubscribe();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D || !cardRef.current) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
  };

  const frontFace = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    transform: 'rotateY(0deg)',
  };

  const backFace = {
    ...frontFace,
    transform: 'rotateY(180deg)',
    background: 'rgba(139, 92, 246, 0.15)',
    backdropFilter: 'blur(16px) saturate(150%)',
    WebkitBackdropFilter: 'blur(16px) saturate(150%)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        ref={cardRef}
        sx={{
          background: 'rgba(17, 25, 40, 0.75)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          position: 'relative',
          width: '100%',
          height: 380,
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          borderRadius: '20px',
          '&:hover': {
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: '-2px',
            borderRadius: '20px',
            padding: '2px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #06B6D4)',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'exclude',
            maskComposite: 'exclude',
            opacity: 0,
            transition: 'opacity 0.3s',
          },
          '&:hover::before': {
            opacity: 1,
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Face */}
        <Box sx={frontFace}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={contact.avatar}
              alt={contact.name}
              sx={{
                width: 80,
                height: 80,
                border: '3px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="600" color="primary.light">
                {contact.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contact.callCount} calls
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PhoneIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body1">{contact.phoneNumber}</Typography>
            </Box>
            {contact.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <EmailIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="body1">{contact.email}</Typography>
              </Box>
            )}
          </Box>

          {contact.tags && contact.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 'auto' }}>
              {contact.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  sx={{
                    background: 'rgba(99, 102, 241, 0.2)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: 'primary.light',
                  }}
                />
              ))}
            </Box>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onCall?.();
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              backdropFilter: 'blur(16px) saturate(150%)',
              WebkitBackdropFilter: 'blur(16px) saturate(150%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.2)',
              padding: '12px 24px',
              borderRadius: '12px',
              color: 'white',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginTop: 'auto',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3), 0 0 40px rgba(16, 185, 129, 0.2)';
            }}
          >
            <PhoneIcon /> Call Now
          </motion.button>
        </Box>

        {/* Back Face */}
        <Box sx={backFace}>
          <Typography variant="h6" fontWeight="600" mb={2}>
            Notes & Details
          </Typography>
          
          {contact.notes ? (
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 2,
                background: 'rgba(0,0,0,0.2)',
                overflowY: 'auto',
              }}
            >
              <Typography variant="body2">{contact.notes}</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.5,
              }}
            >
              <NotesIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2">No notes yet</Typography>
            </Box>
          )}

          {contact.lastCall && (
            <Typography variant="caption" color="text.secondary" mt="auto">
              Last call: {new Date(contact.lastCall).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Box>
    </motion.div>
  );
};