import React, { useState, useEffect, useRef } from 'react';
import { IconButton, Typography, Portal } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneIcon from '@mui/icons-material/Phone';
import BackspaceIcon from '@mui/icons-material/Backspace';
import MicIcon from '@mui/icons-material/Mic';
import CloseIcon from '@mui/icons-material/Close';
import { keyframes } from '@mui/material';
import { useResponsive } from '../hooks/useResponsive';
import { Phone3DVisualizer } from './Phone3DVisualizer';

const hologramPulse = keyframes`
  0% {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8),
                0 0 40px rgba(0, 255, 255, 0.6),
                0 0 60px rgba(0, 255, 255, 0.4),
                inset 0 0 20px rgba(0, 255, 255, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 255, 255, 1),
                0 0 60px rgba(0, 255, 255, 0.8),
                0 0 90px rgba(0, 255, 255, 0.6),
                inset 0 0 30px rgba(0, 255, 255, 0.3);
  }
  100% {
    box-shadow: 0 0 20px rgba(0, 255, 255, 0.8),
                0 0 40px rgba(0, 255, 255, 0.6),
                0 0 60px rgba(0, 255, 255, 0.4),
                inset 0 0 20px rgba(0, 255, 255, 0.2);
  }
`;

const scanlineAnimation = keyframes`
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
`;

interface QuantumDialerProps {
  isOpen: boolean;
  onClose: () => void;
  onDial: (number: string) => void;
}

export const QuantumDialer: React.FC<QuantumDialerProps> = ({ isOpen, onClose, onDial }) => {
  const { isMobile } = useResponsive();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Holographic effect canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isOpen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 500;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }> = [];

    const createParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 200 + Math.random() * 50;
      particles.push({
        x: 250 + Math.cos(angle) * radius,
        y: 250 + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Add particles
      if (Math.random() > 0.8) createParticle();

      // Update and draw particles
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.globalAlpha = particle.life * 0.5;
        ctx.fillStyle = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FFFF';
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw holographic grid
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 10; i++) {
        const x = (i * 50) + 25;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 500);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, x);
        ctx.lineTo(500, x);
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isOpen]);

  const handleNumberClick = (num: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleDial = () => {
    if (phoneNumber.length >= 10) {
      onDial(phoneNumber);
      setPhoneNumber('');
      onClose();
    }
  };

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return number;
    
    const parts = match.slice(1).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
    return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
  };

  const dialerNumbers = [
    { num: '1', letters: '' },
    { num: '2', letters: 'ABC' },
    { num: '3', letters: 'DEF' },
    { num: '4', letters: 'GHI' },
    { num: '5', letters: 'JKL' },
    { num: '6', letters: 'MNO' },
    { num: '7', letters: 'PQRS' },
    { num: '8', letters: 'TUV' },
    { num: '9', letters: 'WXYZ' },
  ];

  return (
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2000,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(10px)',
            }}
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateX: -45 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotateX: 45 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                width: isMobile ? '95vw' : 500,
                maxWidth: 500,
                height: isMobile ? 'auto' : 700,
                maxHeight: isMobile ? '90vh' : 700,
              }}
            >
              {/* Holographic Background */}
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.6,
                  pointerEvents: 'none',
                }}
              />

              {/* Main Dialer Container */}
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.9) 0%, rgba(0, 40, 80, 0.8) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(0, 255, 255, 0.3)',
                  borderRadius: '32px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: `${hologramPulse} 2s ease-in-out infinite`,
                }}
              >
                {/* Scanline Effect */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%)',
                    animation: `${scanlineAnimation} 3s linear infinite`,
                    pointerEvents: 'none',
                  }}
                />

                {/* Header */}
                <div style={{ padding: isMobile ? '16px' : '24px', textAlign: 'center', position: 'relative', flex: '0 0 auto' }}>
                  <IconButton
                    onClick={onClose}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      color: '#00FFFF',
                      '&:hover': {
                        color: '#FFFFFF',
                        background: 'rgba(0, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <CloseIcon />
                  </IconButton>

                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      letterSpacing: 3,
                      background: 'linear-gradient(135deg, #00FFFF 0%, #0080FF 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textTransform: 'uppercase',
                      mb: 1,
                    }}
                  >
                    Quantum Dialer
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(0, 255, 255, 0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: 2,
                    }}
                  >
                    Secure Line Protocol 7.0
                  </Typography>
                </div>

                {/* Phone Number Display */}
                <div
                  style={{
                    margin: isMobile ? '0 12px 12px 12px' : '0 24px 20px 24px',
                    padding: isMobile ? '8px' : '12px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '16px',
                    textAlign: 'center',
                    minHeight: isMobile ? '40px' : '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 300,
                      color: phoneNumber ? '#00FFFF' : 'rgba(0, 255, 255, 0.3)',
                      letterSpacing: 2,
                    }}
                  >
                    {formatPhoneNumber(phoneNumber) || 'Enter Number'}
                  </Typography>
                </div>

                {/* 3D Phone Visualizer - Show on larger screens or landscape mobile */}
                {(!isMobile || window.innerHeight < 600) && (
                  <div style={{ flex: '0 0 auto', padding: '8px 0' }}>
                    <Phone3DVisualizer 
                      isActive={phoneNumber.length > 0}
                      phoneNumber={phoneNumber}
                    />
                  </div>
                )}

                {/* Number Pad */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: isMobile ? '8px' : '12px',
                    padding: isMobile ? '0 12px' : '0 24px',
                    marginBottom: isMobile ? '8px' : '12px',
                    flex: '1 1 auto',
                  }}
                >
                  {dialerNumbers.map((item) => (
                    <motion.button
                      key={item.num}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleNumberClick(item.num)}
                      style={{
                        background: 'rgba(0, 255, 255, 0.1)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '50%',
                        aspectRatio: 1,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.6)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: '#00FFFF',
                          fontWeight: 300,
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.num}
                      </Typography>
                      {item.letters && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'rgba(0, 255, 255, 0.6)',
                            fontSize: '0.7rem',
                            letterSpacing: 1,
                          }}
                        >
                          {item.letters}
                        </Typography>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Bottom Row with *, 0, #, and Backspace */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: isMobile ? '8px' : '12px',
                    padding: isMobile ? '0 12px' : '0 24px',
                    marginBottom: isMobile ? '12px' : '24px',
                    alignItems: 'center',
                    justifyItems: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumberClick('*')}
                    style={{
                      background: 'rgba(0, 255, 255, 0.1)',
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      borderRadius: '50%',
                      aspectRatio: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      maxWidth: '80px',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.6)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#00FFFF',
                        fontWeight: 300,
                        fontFamily: 'monospace',
                      }}
                    >
                      *
                    </Typography>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumberClick('0')}
                    style={{
                      background: 'rgba(0, 255, 255, 0.1)',
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      borderRadius: '50%',
                      aspectRatio: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      maxWidth: '80px',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.6)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#00FFFF',
                        fontWeight: 300,
                        fontFamily: 'monospace',
                      }}
                    >
                      0
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(0, 255, 255, 0.6)',
                        fontSize: '0.7rem',
                        letterSpacing: 1,
                      }}
                    >
                      +
                    </Typography>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleNumberClick('#')}
                    style={{
                      background: 'rgba(0, 255, 255, 0.1)',
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      borderRadius: '50%',
                      aspectRatio: 1,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      maxWidth: '80px',
                      minWidth: '60px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.6)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#00FFFF',
                        fontWeight: 300,
                        fontFamily: 'monospace',
                      }}
                    >
                      #
                    </Typography>
                  </motion.button>

                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    style={{
                      width: '100%',
                      maxWidth: '80px',
                      minWidth: '60px',
                      aspectRatio: 1,
                    }}
                  >
                    <IconButton
                      onClick={handleBackspace}
                      sx={{
                        width: '100%',
                        height: '100%',
                        background: 'rgba(255, 100, 100, 0.1)',
                        border: '1px solid rgba(255, 100, 100, 0.3)',
                        color: '#FF6666',
                        '&:hover': {
                          background: 'rgba(255, 100, 100, 0.2)',
                          boxShadow: '0 0 20px rgba(255, 100, 100, 0.5)',
                        },
                      }}
                    >
                      <BackspaceIcon />
                    </IconButton>
                  </motion.div>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: isMobile ? '12px' : '16px',
                    padding: isMobile ? '0 12px 12px' : '0 24px 24px',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                  }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <IconButton
                      onClick={() => setIsVoiceActive(!isVoiceActive)}
                      sx={{
                        width: 60,
                        height: 60,
                        background: isVoiceActive
                          ? 'linear-gradient(135deg, rgba(255, 0, 0, 0.3) 0%, rgba(255, 0, 0, 0.1) 100%)'
                          : 'rgba(0, 255, 255, 0.1)',
                        border: `1px solid ${isVoiceActive ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 255, 0.3)'}`,
                        color: isVoiceActive ? '#FF0000' : '#00FFFF',
                        '&:hover': {
                          background: isVoiceActive
                            ? 'rgba(255, 0, 0, 0.2)'
                            : 'rgba(0, 255, 255, 0.2)',
                          boxShadow: `0 0 20px ${isVoiceActive ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 255, 0.5)'}`,
                        },
                      }}
                    >
                      <MicIcon />
                    </IconButton>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <IconButton
                      onClick={handleDial}
                      disabled={phoneNumber.length < 10}
                      sx={{
                        width: 80,
                        height: 80,
                        background: phoneNumber.length >= 10
                          ? 'linear-gradient(135deg, rgba(0, 255, 0, 0.3) 0%, rgba(0, 255, 0, 0.1) 100%)'
                          : 'rgba(100, 100, 100, 0.1)',
                        border: `2px solid ${phoneNumber.length >= 10 ? 'rgba(0, 255, 0, 0.5)' : 'rgba(100, 100, 100, 0.3)'}`,
                        color: phoneNumber.length >= 10 ? '#00FF00' : '#666666',
                        '&:hover': {
                          background: phoneNumber.length >= 10
                            ? 'rgba(0, 255, 0, 0.2)'
                            : 'rgba(100, 100, 100, 0.1)',
                          boxShadow: phoneNumber.length >= 10
                            ? '0 0 30px rgba(0, 255, 0, 0.5)'
                            : 'none',
                        },
                        '&:disabled': {
                          color: '#666666',
                        },
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 32 }} />
                    </IconButton>
                  </motion.div>
                </div>

                {/* Status Bar */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(0, 255, 255, 0.4)',
                      fontFamily: 'monospace',
                      letterSpacing: 1,
                    }}
                  >
                    {isVoiceActive ? 'VOICE CONTROL ACTIVE' : 'SECURE LINE READY'}
                  </Typography>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
};