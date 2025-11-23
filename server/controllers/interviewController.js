/**
 * Interview Controller
 * 
 * Handles HTTP requests for interview operations
 */

const interviewService = require('../services/interviewService');
const openaiService = require('../services/openaiService');

/**
 * Generate a single MCQ question and convert to speech
 */
async function startInterview(req, res, next) {
  try {
    const { subject, previousQuestions = [] } = req.body;
    const questionSubject = subject || 'general knowledge';
    
    console.log(`[Interview Controller] Received subject from request: "${subject}"`);
    console.log(`[Interview Controller] Using subject: "${questionSubject}"`);
    console.log(`[Interview Controller] Previous questions to avoid: ${previousQuestions.length}`);
    
    // Generate a single MCQ question from LLM
    console.log('[Interview Controller] ========================================');
    console.log('[Interview Controller] STEP 1: GENERATING QUESTION FROM LLM');
    console.log('[Interview Controller] ========================================');
    console.log('[Interview Controller] Subject:', questionSubject);
    console.log('[Interview Controller] Previous questions to avoid:', previousQuestions.length);
    
    const result = await interviewService.generateSingleQuestion(questionSubject, previousQuestions);
    const questions = result.questions;
    const llmLatency = result.latency;                                                                                                            
    const question = questions[0];
    
    console.log('[Interview Controller] ========================================');
    console.log('[Interview Controller] ✓✓✓ LLM QUESTION IS READY! ✓✓✓');
    console.log('[Interview Controller] ========================================');
    console.log('[Interview Controller] Question:', question.question);
    console.log('[Interview Controller] LLM Latency:', llmLatency, 'ms');
    console.log('[Interview Controller] Now sending to frontend for display...');
    
    // Send question text immediately (before TTS)
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Send question text first
    const questionResponse = JSON.stringify({
      success: true,
      question: question,
      audioData: null, // Will be sent separately
      llmRequest: result.llmRequest || null,
      latencies: {
        llmQuestion: llmLatency,
        tts: 0 // Will be updated when TTS completes
      },
      audioReady: false
    });
    
    console.log('[Interview Controller] Sending question text chunk to frontend...');
    console.log('[Interview Controller] Question response length:', questionResponse.length, 'characters');
    res.write(questionResponse + '\n'); // Add newline for consistent parsing
    console.log('[Interview Controller] ✓ Question chunk written to response stream');
    console.log('[Interview Controller] Frontend should now display the question text');
    console.log('[Interview Controller] TTS will be generated on-demand when user clicks "Read" button');
    
    // End response - no automatic TTS generation
    res.end();
    console.log('[Interview Controller] Response stream ended');
  } catch (error) {
    console.error(`[Error] Question generation failed:`, error.message);
    if (!res.headersSent) {
      next(error);
    } else {
      res.end();
    }
  }
}

/**
 * Validate user's answer using LLM
 */
async function validateAnswer(req, res, next) {
  try {
    const { question, transcribedText } = req.body;

    if (!question || !transcribedText) {
      return res.status(400).json({
        success: false,
        error: 'Question and transcribed text are required'
      });
    }

    // Validate answer using LLM
    const validationResult = await openaiService.validateAnswer(question, transcribedText);
    
    // Convert feedback to speech
    const ttsResult = await openaiService.textToSpeech(validationResult.feedback);
    const audioBase64 = ttsResult.buffer.toString('base64');
    
    res.json({
      success: true,
      isCorrect: validationResult.isCorrect,
      feedback: validationResult.feedback,
      audioData: audioBase64,
      llmRequest: validationResult.llmRequest || null, // Include LLM request details if available
      latencies: {
        llmValidation: validationResult.latency,
        tts: ttsResult.latency
      }
    });
  } catch (error) {
    console.error(`[Error] Answer validation failed:`, error.message);
    next(error);
  }
}

module.exports = {
  startInterview,
  validateAnswer,
};
