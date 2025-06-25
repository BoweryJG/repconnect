import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton,
  Box,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DialpadIcon from '@mui/icons-material/Dialpad';
import SyncIcon from '@mui/icons-material/Sync';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContactsIcon from '@mui/icons-material/Contacts';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { keyframes } from '@mui/material';

// Animations
const screwWiggle = keyframes`
  0%, 100% { transform: rotate(var(--angle)); }
  25% { transform: rotate(calc(var(--angle) + 1.5deg)); }
  50% { transform: rotate(calc(var(--angle) - 1deg)); }
  75% { transform: rotate(calc(var(--angle) + 0.5deg)); }
`;

const jewelPulse = keyframes`
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.2); }
`;

const glassOscillate = keyframes`
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.02); }
`;

const forcefieldRotate = keyframes`
  0% { transform: translate(-50%, -50%) scale(1.15) rotate(0deg); }
  100% { transform: translate(-50%, -50%) scale(1.15) rotate(360deg); }
`;

interface PremiumNavbarProps {
  onDialerOpen: () => void;
  aiEnabled: boolean;
  onAIToggle: () => void;
  onSyncDashboardOpen?: () => void;
  onMissionControlOpen?: () => void;
}

export const PremiumNavbar: React.FC<PremiumNavbarProps> = ({ 
  onDialerOpen, 
  aiEnabled, 
  onAIToggle,
  onSyncDashboardOpen,
  onMissionControlOpen
}) => {
  const theme = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [currentTheme, setCurrentTheme] = useState({
    impossible: '255, 0, 255',
    shift: '0, 255, 255',
    deep: '255, 0, 170'
  });

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
      setScrollOffset(offset * 0.05);
      
      // Dynamic color theme based on scroll
      const windowHeight = window.innerHeight;
      const section = Math.floor(offset / windowHeight);
      
      const themes = [
        { impossible: '255, 0, 255', shift: '0, 255, 255', deep: '255, 0, 170' },
        { impossible: '99, 102, 241', shift: '236, 72, 153', deep: '139, 92, 246' },
        { impossible: '0, 255, 136', shift: '0, 212, 255', deep: '0, 255, 136' },
        { impossible: '255, 107, 53', shift: '255, 204, 224', deep: '245, 57, 105' },
      ];
      
      setCurrentTheme(themes[Math.min(section, themes.length - 1)]);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        paddingTop: 24,
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          position: 'relative',
          left: '50%',
          transform: scrolled ? 'translateX(-50%) scale(0.98) translateZ(30px)' : 'translateX(-50%)',
          width: '96vw',
          maxWidth: 1400,
          height: 60,
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          background: `linear-gradient(to right,
            ${alpha('#1a1a1a', 0.95)} 0%,
            ${alpha('#1e1e1e', 0.9)} 10%,
            ${alpha('#1c1c1c', 0.88)} 50%,
            ${alpha('#1e1e1e', 0.9)} 90%,
            ${alpha('#1a1a1a', 0.95)} 100%
          )`,
          border: `1px solid ${alpha('#ffffff', scrolled ? 0.12 : 0.08)}`,
          borderRadius: '18px',
          boxShadow: scrolled
            ? `0 16px 50px ${alpha('#000000', 0.5)},
               0 0 30px rgba(${currentTheme.impossible}, 0.12),
               0 0 60px rgba(${currentTheme.shift}, 0.06),
               0 2px 20px ${alpha(theme.palette.primary.main, 0.15)},
               inset 0 -1px 1px ${alpha('#ffffff', 0.04)},
               inset 0 1px 0 ${alpha('#ffffff', 0.08)}`
            : `0 12px 40px ${alpha('#000000', 0.4)},
               0 0 20px rgba(${currentTheme.shift}, 0.08),
               0 2px 10px ${alpha('#000000', 0.6)},
               inset 0 1px 0 ${alpha('#ffffff', 0.06)},
               inset 0 -1px 0 ${alpha('#000000', 0.3)}`,
          transformStyle: 'preserve-3d',
          perspective: '1000px',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(${currentTheme.impossible}, 0.03) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(${currentTheme.shift}, 0.03) 0%, transparent 50%),
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 19px,
                ${alpha('#ffffff', 0.01)} 20px
              ),
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 19px,
                ${alpha('#ffffff', 0.01)} 20px
              )`,
            opacity: 0.5,
            transform: `translateY(${scrollOffset}px)`,
            pointerEvents: 'none',
            transition: 'transform 0.1s linear',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(ellipse at top left, ${alpha('#ffffff', 0.06)}, transparent 70%),
              radial-gradient(ellipse at bottom right, rgba(${currentTheme.impossible}, 0.03), transparent 60%)`,
            pointerEvents: 'none',
            mixBlendMode: 'screen',
            opacity: 0.2,
            animation: `${glassOscillate} 8s ease-in-out infinite`,
          },
        }}
      >
        {/* Edge Mount Indicators */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            bottom: 10,
            left: -4,
            width: 3,
            background: `linear-gradient(to bottom,
              rgba(${currentTheme.impossible}, 0.2),
              rgba(${currentTheme.shift}, 0.1)
            )`,
            boxShadow: `0 0 8px rgba(${currentTheme.shift}, 0.15)`,
            opacity: 0.6,
            borderRadius: '2px 0 0 2px',
            transition: 'all 0.3s ease',
            transform: 'scaleY(1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 10,
            bottom: 10,
            right: -4,
            width: 3,
            background: `linear-gradient(to bottom,
              rgba(${currentTheme.impossible}, 0.2),
              rgba(${currentTheme.shift}, 0.1)
            )`,
            boxShadow: `0 0 8px rgba(${currentTheme.shift}, 0.15)`,
            opacity: 0.6,
            borderRadius: '0 2px 2px 0',
            transition: 'all 0.3s ease',
            transform: 'scaleY(1)',
          }}
        />

        {/* Metallic Screws */}
        {[
          { top: 10, left: 10, angle: '10deg', delay: 0 },
          { top: 10, right: 10, angle: '22deg', delay: 1.2 },
          { bottom: 10, left: 10, angle: '-12deg', delay: 2.4 },
          { bottom: 10, right: 10, angle: '18deg', delay: 3.6 },
        ].map((pos, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              right: pos.right,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: `radial-gradient(circle at center, 
                ${alpha('#000000', 0.3)} 0%, 
                ${alpha('#000000', 0.15)} 40%, 
                transparent 70%
              )`,
              boxShadow: `
                inset 0 1px 2px ${alpha('#000000', 0.5)},
                inset 0 -1px 1px ${alpha('#ffffff', 0.1)},
                0 1px 1px ${alpha('#ffffff', 0.05)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 5,
                height: 5,
                background: `
                  radial-gradient(circle at 35% 35%, #e0e0e0 0%, #b8b8b8 15%, #888 40%, #555 70%, #222 100%),
                  linear-gradient(135deg, #ccc 0%, #666 100%)`,
                backgroundSize: '100%, 100%',
                borderRadius: '50%',
                boxShadow: `
                  inset 0 0.5px 1px ${alpha('#ffffff', 0.4)},
                  inset 0 -0.5px 1px ${alpha('#000000', 0.5)},
                  0 0.5px 2px ${alpha('#000000', 0.8)},
                  0 0 3px ${alpha('#000000', 0.3)}`,
                transform: `rotate(${pos.angle})`,
                border: `0.5px solid ${alpha('#000000', 0.2)}`,
                animation: `${screwWiggle} 5s ease-in-out infinite`,
                animationDelay: `${pos.delay}s`,
              }}
            >
              {/* Phillips head grooves */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '70%',
                  height: '0.5px',
                  background: `linear-gradient(90deg, 
                    transparent, 
                    ${alpha('#000000', 0.7)} 20%, 
                    ${alpha('#000000', 0.7)} 80%, 
                    transparent
                  )`,
                  transform: 'translate(-50%, -50%) rotate(0deg)',
                  boxShadow: `0 0 1px ${alpha('#ffffff', 0.15)}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '0.5px',
                  height: '70%',
                  background: `linear-gradient(180deg, 
                    transparent, 
                    ${alpha('#000000', 0.7)} 20%, 
                    ${alpha('#000000', 0.7)} 80%, 
                    transparent
                  )`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: `0 0 1px ${alpha('#ffffff', 0.15)}`,
                }}
              />
              {/* Jewel center */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 1.5,
                  height: 1.5,
                  transform: 'translate(-50%, -50%)',
                  background: `radial-gradient(circle at center, 
                    ${alpha('#ffffff', 0.8)}, 
                    rgba(${currentTheme.impossible}, 0.6), 
                    rgba(${currentTheme.deep}, 0.4), 
                    transparent
                  )`,
                  borderRadius: '50%',
                  opacity: 0.7,
                  animation: `${jewelPulse} 3s infinite`,
                }}
              />
            </div>
          </div>
        ))}

        <Toolbar sx={{ 
          height: '100%',
          maxWidth: 1200,
          margin: '0 auto',
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo Section */}
          <Box
            component={motion.div}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1,
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
              cursor: 'pointer',
              '&:hover': {
                background: `rgba(${currentTheme.impossible}, 0.1)`,
              },
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AutoAwesomeIcon sx={{ 
              color: '#6366F1', 
              fontSize: 32,
              filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.1))',
            }} />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 800,
                fontSize: '1.75rem',
                background: `linear-gradient(135deg, #FFFFFF 0%, rgb(${currentTheme.impossible}) 50%, rgb(${currentTheme.shift}) 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundSize: '200% 200%',
                animation: 'gradient 3s ease infinite',
                '@keyframes gradient': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' },
                },
              }}
            >
              RepConnect Ultra
            </Typography>
          </Box>

          {/* Center Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: 8,
            flex: 1,
            justifyContent: 'center',
          }}>
            {[
              { icon: <ContactsIcon />, label: 'Contacts', color: currentTheme.shift, onClick: () => {} },
              { icon: <SyncIcon />, label: 'AI Sync', color: currentTheme.impossible, onClick: onSyncDashboardOpen },
              { icon: <BarChartIcon />, label: 'Analytics', color: currentTheme.deep, onClick: onMissionControlOpen },
            ].map((item, idx) => (
              <Button
                key={idx}
                startIcon={item.icon}
                onClick={item.onClick}
                sx={{
                  position: 'relative',
                  px: 2,
                  py: 1,
                  borderRadius: '10px',
                  color: 'text.secondary',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: alpha('#ffffff', 0.02),
                  border: '1px solid transparent',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, 
                      transparent 0%,
                      rgba(${item.color}, 0.1) 50%,
                      transparent 100%
                    )`,
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  },
                  '&:hover': {
                    color: 'text.primary',
                    background: alpha('#ffffff', 0.05),
                    borderColor: `rgba(${item.color}, 0.3)`,
                    transform: 'translateY(-1px)',
                    boxShadow: `
                      0 4px 20px rgba(${item.color}, 0.2),
                      0 0 0 1px rgba(${item.color}, 0.1) inset`,
                    '&::before': {
                      transform: 'translateX(100%)',
                    },
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Quantum Dialer Button */}
            <Button
              startIcon={<DialpadIcon />}
              onClick={onDialerOpen}
              sx={{
                position: 'relative',
                px: 3,
                py: 1.25,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, rgb(${currentTheme.shift}))`,
                color: 'white',
                fontWeight: 600,
                fontSize: '14px',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `
                  0 4px 20px ${alpha(theme.palette.primary.main, 0.3)},
                  0 0 0 1px ${alpha('#ffffff', 0.1)} inset`,
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '100%',
                  height: '100%',
                  border: '2px solid',
                  borderColor: `transparent rgb(${currentTheme.impossible}) transparent rgb(${currentTheme.shift})`,
                  borderRadius: '12px',
                  transform: 'translate(-50%, -50%) scale(1.1)',
                  opacity: 0,
                  transition: 'all 0.3s ease',
                },
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `
                    0 6px 30px ${alpha(theme.palette.primary.main, 0.4)},
                    0 0 0 2px ${alpha('#ffffff', 0.2)} inset,
                    0 0 40px rgba(${currentTheme.impossible}, 0.3)`,
                  filter: 'brightness(1.1)',
                  '&::after': {
                    opacity: 1,
                    transform: 'translate(-50%, -50%) scale(1.15) rotate(180deg)',
                    animation: `${forcefieldRotate} 2s linear infinite`,
                  },
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg,
                    transparent,
                    ${alpha('#ffffff', 0.3)},
                    transparent
                  )`,
                  transition: 'left 0.5s',
                },
                '&:hover::before': {
                  left: '100%',
                },
              }}
            >
              Dialer
            </Button>

            {/* AI Toggle */}
            <Button
              onClick={onAIToggle}
              sx={{
                px: 2,
                py: 1,
                borderRadius: '10px',
                background: aiEnabled 
                  ? `linear-gradient(135deg, rgba(${currentTheme.impossible}, 0.2), rgba(${currentTheme.shift}, 0.2))`
                  : alpha('#ffffff', 0.05),
                border: `1px solid ${aiEnabled ? `rgba(${currentTheme.shift}, 0.3)` : alpha('#ffffff', 0.1)}`,
                color: aiEnabled ? theme.palette.primary.light : 'text.secondary',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: aiEnabled
                    ? `linear-gradient(135deg, rgba(${currentTheme.impossible}, 0.3), rgba(${currentTheme.shift}, 0.3))`
                    : alpha('#ffffff', 0.08),
                  transform: 'translateY(-1px)',
                },
              }}
            >
              AI {aiEnabled ? 'ON' : 'OFF'}
            </Button>

            {/* More Menu */}
            <IconButton
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: alpha('#ffffff', 0.05),
                border: `1px solid ${alpha('#ffffff', 0.1)}`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: alpha('#ffffff', 0.08),
                  borderColor: `rgba(${currentTheme.impossible}, 0.3)`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <MoreHorizIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </div>
        </Toolbar>
      </AppBar>
    </div>
  );
};