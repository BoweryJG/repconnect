import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Switch,
  ListItemButton,
} from '@mui/material';
import { motion } from 'framer-motion';
import DialpadIcon from '@mui/icons-material/Dialpad';
import SyncIcon from '@mui/icons-material/Sync';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContactsIcon from '@mui/icons-material/Contacts';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsIcon from '@mui/icons-material/Settings';
import TimelineIcon from '@mui/icons-material/Timeline';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import GavelIcon from '@mui/icons-material/Gavel';
import PsychologyIcon from '@mui/icons-material/Psychology';
import PersonIcon from '@mui/icons-material/Person';
import DiamondIcon from '@mui/icons-material/Diamond';
import LogoutIcon from '@mui/icons-material/Logout';
import { keyframes } from '@mui/material';
import { useResponsive } from '../hooks/useResponsive';
import { CornerScrews } from './effects/PrecisionScrew';
import { useAuth } from '../auth/AuthContext';
import { useStore } from '../store/useStore';
import { UserAvatar } from './UserAvatar';
import { SmartPreloader } from '../utils/dynamicImports';
import GlobalLogoutModal from './common/GlobalLogoutModal';

// Animations
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
  onAISettingsOpen?: () => void;
  onPerformanceOpen?: () => void;
  onCallHistoryOpen?: () => void;
  onCoachConnectOpen?: () => void;
  onHarveySettingsOpen?: () => void;
}

export const PremiumNavbar: React.FC<PremiumNavbarProps> = ({
  onDialerOpen,
  aiEnabled,
  onAIToggle,
  onSyncDashboardOpen,
  onMissionControlOpen,
  onAISettingsOpen,
  onPerformanceOpen,
  onCallHistoryOpen,
  onCoachConnectOpen,
  onHarveySettingsOpen,
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsive();
  const isCompact = useMediaQuery(theme.breakpoints.down('lg')); // Hide nav at larger breakpoint
  const [scrolled, setScrolled] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState({
    impossible: '255, 0, 255',
    shift: '0, 255, 255',
    deep: '255, 0, 170',
  });
  const { user, profile, signOut } = useAuth();
  const { setShowLoginModal, setShowSubscriptionModal, subscriptionTier } = useStore();

  // Debug logout modal state
  useEffect(() => {
    console.log('PremiumNavbar showLogoutModal state changed:', showLogoutModal);
  }, [showLogoutModal]);

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

      const themeIndex = Math.max(0, Math.min(section, themes.length - 1));
      const newTheme = themes[themeIndex];
      if (newTheme && newTheme.shift && newTheme.impossible && newTheme.deep) {
        setCurrentTheme(newTheme);
      }
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
        padding: isMobile ? '8px' : '12px',
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={
          {
            position: 'relative',
            left: 0,
            transform: scrolled ? 'scale(0.995) translateZ(50px)' : 'scale(1)',
            width: '100%',
            maxWidth: 'none',
            height: isMobile ? 56 : 64,
            borderRadius: '16px',
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
          } as any
        }
      >
        {/* Bottom gradient accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '10%',
            right: '10%',
            height: 2,
            background: `linear-gradient(to right,
              transparent,
              rgba(${currentTheme.impossible}, 0.4) 20%,
              rgba(${currentTheme.shift}, 0.6) 50%,
              rgba(${currentTheme.impossible}, 0.4) 80%,
              transparent
            )`,
            opacity: scrolled ? 0.8 : 0.5,
            transition: 'all 0.3s ease',
          }}
        />

        {/* Cartier-Level Precision Screws */}
        <CornerScrews size="small" grooveType="phillips" premium={true} />

        <Toolbar
          sx={{
            height: '100%',
            maxWidth: 1600,
            width: '100%',
            margin: '0 auto',
            px: { xs: 3, sm: 6, md: 8 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo Section */}
          <motion.div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingLeft: 16,
              paddingRight: 16,
              paddingTop: 8,
              paddingBottom: 8,
              borderRadius: '12px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transformStyle: 'preserve-3d',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              style={{
                width: isMobile ? 30 : 36,
                height: isMobile ? 30 : 36,
                position: 'relative',
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                style={{
                  width: '100%',
                  height: '100%',
                  filter: 'drop-shadow(0 1px 2px rgba(255,255,255,0.1))',
                }}
              >
                <defs>
                  <linearGradient id="sphereGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9f58fa" />
                    <stop offset="100%" stopColor="#4B96DC" />
                  </linearGradient>
                  <radialGradient id="jewelGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#fff" stopOpacity="1" />
                    <stop offset="30%" stopColor="#ff00ff" stopOpacity="1" />
                    <stop offset="60%" stopColor="#00ffff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ff00aa" stopOpacity="0.9" />
                  </radialGradient>
                </defs>
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="url(#sphereGradient)"
                  strokeWidth="2"
                  opacity="0.8"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="8"
                  fill="none"
                  stroke="url(#sphereGradient)"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
                <circle cx="16" cy="16" r="3" fill="url(#jewelGradient)">
                  <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="0.8;1;0.8"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="16" cy="4" r="1.5" fill="#9f58fa">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 16 16"
                    to="360 16 16"
                    dur="6s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="28" cy="16" r="1.5" fill="#4B96DC">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 16 16"
                    to="360 16 16"
                    dur="8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="16" cy="28" r="1.5" fill="#4bd48e">
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0 16 16"
                    to="360 16 16"
                    dur="10s"
                    repeatCount="indefinite"
                  />
                </circle>
              </svg>
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}
            >
              <Typography
                sx={
                  {
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 800,
                    fontSize: isMobile ? '1rem' : '1.25rem',
                    lineHeight: 1,
                    letterSpacing: '-0.5px',
                    background: 'linear-gradient(135deg, #9f58fa, #4B96DC)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  } as any
                }
              >
                REPSPHERES
              </Typography>
              <Typography
                sx={
                  {
                    fontFamily: 'Orbitron, monospace',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '2px',
                  } as any
                }
              >
                RepConnect
              </Typography>
            </div>
          </motion.div>

          {/* Center Navigation - Desktop Only */}
          {!isCompact && (
            <div
              className="nav-buttons-container"
              style={
                {
                  display: 'flex',
                  gap: 6,
                  flex: '1 1 auto',
                  justifyContent: 'center',
                  minWidth: 0,
                  overflow: 'auto',
                  paddingLeft: 16,
                  paddingRight: 16,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                } as React.CSSProperties
              }
            >
              {[
                {
                  icon: <ContactsIcon />,
                  label: 'Contacts',
                  color: currentTheme.shift || '0, 255, 255',
                  onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                },
                {
                  icon: <GavelIcon />,
                  label: 'Harvey',
                  color: '#FFD700',
                  onClick: onHarveySettingsOpen,
                },
                {
                  icon: <PsychologyIcon />,
                  label: 'Coach Connect',
                  color: currentTheme.shift || '0, 255, 255',
                  onClick: onCoachConnectOpen,
                },
                {
                  icon: <AutoFixHighIcon />,
                  label: 'Enrich Leads',
                  color: currentTheme.deep || '255, 0, 170',
                  onClick: () => window.open('/enrich', '_blank'),
                },
                {
                  icon: <SyncIcon />,
                  label: 'AI Sync',
                  color: currentTheme.impossible || '255, 0, 255',
                  onClick: onSyncDashboardOpen,
                },
                {
                  icon: <BarChartIcon />,
                  label: 'Analytics',
                  color: currentTheme.deep || '255, 0, 170',
                  onClick: onMissionControlOpen,
                },
                {
                  icon: <HistoryIcon />,
                  label: 'Call History',
                  color: currentTheme.impossible || '255, 0, 255',
                  onClick: onCallHistoryOpen,
                },
              ].map((item, idx) => (
                <Button
                  key={idx}
                  startIcon={React.cloneElement(item.icon, {
                    sx: { fontSize: { xs: 14, sm: 15, md: 16 } },
                  })}
                  onClick={item.onClick}
                  onMouseEnter={() => {
                    // Preload heavy components on hover
                    if (item.label === 'Analytics' && onMissionControlOpen) {
                      SmartPreloader.preloadOnHover('three');
                    } else if (item.label === 'Coach Connect') {
                      SmartPreloader.preloadOnHover('harvey');
                    }
                  }}
                  sx={
                    {
                      position: 'relative',
                      px: { xs: 1, sm: 1.25, md: 1.5 },
                      py: { xs: 0.5, sm: 0.625, md: 0.75 },
                      borderRadius: '8px',
                      color: 'text.secondary',
                      fontSize: { xs: '11px', sm: '11px', md: '12px' },
                      fontWeight: 500,
                      textTransform: 'none',
                      minWidth: 'auto',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
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
                    } as any
                  }
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}

          {/* Right Actions */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, flexShrink: 0 }}
          >
            {/* Quantum Dialer Button */}
            <Button
              startIcon={!isMobile && <DialpadIcon sx={{ fontSize: 16 }} />}
              onClick={onDialerOpen}
              sx={
                {
                  position: 'relative',
                  px: isMobile ? 1.5 : 2,
                  py: isMobile ? 0.75 : 1,
                  borderRadius: '8px',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, rgb(${currentTheme.shift}))`,
                  color: 'white',
                  fontWeight: 600,
                  fontSize: isMobile ? '12px' : '13px',
                  textTransform: 'none',
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
                } as any
              }
            >
              {isMobile ? <DialpadIcon /> : 'Dialer'}
            </Button>

            {/* Desktop Actions */}
            {!isCompact && (
              <>
                {/* AI Toggle */}
                <Button
                  onClick={onAIToggle}
                  sx={
                    {
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '8px',
                      background: aiEnabled
                        ? `linear-gradient(135deg, rgba(${currentTheme.impossible}, 0.2), rgba(${currentTheme.shift}, 0.2))`
                        : alpha('#ffffff', 0.05),
                      border: `1px solid ${aiEnabled ? `rgba(${currentTheme.shift}, 0.3)` : alpha('#ffffff', 0.1)}`,
                      color: aiEnabled ? theme.palette.primary.light : 'text.secondary',
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'none',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: aiEnabled
                          ? `linear-gradient(135deg, rgba(${currentTheme.impossible}, 0.3), rgba(${currentTheme.shift}, 0.3))`
                          : alpha('#ffffff', 0.08),
                        transform: 'translateY(-1px)',
                      },
                    } as any
                  }
                >
                  AI {aiEnabled ? 'ON' : 'OFF'}
                </Button>

                {/* Settings Button */}
                <IconButton
                  onClick={onAISettingsOpen}
                  sx={
                    {
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: alpha('#ffffff', 0.03),
                      border: `1px solid ${alpha('#ffffff', 0.08)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: alpha('#ffffff', 0.06),
                        borderColor: `rgba(${currentTheme.impossible}, 0.2)`,
                        transform: 'translateY(-1px)',
                      },
                    } as any
                  }
                >
                  <SettingsIcon sx={{ fontSize: 18 }} />
                </IconButton>

                {/* Performance Button */}
                <IconButton
                  onClick={onPerformanceOpen}
                  sx={
                    {
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: alpha('#ffffff', 0.03),
                      border: `1px solid ${alpha('#ffffff', 0.08)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: alpha('#ffffff', 0.06),
                        borderColor: `rgba(${currentTheme.shift}, 0.2)`,
                        transform: 'translateY(-1px)',
                      },
                    } as any
                  }
                >
                  <TimelineIcon sx={{ fontSize: 18 }} />
                </IconButton>

                {/* More Menu */}
                <IconButton
                  sx={
                    {
                      width: 32,
                      height: 32,
                      borderRadius: '8px',
                      background: alpha('#ffffff', 0.03),
                      border: `1px solid ${alpha('#ffffff', 0.08)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: alpha('#ffffff', 0.06),
                        borderColor: `rgba(${currentTheme.impossible}, 0.2)`,
                        transform: 'translateY(-1px)',
                      },
                    } as any
                  }
                >
                  <MoreHorizIcon sx={{ fontSize: 18 }} />
                </IconButton>

                {/* Divider */}
                <div
                  style={{
                    width: 1,
                    height: 24,
                    background: alpha('#ffffff', 0.1),
                    margin: '0 8px',
                  }}
                />

                {/* User Authentication - Always Show */}
                {user ? (
                  <>
                    {/* Upgrade Button for Free Tier */}
                    {subscriptionTier === 'free' && (
                      <Button
                        startIcon={<DiamondIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setShowSubscriptionModal(true)}
                        sx={
                          {
                            px: 2,
                            py: 0.75,
                            borderRadius: '8px',
                            background: `linear-gradient(135deg, rgba(${currentTheme.impossible}, 0.2), rgba(${currentTheme.shift}, 0.2))`,
                            border: `1px solid rgba(${currentTheme.shift}, 0.3)`,
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            textTransform: 'none',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: `linear-gradient(135deg, rgba(${currentTheme.impossible}, 0.3), rgba(${currentTheme.shift}, 0.3))`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 20px rgba(${currentTheme.shift}, 0.3)`,
                            },
                          } as any
                        }
                      >
                        Upgrade
                      </Button>
                    )}

                    {/* User Avatar with Dropdown */}
                    <UserAvatar
                      user={user}
                      profile={profile}
                      size={32}
                      showInitials={true}
                      onClick={() => {
                        console.log('UserAvatar onClick in PremiumNavbar triggered');
                        console.log('Setting showLogoutModal to true');
                        setShowLogoutModal(true);
                      }}
                    />
                  </>
                ) : (
                  <Button
                    startIcon={<PersonIcon sx={{ fontSize: 16 }} />}
                    onClick={() => setShowLoginModal(true)}
                    sx={
                      {
                        px: 2,
                        py: 0.75,
                        borderRadius: '8px',
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, rgb(${currentTheme.shift}))`,
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 600,
                        textTransform: 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                        },
                      } as any
                    }
                  >
                    Sign In
                  </Button>
                )}
              </>
            )}

            {/* Mobile/Tablet Menu Button */}
            {isCompact && (
              <IconButton
                onClick={() => setMobileMenuOpen(true)}
                sx={
                  {
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    background: alpha('#ffffff', 0.03),
                    border: `1px solid ${alpha('#ffffff', 0.08)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: alpha('#ffffff', 0.06),
                      borderColor: `rgba(${currentTheme.impossible}, 0.2)`,
                      transform: 'translateY(-1px)',
                    },
                  } as any
                }
              >
                <MenuIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
          </div>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            background:
              'linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(30, 30, 30, 0.95) 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            overflow: 'visible',
          },
        }}
      >
        {/* Tiny Screws in Corners */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            width: 4,
            height: 4,
            background:
              'radial-gradient(circle at 30% 30%, #d0d0d0 0%, #a8a8a8 20%, #808080 50%, #606060 100%)',
            borderRadius: '50%',
            boxShadow:
              'inset 0 0.25px 0.5px rgba(255,255,255,0.6), inset 0 -0.25px 0.5px rgba(0,0,0,0.4), 0 0.5px 1px rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '80%',
              height: '0.5px',
              background:
                'linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.6) 85%, transparent 95%)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 4,
            height: 4,
            background:
              'radial-gradient(circle at 30% 30%, #d0d0d0 0%, #a8a8a8 20%, #808080 50%, #606060 100%)',
            borderRadius: '50%',
            boxShadow:
              'inset 0 0.25px 0.5px rgba(255,255,255,0.6), inset 0 -0.25px 0.5px rgba(0,0,0,0.4), 0 0.5px 1px rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '80%',
              height: '0.5px',
              background:
                'linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.6) 85%, transparent 95%)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            left: 4,
            width: 4,
            height: 4,
            background:
              'radial-gradient(circle at 30% 30%, #d0d0d0 0%, #a8a8a8 20%, #808080 50%, #606060 100%)',
            borderRadius: '50%',
            boxShadow:
              'inset 0 0.25px 0.5px rgba(255,255,255,0.6), inset 0 -0.25px 0.5px rgba(0,0,0,0.4), 0 0.5px 1px rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '80%',
              height: '0.5px',
              background:
                'linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.6) 85%, transparent 95%)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            width: 4,
            height: 4,
            background:
              'radial-gradient(circle at 30% 30%, #d0d0d0 0%, #a8a8a8 20%, #808080 50%, #606060 100%)',
            borderRadius: '50%',
            boxShadow:
              'inset 0 0.25px 0.5px rgba(255,255,255,0.6), inset 0 -0.25px 0.5px rgba(0,0,0,0.4), 0 0.5px 1px rgba(0,0,0,0.6)',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '80%',
              height: '0.5px',
              background:
                'linear-gradient(90deg, transparent 5%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.6) 85%, transparent 95%)',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        <div style={{ padding: 16 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Typography
              variant="h6"
              sx={
                {
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #4B96DC, #00d4ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '0.5px',
                } as any
              }
            >
              REPCONNECT
            </Typography>
            <IconButton
              onClick={() => setMobileMenuOpen(false)}
              sx={
                {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'rgba(255, 255, 255, 0.9)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                } as any
              }
            >
              <CloseIcon />
            </IconButton>
          </div>

          {/* Menu Items */}
          <List sx={{ padding: 0 }}>
            {/* Main Navigation Section */}
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '10px',
                fontWeight: 600,
                display: 'block',
                marginBottom: 1,
                paddingLeft: 2,
              }}
            >
              Navigation
            </Typography>

            <ListItemButton
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(0, 212, 255, 0.2)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              {/* Tiny corner screws for menu item */}
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: '#00d4ff' }}>
                <ContactsIcon />
              </ListItemIcon>
              <ListItemText primary="Contacts" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                window.location.href = '/harvey';
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 215, 0, 0.2)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: '#FFD700' }}>
                <GavelIcon />
              </ListItemIcon>
              <ListItemText primary="Harvey Syndicate" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                window.open('/enrich', '_blank');
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 3,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(139, 92, 246, 0.2)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: '#8B5CF6' }}>
                <AutoFixHighIcon />
              </ListItemIcon>
              <ListItemText primary="Enrich Leads" />
            </ListItemButton>

            {/* Tools Section */}
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '10px',
                fontWeight: 600,
                display: 'block',
                marginBottom: 1,
                marginTop: 2,
                paddingLeft: 2,
              }}
            >
              Tools
            </Typography>

            <ListItemButton
              onClick={() => {
                onSyncDashboardOpen?.();
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(236, 72, 153, 0.2)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: '#EC4899' }}>
                <SyncIcon />
              </ListItemIcon>
              <ListItemText primary="AI Sync" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                onCoachConnectOpen?.();
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(0, 255, 255, 0.2)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: '#00FFFF' }}>
                <PsychologyIcon />
              </ListItemIcon>
              <ListItemText primary="Coach Connect" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                onMissionControlOpen?.();
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(75, 212, 142, 0.2)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: '#4BD48E' }}>
                <BarChartIcon />
              </ListItemIcon>
              <ListItemText primary="Analytics" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                onCallHistoryOpen?.();
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 3,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(99, 102, 241, 0.2)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: '#6366F1' }}>
                <HistoryIcon />
              </ListItemIcon>
              <ListItemText primary="Call History" />
            </ListItemButton>

            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.05)' }} />

            {/* Settings Section */}
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.4)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontSize: '10px',
                fontWeight: 600,
                display: 'block',
                marginBottom: 1,
                paddingLeft: 2,
              }}
            >
              Settings
            </Typography>

            {/* AI Toggle */}
            <ListItem
              sx={{
                borderRadius: '12px',
                marginBottom: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <ListItemText primary="AI Assistant" />
              <Switch
                edge="end"
                checked={aiEnabled}
                onChange={onAIToggle}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#00d4ff',
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: '#00d4ff',
                  },
                }}
              />
            </ListItem>

            <ListItemButton
              onClick={() => {
                onAISettingsOpen?.();
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 1,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="AI Settings" />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                onPerformanceOpen?.();
                setMobileMenuOpen(false);
              }}
              sx={{
                borderRadius: '12px',
                marginBottom: 3,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'visible',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 2,
                  height: 2,
                  background: 'radial-gradient(circle, #999 0%, #666 100%)',
                  borderRadius: '50%',
                  opacity: 0.3,
                }}
              />
              <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                <TimelineIcon />
              </ListItemIcon>
              <ListItemText primary="Performance" />
            </ListItemButton>

            <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Authentication Items */}
            {user ? (
              <>
                {subscriptionTier === 'free' && (
                  <ListItemButton
                    onClick={() => {
                      setShowSubscriptionModal(true);
                      setMobileMenuOpen(false);
                    }}
                    sx={{
                      borderRadius: '12px',
                      marginBottom: 8,
                      background:
                        'linear-gradient(135deg, rgba(75, 150, 220, 0.1), rgba(0, 212, 255, 0.1))',
                      border: '1px solid rgba(0, 212, 255, 0.2)',
                      position: 'relative',
                      overflow: 'visible',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 3,
                        left: 3,
                        width: 2,
                        height: 2,
                        background: 'radial-gradient(circle, #aaa 0%, #777 100%)',
                        borderRadius: '50%',
                        opacity: 0.4,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        width: 2,
                        height: 2,
                        background: 'radial-gradient(circle, #aaa 0%, #777 100%)',
                        borderRadius: '50%',
                        opacity: 0.4,
                      }}
                    />
                    <ListItemIcon>
                      <DiamondIcon sx={{ color: '#00d4ff' }} />
                    </ListItemIcon>
                    <ListItemText primary="Upgrade to Pro" />
                  </ListItemButton>
                )}
                <ListItemButton
                  onClick={() => {
                    setShowLogoutModal(true);
                    setMobileMenuOpen(false);
                  }}
                  sx={{
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative',
                    overflow: 'visible',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 3,
                      left: 3,
                      width: 2,
                      height: 2,
                      background: 'radial-gradient(circle, #999 0%, #666 100%)',
                      borderRadius: '50%',
                      opacity: 0.3,
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 3,
                      right: 3,
                      width: 2,
                      height: 2,
                      background: 'radial-gradient(circle, #999 0%, #666 100%)',
                      borderRadius: '50%',
                      opacity: 0.3,
                    }}
                  />
                  <ListItemIcon>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText primary="Sign Out" secondary={profile?.full_name || user.email} />
                </ListItemButton>
              </>
            ) : (
              <ListItemButton
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                sx={{
                  borderRadius: '12px',
                  background:
                    'linear-gradient(135deg, rgba(75, 150, 220, 0.1), rgba(0, 212, 255, 0.1))',
                  border: '1px solid rgba(0, 212, 255, 0.2)',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    width: 2,
                    height: 2,
                    background: 'radial-gradient(circle, #aaa 0%, #777 100%)',
                    borderRadius: '50%',
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 2,
                    height: 2,
                    background: 'radial-gradient(circle, #aaa 0%, #777 100%)',
                    borderRadius: '50%',
                    opacity: 0.4,
                  }}
                />
                <ListItemIcon>
                  <PersonIcon sx={{ color: '#4B96DC' }} />
                </ListItemIcon>
                <ListItemText primary="Sign In" />
              </ListItemButton>
            )}
          </List>
        </div>
      </Drawer>

      {/* Logout Modal */}
      <GlobalLogoutModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          console.log('PremiumNavbar onConfirm called - START');

          // Set a timeout to force redirect if signOut hangs
          const timeoutId = setTimeout(() => {
            console.log('SignOut timeout - forcing redirect');
            window.location.replace('/');
          }, 3000); // 3 second timeout

          try {
            console.log('About to call signOut...');
            console.log('signOut function:', signOut);
            console.log('Calling signOut NOW');
            await signOut();
            console.log('signOut completed successfully');
            clearTimeout(timeoutId);
            console.log('About to redirect...');
            // Use replace to prevent back button issues
            window.location.replace('/');
          } catch (error) {
            console.error('Sign out error details:', error);
            clearTimeout(timeoutId);
            // Even if sign out fails, still redirect
            console.log('Redirecting after error...');
            window.location.replace('/');
          }
        }}
      />
    </div>
  );
};
