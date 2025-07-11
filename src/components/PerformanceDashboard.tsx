import React, { useState, useEffect } from 'react';
import { Typography, LinearProgress, Chip, IconButton, Collapse } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import Battery90Icon from '@mui/icons-material/Battery90';
import Battery50Icon from '@mui/icons-material/Battery50';
import Battery20Icon from '@mui/icons-material/Battery20';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { motion } from 'framer-motion';
// Removed glassmorphism and emotion imports - using inline styles for TypeScript compatibility
import { performanceMonitor } from '../lib/performance/PerformanceMonitor';
import { thermalManager } from '../lib/performance/ThermalManager';
import { adaptiveRenderer } from '../lib/performance/AdaptiveRenderer';

export const PerformanceDashboard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState(0);
  const [temperature, setTemperature] = useState<'cool' | 'warm' | 'hot' | 'critical'>('cool');
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [isCharging, setIsCharging] = useState(false);
  const [networkType, setNetworkType] = useState<'slow' | 'fast' | 'offline'>('fast');
  const [powerMode, setPowerMode] = useState<'performance' | 'balanced' | 'battery-saver'>(
    'balanced'
  );
  const [quality, setQuality] = useState<any>({});

  useEffect(() => {
    const unsubPerf = performanceMonitor.subscribe((metrics) => {
      setFps(metrics.fps);
      setMemory(metrics.memory);
      setTemperature(metrics.temperature);
    });

    const unsubThermal = thermalManager.subscribe((state) => {
      setBatteryLevel(state.batteryLevel);
      setIsCharging(state.isCharging);
      setNetworkType(state.networkType);
      setPowerMode(state.powerMode);
    });

    const unsubQuality = adaptiveRenderer.subscribe((settings) => {
      setQuality(settings);
    });

    return () => {
      unsubPerf();
      unsubThermal();
      unsubQuality();
    };
  }, []);

  const getBatteryIcon = () => {
    if (batteryLevel > 0.9) return <BatteryFullIcon />;
    if (batteryLevel > 0.5) return <Battery90Icon />;
    if (batteryLevel > 0.2) return <Battery50Icon />;
    return <Battery20Icon />;
  };

  const getTemperatureColor = () => {
    switch (temperature) {
      case 'cool':
        return '#10B981';
      case 'warm':
        return '#F59E0B';
      case 'hot':
        return '#EF4444';
      case 'critical':
        return '#991B1B';
    }
  };

  const metricStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    '&:last-child': {
      borderBottom: 'none',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: 320,
        padding: 16,
        borderRadius: 16,
        zIndex: 1000,
        transition: 'all 0.3s ease',
        background: 'rgba(17, 25, 40, 0.75)',
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.125)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <Typography variant="h6" fontWeight="600">
          Performance Monitor
        </Typography>
        <IconButton size="small" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <Chip
          icon={<SpeedIcon />}
          label={`${fps} FPS`}
          size="small"
          sx={{
            background: fps >= 55 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: `1px solid ${fps >= 55 ? '#10B981' : '#EF4444'}`,
          }}
        />
        <Chip
          icon={<ThermostatIcon />}
          label={temperature}
          size="small"
          sx={{
            background: `${getTemperatureColor()}22`,
            border: `1px solid ${getTemperatureColor()}`,
          }}
        />
        <Chip
          label={powerMode}
          size="small"
          sx={{
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid #6366F1',
          }}
        />
      </div>

      <Collapse in={isExpanded}>
        <div style={{ marginTop: '16px' }}>
          {/* FPS */}
          <div style={metricStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SpeedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="body2">Frame Rate</Typography>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Typography variant="body2" fontWeight="600">
                {fps} FPS
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(fps / 60) * 100}
                sx={{
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  mt: 0.5,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: fps >= 55 ? '#10B981' : '#EF4444',
                  },
                }}
              />
            </div>
          </div>

          {/* Memory */}
          <div style={metricStyles}>
            <Typography variant="body2">Memory Usage</Typography>
            <Typography variant="body2" fontWeight="600">
              {memory} MB
            </Typography>
          </div>

          {/* Battery */}
          <div style={metricStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {getBatteryIcon()}
              <Typography variant="body2">Battery</Typography>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Typography variant="body2" fontWeight="600">
                {Math.round(batteryLevel * 100)}%
              </Typography>
              {isCharging && <Chip label="Charging" size="small" color="success" />}
            </div>
          </div>

          {/* Network */}
          <div style={metricStyles}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NetworkCheckIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
              <Typography variant="body2">Network</Typography>
            </div>
            <Chip
              label={networkType}
              size="small"
              color={
                networkType === 'fast' ? 'success' : networkType === 'slow' ? 'warning' : 'error'
              }
            />
          </div>

          {/* Quality Settings */}
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Current Quality Settings
            </Typography>
            <div style={{ marginTop: '8px' }}>
              <Typography variant="caption">
                • Particles: {quality.particleCount?.toLocaleString() || 0}
              </Typography>
              <br />
              <Typography variant="caption">• Blur: {quality.blurQuality || 'N/A'}</Typography>
              <br />
              <Typography variant="caption">
                • 3D Effects: {quality.enable3D ? 'Enabled' : 'Disabled'}
              </Typography>
              <br />
              <Typography variant="caption">
                • Animation: {quality.animationFPS || 0} FPS
              </Typography>
            </div>
          </div>
        </div>
      </Collapse>
    </motion.div>
  );
};
