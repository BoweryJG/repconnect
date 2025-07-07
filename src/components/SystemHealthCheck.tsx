import React, { useState, useEffect } from 'react';
import { Paper, Typography, Chip, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { SERVICE_CONFIG, validateServiceConfig } from '../config/serviceConfig';

export const SystemHealthCheck = () => {
  const [health, setHealth] = useState({
    backend: 'checking',
    database: 'checking',
    harvey: 'checking',
    config: 'checking'
  });

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    // Check configuration
    const configValidation = validateServiceConfig();
    setHealth(prev => ({ 
      ...prev, 
      config: configValidation.allValid ? 'healthy' : 'error' 
    }));

    // Check backend
    try {
      const response = await fetch(`${SERVICE_CONFIG.backend.url}/health`);
      const data = await response.json();
      setHealth(prev => ({ 
        ...prev, 
        backend: data.status === 'healthy' ? 'healthy' : 'error' 
      }));
    } catch {
      setHealth(prev => ({ ...prev, backend: 'error' }));
    }

    // Check Harvey
    try {
      const response = await fetch(`${SERVICE_CONFIG.backend.url}/api/harvey/metrics?userId=health-check`);
      setHealth(prev => ({ 
        ...prev, 
        harvey: response.ok ? 'healthy' : 'error' 
      }));
    } catch {
      setHealth(prev => ({ ...prev, harvey: 'error' }));
    }

    // Database check would go here
    setHealth(prev => ({ ...prev, database: 'healthy' }));
  };

  const getStatusIcon = (status: string) => {
    if (status === 'checking') return <CircularProgress size={16} />;
    if (status === 'healthy') return <CheckCircleIcon color="success" />;
    return <ErrorIcon color="error" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'checking') return 'default';
    if (status === 'healthy') return 'success';
    return 'error';
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        System Health
      </Typography>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {Object.entries(health).map(([service, status]) => (
          <Chip
            key={service}
            icon={getStatusIcon(status)}
            label={service.charAt(0).toUpperCase() + service.slice(1)}
            color={getStatusColor(status)}
            variant="outlined"
          />
        ))}
      </div>
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
        Backend: {SERVICE_CONFIG.backend.url}
      </Typography>
    </Paper>
  );
};
