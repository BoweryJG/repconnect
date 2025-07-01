#\!/bin/bash

echo "Testing call with transcription enabled..."

curl -X POST http://localhost:3001/api/twilio/make-call \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+18454090692",
    "message": "Hello, this is a test call with real-time transcription enabled.",
    "enableStream": true
  }'
