const axios = require('axios');
const qs = require('querystring');

async function testWebhook() {
  try {
    const response = await axios.post(
      'https://us-central1-safest-prototype-461018.cloudfunctions.net/webhook?conversationId=manualtest',
      qs.stringify({ SpeechResult: 'Hello, this is a test from Node.js!' }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('Webhook response:', response.data);
  } catch (error) {
    console.error('Error calling webhook:', error.response ? error.response.data : error.message);
  }
}

testWebhook(); 