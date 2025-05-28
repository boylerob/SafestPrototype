// const twilio = require('twilio');
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
// const client = twilio(accountSid, authToken);
// const twiml = new twilio.twiml.VoiceResponse();

// Store conversation context (in-memory, for prototype only)
global.conversations = global.conversations || new Map();

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
    global.conversations.set(conversationId, {
      phoneNumber,
      location,
      history: []
    });

    // Create TwiML response with initial greeting and gather user input
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