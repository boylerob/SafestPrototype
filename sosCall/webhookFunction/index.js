const { GoogleGenerativeAI } = require('@google/generative-ai');
// const twilio = require('twilio');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

global.conversations = global.conversations || new Map();

exports.webhook = async (req, res) => {
  // Log invocation and incoming data
  console.log('Webhook invoked:', {
    method: req.method,
    query: req.query,
    body: req.body
  });

  const conversationId = req.query.conversationId;
  const conversation = global.conversations.get(conversationId);
  
  if (!conversation) {
    res.status(400).send('Invalid conversation');
    return;
  }

  try {
    // Get user's speech input
    const speechResult = req.body.SpeechResult;
    console.log('Received SpeechResult:', speechResult);
    
    // Get response from Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('Starting Gemini chat...');
    const chat = model.startChat({
      history: [
        { role: 'system', parts: [{ text: 'You are a concerned, proactive, and helpful safety assistant. Respond with empathy, urgency, and practical advice to help the caller.' }] },
        ...conversation.history
      ]
    });
    console.log('Sending message to Gemini:', speechResult);
    const result = await chat.sendMessage(speechResult);
    const response = result.response.text();
    console.log('Gemini response:', response);

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
    res.send(twiml.toString());
  } catch (err) {
    console.error('Webhook error:', err);
    if (err && err.message) console.error('Error message:', err.message);
    if (err && err.stack) console.error('Error stack:', err.stack);
    // const twiml = new twilio.twiml.VoiceResponse();
    // twiml.say({ voice: 'alice' }, 'I apologize, but I encountered an error. Please try again.');
    // twiml.gather({
    //   input: 'speech',
    //   action: `/webhook?conversationId=${conversationId}`,
    //   method: 'POST',
    //   speechTimeout: 'auto',
    //   language: 'en-US'
    // });
    res.type('text/xml');
    res.send(twiml.toString());
  }
}; 