import React, { useState, useEffect } from 'react';
import { Box, Chip, Tooltip, CircularProgress, Typography } from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as UnhealthyIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastChecked?: string;
  message?: string;
}

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  services: ServiceStatus[];
  timestamp: string;
}

export const HealthStatusIndicator: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/health');

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }

        const data = await response.json();

        // Transform the response into our format
        const services: ServiceStatus[] = [];

        if (data.checks) {
          Object.entries(data.checks).forEach(([name, check]: [string, any]) => {
            services.push({
              name: name.charAt(0).toUpperCase() + name.slice(1),
              status: check.status || 'unknown',
              responseTime: check.responseTime,
              message: check.message || check.error,
            });
          });
        }

        setHealthStatus({
          overall: data.status || 'unknown',
          services,
          timestamp: data.timestamp || new Date().toISOString(),
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check health');
        setHealthStatus(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial check
    checkHealth();

    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon fontSize="small" />;
      case 'degraded':
        return <DegradedIcon fontSize="small" />;
      case 'unhealthy':
        return <UnhealthyIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
        return 'error';
      default:
        return 'info';
    }
  };

  if (loading && !healthStatus) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <CircularProgress size={16} />
        <Typography variant="caption">Checking health...</Typography>
      </div>
    );
  }

  if (error) {
    return (
      <Tooltip title={error}>
        <Chip
          icon={<UnhealthyIcon />}
          label="Health Check Error"
          color="error"
          size="small"
          variant="outlined"
        />
      </Tooltip>
    );
  }

  if (!healthStatus) {
    return null;
  }

  const lastChecked = new Date(healthStatus.timestamp).toLocaleTimeString();

  return (
    <Tooltip
      title={
        <div>
          <Typography variant="subtitle2" gutterBottom>
            System Health Status
          </Typography>
          <Typography variant="caption" display="block" gutterBottom>
            Last checked: {lastChecked}
          </Typography>

          {healthStatus.services.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {healthStatus.services.map((service) => (
                <div key={service.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  {getStatusIcon(service.status)}
                  <Typography variant="caption">
                    {service.name}: {service.status}
                    {service.responseTime && ` (${service.responseTime}ms)`}
                  </Typography>
                </div>
              ))}
            </div>
          )}

          {healthStatus.overall === 'degraded' && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              Some services are experiencing issues
            </Typography>
          )}

          {healthStatus.overall === 'unhealthy' && (
            <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
              Critical services are down
            </Typography>
          )}
        </div>
      }
      arrow
      placement="bottom"
    >
      <Chip
        icon={getStatusIcon(healthStatus.overall)}
        label={`System ${healthStatus.overall}`}
        color={getStatusColor(healthStatus.overall)}
        size="small"
        variant="outlined"
        onClick={() => window.open('/status', '_blank')}
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  );
};

export default HealthStatusIndicator;
