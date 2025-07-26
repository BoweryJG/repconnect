import React from 'react';
import { Chip, Typography, Tooltip, LinearProgress } from '@mui/material';
import { School, TrendingUp, Psychology, MonetizationOn } from '@mui/icons-material';

interface KnowledgeDomain {
  domain_name: string;
  domain_category: string;
  expertise_level: number;
  product_lines: string[];
}

interface AgentKnowledgeDomainsProps {
  domains: KnowledgeDomain[];
  compact?: boolean;
}

const categoryIcons: Record<string, React.ReactElement> = {
  aesthetic_devices: <Psychology fontSize="small" />,
  dental_devices: <School fontSize="small" />,
  general: <TrendingUp fontSize="small" />,
};

const categoryColors: Record<string, string> = {
  aesthetic_devices: '#E91E63',
  dental_devices: '#2196F3',
  general: '#4CAF50',
};

export const AgentKnowledgeDomains: React.FC<AgentKnowledgeDomainsProps> = ({
  domains,
  compact = false,
}) => {
  if (!domains || domains.length === 0) return null;

  // Group domains by category
  const groupedDomains = domains.reduce(
    (acc, domain) => {
      if (!acc[domain.domain_category]) {
        acc[domain.domain_category] = [];
      }
      acc[domain.domain_category].push(domain);
      return acc;
    },
    {} as Record<string, KnowledgeDomain[]>
  );

  if (compact) {
    // Compact view for agent cards
    return (
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {domains.slice(0, 3).map((domain, index) => {
          const chipColor = categoryColors[domain.domain_category] || '#757575';
          const chipIcon = categoryIcons[domain.domain_category] || (
            <MonetizationOn fontSize="small" />
          );

          return (
            <Tooltip
              key={index}
              title={`${domain.domain_name} - Expertise: ${domain.expertise_level}/10`}
            >
              <Chip
                size="small"
                icon={chipIcon}
                label={domain.domain_name.split(' ')[0]}
                style={{
                  backgroundColor: `${chipColor}20`,
                  color: chipColor,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            </Tooltip>
          );
        })}
        {domains.length > 3 && (
          <Chip
            size="small"
            label={`+${domains.length - 3} more`}
            style={{
              backgroundColor: '#00000010',
              fontSize: '0.7rem',
              height: 20,
            }}
          />
        )}
      </div>
    );
  }

  // Full view for agent details
  return (
    <div style={{ marginTop: 16 }}>
      <Typography variant="subtitle2" style={{ marginBottom: 8, fontWeight: 600 }}>
        B2B Sales Expertise
      </Typography>
      {Object.entries(groupedDomains).map(([category, categoryDomains]) => (
        <div key={category} style={{ marginBottom: 16 }}>
          <Typography
            variant="caption"
            style={{
              color: categoryColors[category] || '#757575',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginBottom: 8,
            }}
          >
            {categoryIcons[category] || <MonetizationOn fontSize="small" />}
            {category.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </Typography>
          {categoryDomains.map((domain, index) => (
            <div key={index} style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <Typography variant="body2" style={{ fontWeight: 500 }}>
                  {domain.domain_name.replace(' B2B', '')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Level {domain.expertise_level}/10
                </Typography>
              </div>
              <LinearProgress
                variant="determinate"
                value={domain.expertise_level * 10}
                style={{
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: `${categoryColors[category]}20`,
                }}
              />
              {domain.product_lines.length > 0 && (
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {domain.product_lines.slice(0, 3).map((product, idx) => (
                    <Typography
                      key={idx}
                      variant="caption"
                      style={{
                        color: 'rgba(0, 0, 0, 0.6)',
                        fontSize: '0.65rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        padding: '1px 4px',
                        borderRadius: 2,
                      }}
                    >
                      {product.split(' ')[0]}
                    </Typography>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default AgentKnowledgeDomains;
