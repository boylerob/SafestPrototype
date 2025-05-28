// const twilio = require('twilio');
const speech = require('@google-cloud/speech');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
// const client = twilio(accountSid, authToken);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Initialize Speech-to-Text client
const speechClient = new speech.SpeechClient();

// Store conversation context
const conversations = new Map();

// Handle initial SOS call
exports.sosCall = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { phoneNumber, location } = req.body;
  if (!phoneNumber) {
    res.status(400).send('Missing phone number');
    return;
  }

  try {
    // Initialize conversation context
    const conversationId = Date.now().toString();
    conversations.set(conversationId, {
      phoneNumber,
      location,
      history: []
    });

    // Create TwiML response with initial greeting and gather user input
    // const twiml = new twilio.twiml.VoiceResponse();
    // twiml.say({ voice: 'alice' }, 'This is your Safest AI agent. We detected an S.O.S. event. Are you okay? Please respond after the tone.');
    // twiml.gather({
    //   input: 'speech',
    //   action: `/webhook?conversationId=${conversationId}`,
    //   method: 'POST',
    //   speechTimeout: 'auto',
    //   language: 'en-US'
    // });

    // Make the call
    // await client.calls.create({
    //   to: phoneNumber,
    //   from: twilioNumber,
    //   twiml: twiml.toString()
    // });

    res.status(200).send('Call initiated');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to initiate call');
  }
};

// Handle webhook for voice interaction
exports.webhook = async (req, res) => {
  const conversationId = req.query.conversationId;
  const conversation = conversations.get(conversationId);
  
  if (!conversation) {
    res.status(400).send('Invalid conversation');
    return;
  }

  try {
    // Get user's speech input
    const speechResult = req.body.SpeechResult;
    
    // Get response from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const chat = model.startChat({
      history: conversation.history
    });

    const result = await chat.sendMessage(speechResult);
    const response = result.response.text();

    // Update conversation history
    conversation.history.push(
      { role: 'user', parts: [{ text: speechResult }] },
      { role: 'model', parts: [{ text: response }] }
    );

    // Create TwiML response
    // const twiml = new twilio.twiml.VoiceResponse();
    // twiml.say({ voice: 'alice' }, response);
    // twiml.gather({
    //   input: 'speech',
    //   action: `/webhook?conversationId=${conversationId}`,
    //   method: 'POST',
    //   speechTimeout: 'auto',
    //   language: 'en-US'
    // });

    res.type('text/xml');
    res.send(response);
  } catch (err) {
    console.error(err);
    const response = 'I apologize, but I encountered an error. Please try again.';
    res.type('text/xml');
    res.send(response);
  }
}; 