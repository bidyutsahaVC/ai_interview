/**
 * Interview Routes
 * 
 * Handles interview session management, question generation,
 * answer processing, and result generation
 */

const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interviewController');

// Generate a single MCQ question
router.post('/start', interviewController.startInterview);

// Validate answer
router.post('/validate-answer', interviewController.validateAnswer);

module.exports = router;

