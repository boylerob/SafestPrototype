const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

global.conversations = global.conversations || new Map();

exports.webhook = async (req, res) => {
  const conversationId = req.query.conversationId;
  const conversation = global.conversations.get(conversationId);
  
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

    res.status(200).json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'I apologize, but I encountered an error. Please try again.' });
  }
}; 