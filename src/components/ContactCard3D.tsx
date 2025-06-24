import React, { useRef, useState, useEffect } from 'react';
import { Typography, Avatar, Chip } from '@mui/material';
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
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden' as const,
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
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
      <style>
        {`
          .contact-card-3d::before {
            content: "";
            position: absolute;
            inset: -2px;
            border-radius: 20px;
            padding: 2px;
            background: linear-gradient(135deg, #6366F1, #8B5CF6, #06B6D4);
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: exclude;
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.3s;
          }
          .contact-card-3d:hover::before {
            opacity: 1;
          }
          .screw::after {
            content: "";
            position: absolute;
            inset: 2px;
            background: linear-gradient(45deg, transparent 45%, #606060 45%, #606060 55%, transparent 55%);
            border-radius: 50%;
          }
        `}
      </style>
      <div
        ref={cardRef}
        className="contact-card-3d"
        style={{
          background: 'rgba(17, 25, 40, 0.75)',
          backdropFilter: 'blur(16px) saturate(150%)',
          WebkitBackdropFilter: 'blur(16px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          position: 'relative',
          width: '100%',
          height: '380px',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          borderRadius: '20px',
        }}
        onMouseMove={handleMouseMove}
        onClick={() => setIsFlipped(!isFlipped)}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          handleMouseLeave();
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12)';
        }}
      >
        {/* Precision Screws - Balanced Bezel Logic */}
        <div className="screw screw-top-left" style={{
          position: 'absolute',
          top: '6px',
          left: '5%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #C0C0C0, #808080)',
          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.3)',
          transform: 'rotate(10deg)',
        }} />
        <div className="screw screw-top-center" style={{
          position: 'absolute',
          top: '6px',
          left: '50%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #C0C0C0, #808080)',
          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.3)',
          transform: 'translateX(-50%) rotate(3deg)',
        }} />
        <div className="screw screw-top-right" style={{
          position: 'absolute',
          top: '6px',
          right: '5%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #C0C0C0, #808080)',
          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.3)',
          transform: 'rotate(20deg)',
        }} />
        <div className="screw screw-bot-left" style={{
          position: 'absolute',
          bottom: '6px',
          left: '5%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #C0C0C0, #808080)',
          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.3)',
          transform: 'rotate(8deg)',
        }} />
        <div className="screw screw-bot-center" style={{
          position: 'absolute',
          bottom: '6px',
          left: '50%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #C0C0C0, #808080)',
          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.3)',
          transform: 'translateX(-50%) rotate(-3deg)',
        }} />
        <div className="screw screw-bot-right" style={{
          position: 'absolute',
          bottom: '6px',
          right: '5%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #C0C0C0, #808080)',
          boxShadow: 'inset -1px -1px 2px rgba(0,0,0,0.5), 0 1px 1px rgba(255,255,255,0.3)',
          transform: 'rotate(-10deg)',
        }} />

        {/* Front Face */}
        <div style={frontFace}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
            <div style={{ flex: 1 }}>
              <Typography variant="h5" fontWeight="600" color="primary.light">
                {contact.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {contact.callCount} calls
              </Typography>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <PhoneIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="body1">{contact.phoneNumber}</Typography>
            </div>
            {contact.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <EmailIcon sx={{ color: 'secondary.main', fontSize: 20 }} />
                <Typography variant="body1">{contact.email}</Typography>
              </div>
            )}
          </div>

          {contact.tags && contact.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
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
            </div>
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
        </div>

        {/* Back Face */}
        <div style={backFace}>
          <Typography variant="h6" fontWeight="600" mb={2}>
            Notes & Details
          </Typography>
          
          {contact.notes ? (
            <div
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(0,0,0,0.2)',
                overflowY: 'auto',
              }}
            >
              <Typography variant="body2">{contact.notes}</Typography>
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.5,
              }}
            >
              <NotesIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body2">No notes yet</Typography>
            </div>
          )}

          {contact.lastCall && (
            <Typography variant="caption" color="text.secondary" mt="auto">
              Last call: {new Date(contact.lastCall).toLocaleDateString()}
            </Typography>
          )}
        </div>
      </div>
    </motion.div>
  );
};