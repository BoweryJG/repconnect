import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  Alert,
  Container
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { EnrichmentEngine } from '../lib/enrichment/EnrichmentEngine';
import { supabase } from '../lib/supabase';

interface FileUploadProcessorProps {
  file: File;
  onBack: () => void;
}

interface ColumnMapping {
  originalColumn: string;
  mappedTo: string;
}

const STANDARD_FIELDS = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'title', label: 'Job Title' },
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'ignore', label: 'Ignore this column' }
];

export const FileUploadProcessor: React.FC<FileUploadProcessorProps> = ({ file, onBack }) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    parseFile();
  }, [file]);

  const parseFile = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (file.name.endsWith('.csv')) {
        // Parse CSV
        Papa.parse(file, {
          complete: (result) => {
            if (result.data && result.data.length > 0) {
              const headers = Object.keys(result.data[0] as Record<string, any>);
              setColumns(headers);
              setParsedData(result.data);
              setPreviewData(result.data.slice(0, 5));
              autoMapColumns(headers);
            }
          },
          header: true,
          skipEmptyLines: true,
          error: (error) => {
            setError(`CSV parsing error: ${error.message}`);
          }
        });
      } else {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);
            
            if (jsonData.length > 0) {
              const headers = Object.keys(jsonData[0] as Record<string, any>);
              setColumns(headers);
              setParsedData(jsonData);
              setPreviewData(jsonData.slice(0, 5));
              autoMapColumns(headers);
            }
          } catch (err) {
            setError(`Excel parsing error: ${err}`);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      setError(`File parsing error: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const autoMapColumns = (headers: string[]) => {
    const mappings: ColumnMapping[] = headers.map(header => {
      const lowerHeader = header.toLowerCase();
      let mappedTo = 'ignore';

      // Auto-detect common patterns
      if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
        mappedTo = 'firstName';
      } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
        mappedTo = 'lastName';
      } else if (lowerHeader.includes('email')) {
        mappedTo = 'email';
      } else if (lowerHeader.includes('phone') || lowerHeader.includes('tel')) {
        mappedTo = 'phone';
      } else if (lowerHeader.includes('company') || lowerHeader.includes('organization')) {
        mappedTo = 'company';
      } else if (lowerHeader.includes('title') || lowerHeader.includes('position') || lowerHeader.includes('role')) {
        mappedTo = 'title';
      } else if (lowerHeader.includes('website') || lowerHeader.includes('url')) {
        mappedTo = 'website';
      } else if (lowerHeader.includes('linkedin')) {
        mappedTo = 'linkedin';
      }

      return { originalColumn: header, mappedTo };
    });

    setColumnMappings(mappings);
  };

  const handleMappingChange = (originalColumn: string, newMapping: string) => {
    setColumnMappings(prev => 
      prev.map(mapping => 
        mapping.originalColumn === originalColumn 
          ? { ...mapping, mappedTo: newMapping }
          : mapping
      )
    );
  };

  const handleProcessData = async () => {
    setIsProcessing(true);
    try {
      // Track upload in Supabase
      const sessionId = localStorage.getItem('enrichment_session') || 
        `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      if (!localStorage.getItem('enrichment_session')) {
        localStorage.setItem('enrichment_session', sessionId);
      }

      const { data: upload, error: uploadError } = await supabase
        .from('enrichment_uploads')
        .insert({
          session_id: sessionId,
          file_name: file.name,
          file_size: file.size,
          row_count: parsedData.length,
          columns: columnMappings,
          user_agent: navigator.userAgent
        })
        .select()
        .single();

      if (uploadError) throw uploadError;

      // Track analytics event
      await supabase
        .from('enrichment_analytics')
        .insert({
          upload_id: upload.id,
          session_id: sessionId,
          event_type: 'upload',
          event_data: { 
            file_name: file.name,
            row_count: parsedData.length 
          }
        });

      // Process with enrichment engine
      const mappedData = parsedData.map(row => {
        const mappedRow: any = {};
        columnMappings.forEach(mapping => {
          if (mapping.mappedTo !== 'ignore') {
            mappedRow[mapping.mappedTo] = row[mapping.originalColumn];
          }
        });
        return mappedRow;
      });

      // Store upload ID for results page
      sessionStorage.setItem('current_upload_id', upload.id);
      sessionStorage.setItem('enrichment_data', JSON.stringify(mappedData));

      // Navigate to results
      navigate('/enrich/results');
    } catch (err) {
      setError(`Processing error: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMappingStats = () => {
    const mapped = columnMappings.filter(m => m.mappedTo !== 'ignore').length;
    const total = columnMappings.length;
    return { mapped, total };
  };

  const canProceed = () => {
    // At minimum, need email or phone mapped
    return columnMappings.some(m => 
      m.mappedTo === 'email' || m.mappedTo === 'phone'
    );
  };

  if (error) {
    return (
      <Container maxWidth="lg" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <Alert severity="error" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
        <Button onClick={onBack} startIcon={<ArrowBackIcon />}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', paddingTop: 32, paddingBottom: 32 }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Typography variant="h4" style={{ fontWeight: 700, marginBottom: 8 }}>
                Map Your Columns
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tell us what each column contains so we can enrich your data properly
              </Typography>
            </div>
            <Button onClick={onBack} startIcon={<ArrowBackIcon />} variant="outlined">
              Back
            </Button>
          </div>

          {/* File Info */}
          <Paper style={{ padding: 24, marginBottom: 24, background: 'rgba(255, 255, 255, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Typography variant="h6">{file.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {parsedData.length} rows • {columns.length} columns
                </Typography>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Chip 
                  icon={<CheckCircleIcon />}
                  label={`${getMappingStats().mapped} of ${getMappingStats().total} columns mapped`}
                  color={getMappingStats().mapped === getMappingStats().total ? 'success' : 'default'}
                />
              </div>
            </div>
          </Paper>

          {/* Column Mapping */}
          <Paper style={{ marginBottom: 24, background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ padding: 24 }}>
              <Typography variant="h6" style={{ marginBottom: 24 }}>
                Column Mapping
              </Typography>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {columnMappings.map((mapping) => (
                  <div key={mapping.originalColumn} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Typography variant="body2" style={{ flex: 1, fontFamily: 'monospace' }}>
                      {mapping.originalColumn}
                    </Typography>
                    <ArrowForwardIcon style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    <FormControl size="small" style={{ minWidth: 150 }}>
                      <Select
                        value={mapping.mappedTo}
                        onChange={(e) => handleMappingChange(mapping.originalColumn, e.target.value)}
                        style={{
                          background: mapping.mappedTo !== 'ignore' 
                            ? 'rgba(99, 102, 241, 0.1)' 
                            : 'transparent'
                        }}
                      >
                        {STANDARD_FIELDS.map(field => (
                          <MenuItem key={field.value} value={field.value}>
                            {field.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                ))}
              </div>
            </div>
          </Paper>

          {/* Data Preview */}
          <Paper style={{ marginBottom: 24, background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ padding: 24 }}>
              <Typography variant="h6" style={{ marginBottom: 16 }}>
                Data Preview (first 5 rows)
              </Typography>
              <div style={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {columns.map(col => (
                        <TableCell key={col}>
                          <Typography variant="caption" style={{ fontWeight: 600 }}>
                            {col}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, idx) => (
                      <TableRow key={idx}>
                        {columns.map(col => (
                          <TableCell key={col}>
                            <Typography variant="body2" style={{ 
                              maxWidth: 200, 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {row[col] || '-'}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </Paper>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={handleProcessData}
              disabled={!canProceed() || isProcessing}
              style={{
                background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
                paddingLeft: 32,
                paddingRight: 32
              }}
            >
              {isProcessing ? (
                <>
                  <LinearProgress style={{ width: 100, marginRight: 16 }} />
                  Processing...
                </>
              ) : (
                'Enrich My Leads'
              )}
            </Button>
          </div>

          {!canProceed() && (
            <Alert severity="warning" style={{ marginTop: 16 }}>
              Please map at least an email or phone column to proceed
            </Alert>
          )}
        </motion.div>
      </Container>
    </div>
  );
};