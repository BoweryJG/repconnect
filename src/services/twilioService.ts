import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const USE_PROXY = false;
const PROXY_URL = '/.netlify/functions/twilio-proxy';

export const twilioService = {
  async makeCall(to: string, from?: string) {
    try {
      const url = USE_PROXY
        ? `${PROXY_URL}/api/twilio/make-call`
        : `${BACKEND_URL}/api/twilio/make-call`;
      
      const fromNumber = from || process.env.REACT_APP_TWILIO_PHONE_NUMBER;
      
      console.log('🔍 [DIALER DEBUG] Making call with config:', {
        to,
        from: fromNumber,
        url,
        useProxy: USE_PROXY,
        backendUrl: BACKEND_URL,
        proxyUrl: PROXY_URL
      });
        
      const response = await axios.post(url, {
        to,
        from: fromNumber,
      });
      
      console.log('✅ [DIALER DEBUG] Call request successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [DIALER DEBUG] Call request failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        requestData: error.config?.data
      });
      throw error;
    }
  },

  async sendSMS(to: string, body: string, from?: string) {
    try {
      const url = USE_PROXY 
        ? `${PROXY_URL}/api/twilio/send-sms`
        : `${BACKEND_URL}/api/twilio/send-sms`;
        
      const response = await axios.post(url, {
        to,
        body,
        from: from || process.env.REACT_APP_TWILIO_PHONE_NUMBER,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  },

  async getCallRecordings(callSid: string) {
    try {
      const url = USE_PROXY 
        ? `${PROXY_URL}/api/twilio/recordings/${callSid}`
        : `${BACKEND_URL}/api/twilio/recordings/${callSid}`;
        
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting recordings:', error);
      throw error;
    }
  },
};