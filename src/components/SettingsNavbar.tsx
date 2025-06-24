import React, { useState, useEffect } from 'react';
import { Typography, IconButton, Badge } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SyncIcon from '@mui/icons-material/Sync';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SpeedIcon from '@mui/icons-material/Speed';
import HistoryIcon from '@mui/icons-material/History';
import { adaptiveRenderer } from '../lib/performance/AdaptiveRenderer';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SettingsNavbarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  syncCount?: number;
}

export const SettingsNavbar: React.FC<SettingsNavbarProps> = ({
  activeTab,
  onTabChange,
  syncCount = 0
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [enableEffects, setEnableEffects] = useState(true);

  useEffect(() => {
    const unsubscribe = adaptiveRenderer.subscribe((settings) => {
      setEnableEffects(settings.enableGlassEffects);
    });
    return unsubscribe;
  }, []);

  const navItems: NavItem[] = [
    { id: 'sync', label: 'Sync', icon: <SyncIcon />, badge: syncCount },
    { id: 'ai', label: 'AI Settings', icon: <AutoAwesomeIcon /> },
    { id: 'performance', label: 'Performance', icon: <SpeedIcon /> },
    { id: 'history', label: 'History', icon: <HistoryIcon /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'linear-gradient(90deg, rgba(26, 26, 26, 0.95) 0%, rgba(30, 30, 30, 0.9) 20%, rgba(26, 26, 26, 0.85) 50%, rgba(30, 30, 30, 0.9) 80%, rgba(26, 26, 26, 0.95) 100%)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
      height: '80px',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      overflow: 'hidden',
    }}>
      {/* Glass refraction overlay */}
      {enableEffects && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.02) 50%, transparent 100%)',
          animation: 'glassShimmer 8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Logo/Brand */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Animated jewel core */}
        <div style={{
          position: 'relative',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {enableEffects && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'conic-gradient(from 0deg, #ff00ff, #00ffff, #ff00aa, #ff00ff)',
                  borderRadius: '50%',
                  opacity: 0.3,
                  filter: 'blur(10px)',
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  width: '80%',
                  height: '80%',
                  background: 'conic-gradient(from 180deg, #00ffff, #ff00ff, #00ffff)',
                  borderRadius: '50%',
                  opacity: 0.2,
                  filter: 'blur(8px)',
                }}
              />
            </>
          )}
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #00d4ff 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)',
            position: 'relative',
            zIndex: 1,
          }}>
            <SyncIcon style={{ fontSize: 20, color: 'white' }} />
          </div>
        </div>

        <div>
          <Typography variant="h6" fontWeight="700" style={{
            background: 'linear-gradient(135deg, #e8e8e8 0%, #999 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Sync Center
          </Typography>
          <Typography variant="caption" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            AI-Powered Call Management
          </Typography>
        </div>
      </motion.div>

      {/* Navigation Items */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
      }}>
        {navItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            style={{ position: 'relative' }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(item.id)}
              style={{
                background: activeTab === item.id
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)'
                  : hoveredItem === item.id
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                border: activeTab === item.id
                  ? '1px solid rgba(99, 102, 241, 0.5)'
                  : '1px solid transparent',
                borderRadius: '16px',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                minWidth: '120px',
                height: '48px',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Kinetic effect on hover */}
              {enableEffects && hoveredItem === item.id && (
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              <Badge
                badgeContent={item.badge}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    background: 'linear-gradient(135deg, #ff0040 0%, #ff0080 100%)',
                    boxShadow: '0 0 10px rgba(255, 0, 64, 0.5)',
                  },
                }}
              >
                <div style={{ color: activeTab === item.id ? '#00d4ff' : 'white' }}>
                  {item.icon}
                </div>
              </Badge>
              
              <Typography
                variant="body2"
                fontWeight={activeTab === item.id ? 600 : 400}
                style={{
                  color: activeTab === item.id ? '#00d4ff' : 'white',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {item.label}
              </Typography>

              {/* Active indicator */}
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  style={{
                    position: 'absolute',
                    bottom: '-1px',
                    left: '20%',
                    right: '20%',
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                    boxShadow: '0 0 10px #00d4ff',
                  }}
                />
              )}
            </motion.button>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredItem === item.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    zIndex: 1000,
                  }}
                >
                  <Typography variant="caption">{item.label}</Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Performance indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0, 255, 136, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 255, 136, 0.3)',
        }}
      >
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#00ff88',
          boxShadow: '0 0 10px #00ff88',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        <Typography variant="caption" style={{ color: '#00ff88' }}>
          AI Ready
        </Typography>
      </motion.div>

      <style>
        {`
          @keyframes glassShimmer {
            0%, 100% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </nav>
  );
};