import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const twilioService = {
  async makeCall(to: string, from?: string) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/twilio/make-call`, {
        to,
        from: from || process.env.REACT_APP_TWILIO_PHONE_NUMBER,
      });
      return response.data;
    } catch (error) {
      console.error('Error making call:', error);
      throw error;
    }
  },

  async sendSMS(to: string, body: string, from?: string) {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/twilio/send-sms`, {
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
      const response = await axios.get(`${BACKEND_URL}/api/twilio/recordings/${callSid}`);
      return response.data;
    } catch (error) {
      console.error('Error getting recordings:', error);
      throw error;
    }
  },
};