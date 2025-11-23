/**
 * Audio Controller
 * 
 * Handles audio streaming and TTS requests
 */

const audioService = require('../services/audioService');
const openaiService = require('../services/openaiService');

/**
 * Convert text to speech
 * Returns JSON with base64 audio data and latency
 */
async function textToSpeech(req, res, next) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false,
        error: 'Text is required' 
      });
    }

    console.log('[Audio Controller] TTS request received for text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    const ttsResult = await openaiService.textToSpeech(text);
    
    if (!ttsResult || !ttsResult.buffer) {
      return res.status(500).json({
        success: false,
        error: 'TTS generation failed'
      });
    }

    const audioBuffer = ttsResult.buffer;
    const ttsLatency = ttsResult.latency;
    
    // Convert to base64 for frontend
    const audioBase64 = audioBuffer.toString('base64');
    
    console.log('[Audio Controller] TTS complete, latency:', ttsLatency, 'ms');
    console.log('[Audio Controller] Audio size:', audioBuffer.length, 'bytes');

    res.json({
      success: true,
      audioData: audioBase64,
      latency: ttsLatency
    });
  } catch (error) {
    console.error('[Audio Controller] TTS error:', error);
    next(error);
  }
}

/**
 * Stream audio for a session
 */
async function streamAudio(req, res, next) {
  try {
    const { sessionId } = req.params;
    const audioBuffer = audioService.getAudio(sessionId);

    if (!audioBuffer) {
      return res.status(404).json({ error: 'Audio not found for this session' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache',
      'Accept-Ranges': 'bytes',
    });

    res.send(audioBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Transcribe audio using Whisper
 */
async function transcribeAudio(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No audio file provided'
      });
    }

    const openaiService = require('../services/openaiService');
    const result = await openaiService.transcribeAudio(
      req.file.buffer,
      req.file.originalname
    );

    res.json({
      success: true,
      text: result.text,
      latency: result.latency
    });
  } catch (error) {
    console.error('Transcription error:', error);
    next(error);
  }
}

module.exports = {
  textToSpeech,
  streamAudio,
  transcribeAudio,
};

