import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  IconButton,
  LinearProgress,
  Chip,
  Collapse,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { EnrichmentEngine } from '../lib/enrichment/EnrichmentEngine';
import { supabase } from '../lib/supabase';

interface CompactEnrichmentWidgetProps {
  onEnrichmentComplete?: (_leads: any[]) => void;
  embedded?: boolean; // When true, removes fixed positioning
}

export const CompactEnrichmentWidget: React.FC<CompactEnrichmentWidgetProps> = ({
  onEnrichmentComplete,
  embedded = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [expanded, setExpanded] = useState(embedded && (isMobile || isTablet));
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrichedCount, setEnrichedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError(null);
      // Auto-process small files
      if (acceptedFiles[0].size < 1024 * 100) {
        // Less than 100KB
        processFile(acceptedFiles[0]);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const processFile = async (fileToProcess: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const data = await parseFile(fileToProcess);

      // Process leads with progress updates
      const leadsToEnrich = data.map((lead) => ({
        firstName: lead.firstName || lead['First Name'] || '',
        lastName: lead.lastName || lead['Last Name'] || '',
        email: lead.email || lead.Email || '',
        phone: lead.phone || lead.Phone || '',
        company: lead.company || lead.Company || '',
        title: lead.title || lead.Title || '',
      }));

      // Enrich all leads at once
      const enrichedLeads = await EnrichmentEngine.enrichLeads(leadsToEnrich, undefined, true);

      // Simulate progress for UX
      for (let i = 0; i < enrichedLeads.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay for progress animation
        setProgress(Math.round(((i + 1) / enrichedLeads.length) * 100));
        setEnrichedCount(i + 1);
      }

      // Save to Supabase
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await supabase.from('enrichment_uploads').insert({
        session_id: sessionId,
        file_name: fileToProcess.name,
        total_leads: data.length,
        enriched_leads: enrichedLeads.length,
        is_authenticated: false,
      });

      // Notify parent component
      if (onEnrichmentComplete) {
        onEnrichmentComplete(enrichedLeads);
      }

      setIsProcessing(false);
      setFile(null);
      setExpanded(false);
    } catch (err) {
      setError(`Error processing file: ${err}`);
      setIsProcessing(false);
    }
  };

  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          complete: (result) => resolve(result.data),
          header: true,
          skipEmptyLines: true,
          error: reject,
        });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            resolve(jsonData);
          } catch (err) {
            reject(err);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  };

  // Calculate dynamic positioning
  const getWidgetStyles = () => {
    const baseStyles = {
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    };

    // For embedded mode, return simplified styles
    if (embedded) {
      const widthMap = {
        mobile: { expanded: 240, collapsed: 140 },
        tablet: { expanded: 220, collapsed: 130 },
        desktop: { expanded: 180, collapsed: 100 },
      };

      const currentSize = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
      const width = widthMap[currentSize];

      return {
        ...baseStyles,
        width: expanded ? width.expanded : 'auto',
        minWidth: expanded ? width.expanded - 40 : width.collapsed,
        maxWidth: expanded ? width.expanded + 40 : width.collapsed + 20,
        fontSize: isMobile ? '0.875rem' : isTablet ? '0.8rem' : '0.75rem',
      };
    }

    // Original fixed positioning styles
    const fixedStyles = {
      ...baseStyles,
      position: 'fixed' as const,
      zIndex: 1000,
    };

    if (isMobile) {
      return {
        ...fixedStyles,
        top: 'auto',
        bottom: 20,
        right: 10,
        left: 10,
        width: 'auto',
        maxWidth: expanded ? '100%' : 200,
        transform: expanded ? 'scale(1)' : 'scale(0.8)',
        transformOrigin: 'bottom right',
      };
    } else if (isTablet) {
      return {
        ...fixedStyles,
        top: 140,
        right: 30,
        width: expanded ? 350 : 240,
      };
    } else {
      return {
        ...fixedStyles,
        top: 230, // Positioned to align with Quick Add Contact section
        right: 60, // More padding from right edge
        width: expanded ? 380 : 260, // Slightly smaller to fit better
      };
    }
  };

  return (
    <Paper sx={getWidgetStyles()}>
      {/* Header */}
      <div
        style={{
          padding: embedded
            ? isMobile
              ? '8px 12px'
              : '6px 10px'
            : isMobile
              ? '8px 12px'
              : '12px 16px',
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onClick={() => !isProcessing && setExpanded(!expanded)}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: embedded ? (isMobile ? 6 : isTablet ? 5 : 4) : isMobile ? 6 : 8,
          }}
        >
          <AutoFixHighIcon
            sx={{
              color: '#EC4899',
              fontSize: embedded ? (isMobile ? 16 : isTablet ? 14 : 12) : isMobile ? 16 : 20,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: embedded
                ? isMobile
                  ? '0.8rem'
                  : isTablet
                    ? '0.75rem'
                    : '0.65rem'
                : '0.75rem',
            }}
          >
            {embedded
              ? isMobile || isTablet
                ? 'Lead Enricher'
                : 'Enricher'
              : 'Instant Lead Enricher'}
          </Typography>
          {enrichedCount > 0 && !isProcessing && (
            <Chip
              size="small"
              icon={<CheckCircleIcon />}
              label={`${enrichedCount} enriched`}
              sx={{
                height: 20,
                fontSize: '0.75rem',
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
              }}
            />
          )}
        </div>
        <IconButton
          size="small"
          disabled={isProcessing}
          sx={{ padding: embedded ? (isMobile ? '4px' : isTablet ? '2px' : '1px') : '8px' }}
        >
          {expanded ? (
            <ExpandLessIcon
              sx={{ fontSize: embedded ? (isMobile ? 18 : isTablet ? 16 : 14) : 20 }}
            />
          ) : (
            <ExpandMoreIcon
              sx={{ fontSize: embedded ? (isMobile ? 18 : isTablet ? 16 : 14) : 20 }}
            />
          )}
        </IconButton>
      </div>

      {/* Content */}
      <Collapse in={expanded}>
        <div style={{ padding: embedded ? 10 : isMobile ? 12 : 16 }}>
          {!file && !isProcessing ? (
            <>
              <div
                {...getRootProps()}
                style={{
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: 12,
                  padding: embedded ? 16 : 24,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  transition: 'all 0.3s ease',
                }}
              >
                <input {...getInputProps()} />
                <UploadFileIcon
                  sx={{
                    fontSize: embedded ? (isMobile ? 32 : 24) : 40,
                    color: 'rgba(255, 255, 255, 0.4)',
                    mb: embedded ? 0.5 : 1,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: embedded ? (isMobile ? '0.8rem' : '0.65rem') : '0.875rem' }}
                >
                  Drop CSV/Excel
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: embedded ? (isMobile ? '0.75rem' : '0.6rem') : '0.75rem' }}
                >
                  or click to browse
                </Typography>
              </div>

              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                onClick={() => {
                  // Use sample data
                  const sampleFile = new File(
                    [
                      `First Name,Last Name,Email,Company
John,Doe,john@example.com,Acme Corp
Jane,Smith,jane@example.com,Tech Co`,
                    ],
                    'sample.csv',
                    { type: 'text/csv' }
                  );
                  setFile(sampleFile);
                  processFile(sampleFile);
                }}
              >
                Try with sample data
              </Button>

              <Button
                variant="text"
                size="small"
                fullWidth
                sx={{
                  mt: 1,
                  color: 'primary.main',
                  textDecoration: 'underline',
                  '&:hover': {
                    textDecoration: 'underline',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  },
                }}
                onClick={() => window.open('/demo', '_blank')}
              >
                View 40 Enriched Contacts Demo →
              </Button>
            </>
          ) : isProcessing ? (
            <div style={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Enriching {enrichedCount} of {file?.name}...
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #6366F1 0%, #EC4899 100%)',
                    borderRadius: 4,
                  },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {progress}% complete
              </Typography>
            </div>
          ) : file ? (
            <div>
              <Alert severity="info" sx={{ mb: 2 }}>
                Ready to enrich {file.name}
              </Alert>
              <Button
                variant="contained"
                fullWidth
                onClick={() => processFile(file)}
                sx={{
                  background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                }}
              >
                Start Enrichment
              </Button>
            </div>
          ) : null}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </div>
      </Collapse>

      {/* Minimized State */}
      {!expanded && (
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(99, 102, 241, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
              }}
            >
              <Typography variant="caption">Drop file here</Typography>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Paper>
  );
};
