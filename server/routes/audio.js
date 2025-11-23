/**
 * Audio Routes
 * 
 * Handles text-to-speech conversion and audio streaming
 */

const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');

// Convert text to speech
router.post('/text-to-speech', audioController.textToSpeech);

// Stream audio response
router.get('/stream/:sessionId', audioController.streamAudio);

// Transcribe audio
const { uploadAudio } = require('../middleware/upload');
router.post('/transcribe', uploadAudio, audioController.transcribeAudio);

module.exports = router;

