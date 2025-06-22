import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import MessageIcon from '@mui/icons-material/Message';
import { theme } from './theme';
import { twilioService } from './services/twilioService';
import { supabase } from './lib/supabase';

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const handleMakeCall = async () => {
    if (!phoneNumber) return;
    
    setLoading(true);
    try {
      await twilioService.makeCall(phoneNumber);
      setSnackbar({ open: true, message: 'Call initiated successfully!', severity: 'success' });
      
      // Log to Supabase
      await supabase.from('calls').insert({
        phone_number: phoneNumber,
        status: 'initiated',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to make call', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!phoneNumber || !message) return;
    
    setLoading(true);
    try {
      await twilioService.sendSMS(phoneNumber, message);
      setSnackbar({ open: true, message: 'SMS sent successfully!', severity: 'success' });
      
      // Log to Supabase
      await supabase.from('messages').insert({
        phone_number: phoneNumber,
        message: message,
        status: 'sent',
        created_at: new Date().toISOString(),
      });
      
      setMessage('');
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to send SMS', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              RepConnect1
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Communication Center
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      variant="outlined"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      sx={{ mb: 2 }}
                    />
                    
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item>
                        <Button
                          variant="contained"
                          startIcon={<PhoneIcon />}
                          onClick={handleMakeCall}
                          disabled={!phoneNumber || loading}
                        >
                          Make Call
                        </Button>
                      </Grid>
                    </Grid>
                    
                    <TextField
                      fullWidth
                      label="SMS Message"
                      variant="outlined"
                      multiline
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      sx={{ mb: 2 }}
                    />
                    
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<MessageIcon />}
                      onClick={handleSendSMS}
                      disabled={!phoneNumber || !message || loading}
                    >
                      Send SMS
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;