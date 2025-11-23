/**
 * Audio Service
 * 
 * Manages audio storage and streaming for TTS responses
 */

// In-memory audio storage (use file system or cloud storage in production)
const audioStorage = new Map();

/**
 * Store audio buffer for a session
 * @param {string} sessionId - Session ID
 * @param {Buffer} audioBuffer - Audio buffer to store
 */
function storeAudio(sessionId, audioBuffer) {
  audioStorage.set(sessionId, audioBuffer);
}

/**
 * Get audio buffer for a session
 * @param {string} sessionId - Session ID
 * @returns {Buffer|null} Audio buffer or null if not found
 */
function getAudio(sessionId) {
  return audioStorage.get(sessionId) || null;
}

/**
 * Clear audio for a session
 * @param {string} sessionId - Session ID
 */
function clearAudio(sessionId) {
  audioStorage.delete(sessionId);
}

module.exports = {
  storeAudio,
  getAudio,
  clearAudio,
};

