/**
 * OpenAI Service
 * 
 * Main service module that aggregates all OpenAI-related services.
 * This provides a unified interface while keeping services modular.
 * 
 * Services:
 * - Whisper (Speech-to-Text) - whisperService.js
 * - GPT (LLM for questions and responses) - llmService.js
 * - TTS (Text-to-Speech) - ttsService.js
 * 
 * Prompts are managed in prompts.js
 */

const whisperService = require('./whisperService');
const llmService = require('./llmService');
const ttsService = require('./ttsService');

// Re-export all services for backward compatibility
module.exports = {
  transcribeAudio: whisperService.transcribeAudio,
  generateQuestions: llmService.generateQuestions,
  validateAnswer: llmService.validateAnswer,
  textToSpeech: ttsService.textToSpeech,
};

