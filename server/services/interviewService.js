/**
 * Interview Service
 * 
 * Generates MCQ questions using LLM
 */

const { generateQuestions } = require('./openaiService');

/**
 * Generate a single MCQ question
 * @param {string} subject - Subject/topic for the question
 * @param {Array} previousQuestions - Array of previously asked questions to avoid duplicates
 * @returns {Promise<Object>} Object with questions array (containing one question) and latency
 */
async function generateSingleQuestion(subject = 'general knowledge', previousQuestions = []) {
  console.log(`[Interview Service] Generating question with subject: "${subject}"`);
  console.log(`[Interview Service] Avoiding ${previousQuestions.length} previous questions`);
  return await generateQuestions(subject, previousQuestions);
}

module.exports = {
  generateSingleQuestion,
};
