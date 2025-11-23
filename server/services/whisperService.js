/**
 * Whisper Service
 * 
 * Handles audio transcription using OpenAI Whisper API
 */

const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert audio to text using Whisper
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} filename - Original filename
 * @returns {Promise<Object>} Object with text and latency
 */
async function transcribeAudio(audioBuffer, filename = 'audio.webm') {
  const startTime = Date.now();
  
  try {
    console.log(`[Transcription] Starting transcription for file: ${filename}`);
    let file = await prepareAudioFile(audioBuffer, filename);
    
    // Call Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
    });

    // Clean up temp file if used
    await cleanupTempFile(file);

    const transcribedText = transcription.text.trim();
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    return { text: transcribedText, latency: timeTaken };
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

/**
 * Prepare audio file for Whisper API
 * @param {Buffer} audioBuffer - Audio file buffer
 * @param {string} filename - Original filename
 * @returns {Promise<File|Stream>} File object or stream
 */
async function prepareAudioFile(audioBuffer, filename) {
  // Try to use File API if available (Node.js 18+)
  if (typeof File !== 'undefined') {
    return new File([audioBuffer], filename, { type: 'audio/webm' });
  } else {
    // Fallback: Use temporary file for older Node.js versions
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `whisper_${Date.now()}_${filename}`);
    
    try {
      fs.writeFileSync(tempFilePath, audioBuffer);
      const fileStream = fs.createReadStream(tempFilePath);
      fileStream.name = filename;
      fileStream.path = tempFilePath;
      return fileStream;
    } catch (fsError) {
      throw new Error(`Failed to create temp file: ${fsError.message}`);
    }
  }
}

/**
 * Clean up temporary file if used
 * @param {File|Stream} file - File object or stream
 */
async function cleanupTempFile(file) {
  if (file && file.path && typeof file.close === 'function') {
    file.close();
    const fs = require('fs');
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
}

module.exports = {
  transcribeAudio,
};

