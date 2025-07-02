import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Typography, 
  Container, 
  Button, 
  Chip,
  Paper,
  Grid,
  Avatar,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { FileUploadProcessor } from './FileUploadProcessor';
import { useNavigate } from 'react-router-dom';

interface LeadEnrichmentLandingProps {
  isPublicMode?: boolean;
}

export const LeadEnrichmentLanding: React.FC<LeadEnrichmentLandingProps> = ({ isPublicMode = true }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [enrichmentCount] = useState(Math.floor(Math.random() * 500) + 2500);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  });

  const handleTryWithSampleData = () => {
    setIsProcessing(true);
    // Navigate to results with mock data
    setTimeout(() => {
      navigate('/enrich/results?mode=sample');
    }, 1500);
  };

  const features = [
    {
      icon: <CheckCircleIcon />,
      title: 'Data Cleaning',
      description: 'Remove duplicates, fix formatting, validate emails'
    },
    {
      icon: <TrendingUpIcon />,
      title: 'Lead Scoring',
      description: 'AI-powered heat scores based on engagement'
    },
    {
      icon: <GroupIcon />,
      title: 'Smart Segmentation',
      description: 'Identify champions, decision makers, quick wins'
    },
    {
      icon: <AutoAwesomeIcon />,
      title: 'Instant Enrichment',
      description: 'Company data, social presence, intent signals'
    }
  ];

  const testimonials = [
    { name: 'Sarah J.', role: 'Sales Director', text: 'Found 3 hot leads I completely missed!' },
    { name: 'Mike R.', role: 'BDR', text: 'The heat score is scary accurate' },
    { name: 'Lisa T.', role: 'VP Sales', text: 'Saved hours of manual research' }
  ];

  if (uploadedFile && !isProcessing) {
    return <FileUploadProcessor file={uploadedFile} onBack={() => setUploadedFile(null)} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
      paddingTop: 64,
      paddingBottom: 64
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Typography 
              variant="h2" 
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #6366F1 50%, #EC4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Turn Your Messy Lead List Into Gold
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
              In 30 Seconds or Less
            </Typography>
            <Chip 
              icon={<FlashOnIcon />}
              label={`${enrichmentCount.toLocaleString()} lists enriched today`}
              sx={{ 
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontSize: '14px',
                py: 2,
                px: 1
              }}
            />
          </div>
        </motion.div>

        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Paper
            {...getRootProps()}
            sx={{
              p: 8,
              mb: 4,
              textAlign: 'center',
              background: isDragActive 
                ? 'rgba(99, 102, 241, 0.15)' 
                : 'rgba(255, 255, 255, 0.03)',
              border: '2px dashed',
              borderColor: isDragActive 
                ? 'rgba(99, 102, 241, 0.5)' 
                : 'rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'rgba(99, 102, 241, 0.08)',
                borderColor: 'rgba(99, 102, 241, 0.3)'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUploadIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {isDragActive ? 'Drop your file here' : 'Drag & drop your CSV or Excel file'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              or click to browse • CSV, XLS, XLSX supported
            </Typography>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="large"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTryWithSampleData();
                }}
                sx={{
                  background: 'rgba(236, 72, 153, 0.1)',
                  borderColor: 'rgba(236, 72, 153, 0.3)',
                  color: '#EC4899',
                  '&:hover': {
                    background: 'rgba(236, 72, 153, 0.2)',
                    borderColor: '#EC4899'
                  }
                }}
              >
                Try with Sample Data
              </Button>
            </div>
          </Paper>
        </motion.div>

        {/* Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.9)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 3, color: 'white' }}>
                  Preparing your demo...
                </Typography>
                <LinearProgress sx={{ width: 300, mb: 2 }} />
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Loading sample data
                </Typography>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Grid */}
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Paper sx={{ 
                  p: 3, 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: 'rgba(99, 102, 241, 0.05)',
                    borderColor: 'rgba(99, 102, 241, 0.2)',
                    transform: 'translateY(-4px)'
                  }
                }}>
                  <div style={{ color: '#6366F1', marginBottom: 16 }}>
                    {React.cloneElement(feature.icon, { sx: { fontSize: 40 } })}
                  </div>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 700 }}>
              Sales Teams Love Pipeline Enrichment
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {testimonials.map((testimonial, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar sx={{ mb: 2, width: 60, height: 60, bgcolor: 'primary.main' }}>
                      {testimonial.name[0]}
                    </Avatar>
                    <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                      "{testimonial.text}"
                    </Typography>
                    <Typography variant="subtitle2">
                      {testimonial.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {testimonial.role}
                    </Typography>
                  </div>
                </Grid>
              ))}
            </Grid>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div style={{ 
            textAlign: 'center', 
            paddingTop: 48,
            paddingBottom: 48,
            paddingLeft: 32,
            paddingRight: 32,
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 16,
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              No Credit Card Required • Free Forever Plan
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              100 free enrichments every month. Upgrade anytime for more.
            </Typography>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip label="✓ Instant Results" />
              <Chip label="✓ No Login Required" />
              <Chip label="✓ Export Anytime" />
              <Chip label="✓ GDPR Compliant" />
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};