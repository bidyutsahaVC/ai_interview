/**
 * LLM Prompts Configuration
 * 
 * Centralized location for all LLM prompts used in the application.
 * This makes it easier to maintain, update, and version control prompts.
 */

/**
 * System prompt for question generation
 * @param {string} subject - Subject/topic for questions
 */
function getQuestionGenerationSystemPrompt(subject = 'general knowledge') {
  return `You are an expert interviewer creating multiple choice questions on ${subject}. Always respond with valid JSON only. Return a JSON object with a "questions" key containing an array with exactly one question, where the question includes a "readableText" field for text-to-speech.`;
}

/**
 * User prompt for generating a single question
 * @param {string} subject - Subject/topic for the question
 * @param {Array} previousQuestions - Array of previously asked questions to avoid duplicates
 * @returns {string} Formatted prompt
 */
function getQuestionGenerationPrompt(subject = 'general knowledge', previousQuestions = []) {
  const previousQuestionsText = previousQuestions.length > 0 
    ? `\n\nIMPORTANT: Do NOT repeat any of these previously asked questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q.question}`).join('\n')}\n\nGenerate a NEW and DIFFERENT question that has NOT been asked before.`
    : '';
  
  return `Generate one multiple choice question (MCQ) specifically focused on ${subject}. 
    The question should be directly related to ${subject} and test knowledge in that specific area.
    The question should have:
    1. A clear question about ${subject}
    2. 4 options (A, B, C, D) all related to ${subject}
    3. The correct answer (A, B, C, or D)
    4. A readable text version for text-to-speech (natural, conversational format)
    ${previousQuestionsText}
    Format the response as a JSON object with this structure:
    {
      "questions": [
        {
          "question": "Question text about ${subject}",
          "options": {
            "A": "Option A",
            "B": "Option B",
            "C": "Option C",
            "D": "Option D"
          },
          "correctAnswer": "A",
          "readableText": "Natural spoken version: Question text. Options: A, Option A. B, Option B. C, Option C. D, Option D."
        }
      ]
    }
    
    The "readableText" field should be a natural, conversational version of the question and options that sounds good when spoken aloud.
    IMPORTANT: The question must be specifically about ${subject}. Do not generate general knowledge questions unless the subject is "general knowledge".
    ${previousQuestions.length > 0 ? 'CRITICAL: The new question must be completely different from all previously asked questions listed above.' : ''}`;
}

/**
 * System prompt for answer validation
 */
const ANSWER_VALIDATION_SYSTEM_PROMPT = 'You are a helpful teacher evaluating student answers. Always respond with valid JSON only.';

/**
 * User prompt for validating answers
 * @param {Object} question - Question object with question, options, correctAnswer
 * @param {string} userAnswer - User's transcribed answer
 * @returns {string} Formatted prompt
 */
function getAnswerValidationPrompt(question, userAnswer) {
  return `You are evaluating an answer to a multiple choice question.

Question: ${question.question}

Options:
${Object.entries(question.options).map(([key, value]) => `${key}: ${value}`).join('\n')}

Correct Answer: ${question.correctAnswer}

User's Answer: ${userAnswer}

Please evaluate if the user's answer is correct. Be flexible and consider:
1. The user might have said the option letter (A, B, C, or D) or the full option text
2. There might be typos, misspellings, or variations in the user's answer
3. Match the intent even if the spelling is slightly off (e.g., "opton A" should match "option A", "A" should match "A")
4. Consider phonetic similarities and common misspellings
5. If the user's answer clearly refers to the correct option (even with typos), mark it as correct

Examples:
- User says "A" or "option A" or "opton A" or "optin A" → should match option A
- User says "B" or "option B" or "opton B" → should match option B
- User says part of the option text (even with typos) → match if it clearly refers to the correct option

Respond with a JSON object in this exact format:
{
  "isCorrect": 1 or 0 (1 if correct, 0 if incorrect),
  "feedback": "A brief, encouraging feedback message (1 sentences maximum)"
}`;
}

module.exports = {
  getQuestionGenerationSystemPrompt,
  getQuestionGenerationPrompt,
  ANSWER_VALIDATION_SYSTEM_PROMPT,
  getAnswerValidationPrompt,
};

