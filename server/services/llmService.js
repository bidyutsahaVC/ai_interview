/**
 * LLM Service
 * 
 * Handles LLM interactions for question generation and answer validation
 */

const OpenAI = require('openai');
const {
  getQuestionGenerationSystemPrompt,
  getQuestionGenerationPrompt,
  ANSWER_VALIDATION_SYSTEM_PROMPT,
  getAnswerValidationPrompt,
} = require('./prompts');

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a single interview question using GPT
 * @param {string} subject - Subject/topic for the question
 * @param {Array} previousQuestions - Array of previously asked questions to avoid duplicates
 * @returns {Promise<Object>} Object with questions array (containing one question) and latency
 */
async function generateQuestions(subject = 'general knowledge', previousQuestions = []) {
  try {
    console.log(`[LLM Service] generateQuestions called with subject: "${subject}"`);
    console.log(`[LLM Service] Previous questions to avoid: ${previousQuestions.length}`);
    const prompt = getQuestionGenerationPrompt(subject, previousQuestions);
    const systemPrompt = getQuestionGenerationSystemPrompt(subject);
    
    // Log LLM request
    console.log(`[LLM Request] Generate one question for subject: "${subject}"`);
    console.log(`  System Prompt: ${systemPrompt}`);
    console.log(`  User Prompt: ${prompt.substring(0, 200)}...`); // Truncate for readability
    
    // Start timing
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    // End timing
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    const content = response.choices[0].message.content;
    const questions = parseQuestionsResponse(content);

    // Include LLM request details for frontend logging
    const llmRequest = {
      subject: subject,
      systemPrompt: systemPrompt,
      userPrompt: prompt,
      model: 'gpt-4o-mini',
      temperature: 0.7
    };

    return { questions, latency: timeTaken, llmRequest };
  } catch (error) {
    console.error('Question generation error:', error);
    throw new Error(`Question generation failed: ${error.message}`);
  }
}

/**
 * Parse questions from LLM response (expects exactly one question)
 * @param {string} content - LLM response content
 * @returns {Array} Array with exactly one question
 */
function parseQuestionsResponse(content) {
  let questions;
  try {
    const parsed = JSON.parse(content);
    // Handle different possible response formats
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else if (parsed.questionsArray && Array.isArray(parsed.questionsArray)) {
      questions = parsed.questionsArray;
    } else {
      // Single question object
      questions = [parsed];
    }
  } catch (parseError) {
    // If direct parse fails, try to extract JSON array from text
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      questions = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('Could not parse questions from response');
    }
  }

  // Ensure we have exactly one question
  if (questions.length === 0) {
    throw new Error('No questions found in response');
  }
  
  // Take only the first question (in case LLM returns multiple)
  if (questions.length > 1) {
    console.log(`[Warning] LLM returned ${questions.length} questions, using only the first one`);
    questions = questions.slice(0, 1);
  }

  return Array.isArray(questions) ? questions : [questions];
}

/**
 * Validate answer using LLM
 * @param {Object} question - Question object with question, options, correctAnswer
 * @param {string} userAnswer - User's transcribed answer
 * @returns {Promise<Object>} Object with isCorrect (0 or 1), feedback, and latency
 */
async function validateAnswer(question, userAnswer) {
  const startTime = Date.now();
  
  try {
    const prompt = getAnswerValidationPrompt(question, userAnswer);
    const systemPrompt = ANSWER_VALIDATION_SYSTEM_PROMPT;

    // Log LLM request
    console.log(`[LLM Request] Validate Answer:`);
    console.log(`  System: ${systemPrompt}`);
    console.log(`  User: ${prompt}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    const content = response.choices[0].message.content;
    const result = parseValidationResponse(content);
    
    // Include LLM request details for frontend logging
    const llmRequest = {
      systemPrompt: systemPrompt,
      userPrompt: prompt,
      model: 'gpt-4o-mini',
      temperature: 0.7
    };
    
    return { ...result, latency: timeTaken, llmRequest };
  } catch (error) {
    console.error('Answer validation error:', error);
    throw new Error(`Answer validation failed: ${error.message}`);
  }
}

/**
 * Parse validation response from LLM
 * @param {string} content - LLM response content
 * @returns {Object} Object with isCorrect and feedback
 */
function parseValidationResponse(content) {
  try {
    const result = JSON.parse(content);
    // Ensure isCorrect is 0 or 1
    result.isCorrect = result.isCorrect === 1 || result.isCorrect === true ? 1 : 0;
    return result;
  } catch (parseError) {
    // Fallback if JSON parsing fails
    return {
      isCorrect: 0,
      feedback: 'Unable to evaluate answer. Please try again.'
    };
  }
}

module.exports = {
  generateQuestions,
  validateAnswer,
};

