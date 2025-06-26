import { Handler } from '@netlify/functions';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

export const handler: Handler = async (event, context) => {
  const allowedOrigins = [
    'https://repconnect1.netlify.app',
    'http://localhost:3000',
    'http://localhost:8888'
  ];
  
  const origin = event.headers.origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin);
  
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/twilio-proxy', '');
    const url = `${BACKEND_URL}${path}`;
    const requestData = event.body ? JSON.parse(event.body) : undefined;
    
    console.log('🔍 [PROXY DEBUG] Incoming request:', {
      originalPath: event.path,
      processedPath: path,
      finalUrl: url,
      method: event.httpMethod,
      requestData,
      backendUrl: BACKEND_URL
    });
    
    const response = await axios({
      method: event.httpMethod,
      url,
      data: requestData,
      headers: {
        'Content-Type': 'application/json',
        ...event.headers
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ [PROXY DEBUG] Backend response successful:', {
      status: response.status,
      data: response.data
    });

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error: any) {
    console.error('❌ [PROXY DEBUG] Backend request failed:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      code: error.code,
      timeout: error.code === 'ECONNABORTED'
    });
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.response?.data?.error || error.message || 'Internal server error',
        details: {
          backendUrl: BACKEND_URL,
          path: event.path,
          timeout: error.code === 'ECONNABORTED'
        }
      })
    };
  }
};