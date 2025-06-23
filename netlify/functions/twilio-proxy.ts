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
    
    const response = await axios({
      method: event.httpMethod,
      url,
      data: event.body ? JSON.parse(event.body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...event.headers
      }
    });

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(response.data)
    };
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: error.response?.data?.error || error.message || 'Internal server error'
      })
    };
  }
};