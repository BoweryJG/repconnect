import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

export const twilioService = {
  async makeCall(to: string, from?: string, message?: string, options?: any) {
    try {
      const url = `${BACKEND_URL}/api/twilio/make-call`;
      
      const fromNumber = from || process.env.REACT_APP_TWILIO_PHONE_NUMBER;
      
              
      const response = await axios.post(url, {
        to,
        message: message || "Hello! This is a call from RepConnect.",
        record: true,
        metadata: options?.metadata || {}
      });
      
            return response.data;
    } catch (error: any) {
            throw error;
    }
  },

  async sendSMS(to: string, body: string, from?: string) {
    try {
      const url = `${BACKEND_URL}/api/twilio/send-sms`;
        
      const response = await axios.post(url, {
        to,
        body,
        from: from || process.env.REACT_APP_TWILIO_PHONE_NUMBER,
      });
      return response.data;
    } catch (error) {
            throw error;
    }
  },

  async getCallRecordings(callSid: string) {
    try {
      const url = `${BACKEND_URL}/api/twilio/recordings/${callSid}`;
        
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
            throw error;
    }
  },
};