/**
 * Text-to-Speech Service
 * 
 * Handles text-to-speech conversion using OpenAI TTS API
 */

const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert text to speech using OpenAI TTS
 * @param {string} text - Text to convert to speech
 * @param {string} voice - Voice to use (default: 'alloy')
 * @returns {Promise<Object>} Object with buffer and latency
 */
async function textToSpeech(text, voice = 'alloy') {
  const startTime = Date.now();
  
  // Validate input
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    console.error('[TTS Service] ERROR: Invalid text input:', text);
    throw new Error('Text-to-speech requires non-empty text input');
  }
  
  console.log('[TTS Service] ========================================');
  console.log('[TTS Service] Starting TTS conversion');
  console.log('[TTS Service] ========================================');
  console.log('[TTS Service] Text length:', text.length, 'characters');
  console.log('[TTS Service] Text preview:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
  console.log('[TTS Service] Voice:', voice);
  console.log('[TTS Service] Model: tts-1');
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice, // Options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
    });

    console.log('[TTS Service] TTS API call successful, converting to buffer...');
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // End timing
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    console.log('[TTS Service] ========================================');
    console.log('[TTS Service] TTS conversion complete');
    console.log('[TTS Service] ========================================');
    console.log('[TTS Service] Buffer size:', buffer.length, 'bytes');
    console.log('[TTS Service] Latency:', timeTaken, 'ms');
    
    return { buffer, latency: timeTaken };
  } catch (error) {
    const errorTime = Date.now() - startTime;
    console.error('[TTS Service] ========================================');
    console.error('[TTS Service] TTS ERROR - Failed after', errorTime, 'ms');
    console.error('[TTS Service] ========================================');
    console.error('[TTS Service] Error message:', error.message);
    console.error('[TTS Service] Error details:', error);
    if (error.response) {
      console.error('[TTS Service] API Response:', error.response.status, error.response.statusText);
      console.error('[TTS Service] API Response data:', error.response.data);
    }
    throw new Error(`Text-to-speech failed: ${error.message}`);
  }
}

module.exports = {
  textToSpeech,
};

