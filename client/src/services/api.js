/**
 * API Service
 * 
 * Handles all HTTP requests to the backend server
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for latency tracking
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: performance.now() };
    console.log(`[API] ${config.method.toUpperCase()} ${config.url} - Request started at ${new Date().toISOString()}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for latency tracking
api.interceptors.response.use(
  (response) => {
    const endTime = performance.now();
    const latency = endTime - response.config.metadata.startTime;
    console.log(`[API] ${response.config.method.toUpperCase()} ${response.config.url} - Response received in ${latency.toFixed(2)}ms at ${new Date().toISOString()}`);
    return response;
  },
  (error) => {
    if (error.config && error.config.metadata) {
      const endTime = performance.now();
      const latency = endTime - error.config.metadata.startTime;
      console.error(`[API] ${error.config.method.toUpperCase()} ${error.config.url} - Error after ${latency.toFixed(2)}ms:`, error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Start a new interview session
 * @param {string} subject - Subject/topic for questions
 */
export async function startInterview(subject = 'general knowledge', previousQuestions = [], onQuestionReady = null, onAudioReady = null) {
  try {
    console.log(`[API] Starting interview with subject: ${subject}`);
    console.log(`[API] Previous questions count: ${previousQuestions.length}`);
    console.log(`[API] Request payload:`, { subject, previousQuestions });
    
    // Use fetch for streaming response
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${API_BASE_URL}/interview/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject, previousQuestions })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Read the streamed response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let questionData = null;
    let audioData = null;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Try to parse complete JSON objects from buffer
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            console.log('[API] Parsing line:', line.substring(0, 100) + (line.length > 100 ? '...' : ''));
            const data = JSON.parse(line);
            console.log('[API] Parsed data keys:', Object.keys(data));
            console.log('[API] Has question:', !!data.question);
            console.log('[API] Has audioReady:', !!data.audioReady);
            console.log('[API] Has audioData:', !!data.audioData);
            
            if (data.question && !data.audioReady) {
              // First response with question text
              questionData = data;
              console.log('[API] ========================================');
              console.log('[API] ✓✓✓ LLM QUESTION RECEIVED FROM SERVER ✓✓✓');
              console.log('[API] ========================================');
              console.log('[API] Question:', data.question?.question || 'N/A');
              console.log('[API] LLM Latency:', data.latencies?.llmQuestion || 0, 'ms');
              console.log('[API] Now displaying question in frontend...');
              // Callback to update UI immediately
              if (onQuestionReady) {
                console.log('[API] Calling onQuestionReady callback to display question...');
                onQuestionReady(data);
                console.log('[API] ✓ onQuestionReady callback executed');
              } else {
                console.warn('[API] WARNING: onQuestionReady callback is null!');
              }
              console.log('[API] Waiting for TTS audio...');
            } else if (data.audioReady === true || (data.audioData && !data.question)) {
              // Second response with audio (audioReady is true OR has audioData without question)
              audioData = data;
              console.log('[API] ========================================');
              console.log('[API] TTS AUDIO RECEIVED - Ready to play');
              console.log('[API] ========================================');
              console.log('[API] audioReady flag:', data.audioReady);
              console.log('[API] Audio data length:', data.audioData?.length || 0, 'characters (base64)');
              console.log('[API] Audio data preview:', data.audioData ? data.audioData.substring(0, 50) + '...' : 'NULL');
              console.log('[API] TTS Latency:', data.latencies?.tts || 0, 'ms');
              // Callback to update UI with audio
              if (onAudioReady) {
                console.log('[API] Calling onAudioReady callback...');
                onAudioReady(data);
              } else {
                console.warn('[API] WARNING: onAudioReady callback is null!');
              }
            } else {
              console.warn('[API] Unknown data format - not question, not audio:', {
                hasQuestion: !!data.question,
                audioReady: data.audioReady,
                hasAudioData: !!data.audioData,
                keys: Object.keys(data)
              });
            }
          } catch (e) {
            console.error('[API] Failed to parse JSON:', line.substring(0, 200));
            console.error('[API] Parse error:', e);
          }
        }
      }
    }
    
    // Combine question and audio data for final return
    const combinedData = {
      ...questionData,
      audioData: audioData?.audioData || questionData?.audioData || null,
      latencies: {
        llmQuestion: questionData?.latencies?.llmQuestion || 0,
        tts: audioData?.latencies?.tts || questionData?.latencies?.tts || 0
      },
      llmRequest: questionData?.llmRequest || null
    };
    
    // Log LLM request details
    if (combinedData.llmRequest) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 LLM REQUEST:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('System Prompt:', combinedData.llmRequest.systemPrompt);
      console.log('User Prompt:', combinedData.llmRequest.userPrompt);
      console.log('Subject:', combinedData.llmRequest.subject);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    // Log LLM response
    if (combinedData.question) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 LLM RESPONSE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Question:', combinedData.question.question);
      console.log('Options:', combinedData.question.options);
      console.log('Correct Answer:', combinedData.question.correctAnswer);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    // Log latencies
    if (combinedData.latencies) {
      console.log('⏱️ Latencies:');
      console.log(`  - LLM Question Generation: ${combinedData.latencies.llmQuestion}ms`);
      // TTS latency is now logged separately when "Read Question" button is clicked
    }
    
    return combinedData;
  } catch (error) {
    console.error(`[API] Interview start failed:`, error);
    throw error;
  }
}

/**
 * Process voice and get conversational response (with auto-answer extraction)
 */
export async function processVoiceConversational(formData) {
  const startTime = performance.now();
  console.log('[API] Processing voice input...');
  try {
    const response = await axios.post(
      `${API_BASE_URL}/interview/process-voice`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        metadata: { startTime: startTime }, // For tracking
      }
    );
    const latency = performance.now() - startTime;
    console.log(`[API] Voice processed in ${latency.toFixed(2)}ms`);
    console.log('[API] Voice response:', response.data);
    return response.data;
  } catch (error) {
    const latency = performance.now() - startTime;
    console.error(`[API] Voice processing failed after ${latency.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Process voice input
 */
export async function processVoice(formData) {
  const response = await axios.post(
    `${API_BASE_URL}/interview/process-voice`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
}

/**
 * Submit answer for current question
 */
export async function submitAnswer(sessionId, answer) {
  const response = await api.post('/interview/submit-answer', {
    sessionId,
    answer,
  });
  return response.data;
}

/**
 * Get interview status
 */
export async function getInterviewStatus(sessionId) {
  const startTime = performance.now();
  console.log(`[API] Getting interview status for session: ${sessionId}`);
  try {
    const response = await api.get(`/interview/status/${sessionId}`);
    const latency = performance.now() - startTime;
    console.log(`[API] Interview status retrieved in ${latency.toFixed(2)}ms`);
    console.log('[API] Status response:', response.data);
    return response.data;
  } catch (error) {
    const latency = performance.now() - startTime;
    console.error(`[API] Get status failed after ${latency.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * End interview and get results
 */
export async function endInterview(sessionId) {
  const response = await api.post('/interview/end', { sessionId });
  return response.data;
}

/**
 * Convert text to speech
 */
export async function textToSpeech(text) {
  const response = await api.post('/audio/text-to-speech', { text });
  return response.data;
}

/**
 * Transcribe audio to text
 */
export async function transcribeAudio(formData) {
  const startTime = performance.now();
  try {
    const response = await axios.post(
      `${API_BASE_URL}/audio/transcribe`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    const totalLatency = performance.now() - startTime;
    const serverLatency = response.data.latency || 0;
    
    // Log transcription latency and text in browser console
    console.log(`[API] Speech to text latency: ${serverLatency}ms (server) / ${totalLatency.toFixed(2)}ms (total)`);
    console.log('[API] Speech to text:', response.data.text);
    console.log('[API] Full transcription response:', response.data);
    
    // Ensure latency is included in the response (prefer server latency, fallback to total)
    const finalLatency = serverLatency > 0 ? serverLatency : totalLatency;
    const result = {
      success: response.data.success,
      text: response.data.text,
      latency: finalLatency // STT latency for user answer
    };
    console.log('[API] STT for User Answer - Returning transcription result:');
    console.log('  - Text:', result.text);
    console.log('  - Latency:', result.latency, 'ms');
    console.log('  - Server Latency:', serverLatency, 'ms');
    console.log('  - Total Latency:', totalLatency.toFixed(2), 'ms');
    return result;
  } catch (error) {
    const latency = performance.now() - startTime;
    console.error(`[Transcription] Failed after ${latency.toFixed(2)}ms:`, error);
    throw error;
  }
}

/**
 * Validate answer using LLM
 */
export async function validateAnswer(question, transcribedText) {
  try {
    console.log(`[API] Validating answer for question:`, question.question);
    console.log(`[API] User's transcribed answer:`, transcribedText);
    
    const response = await axios.post(
      `${API_BASE_URL}/interview/validate-answer`,
      {
        question,
        transcribedText
      }
    );

    // Log LLM request details (if available in response)
    if (response.data.llmRequest) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 LLM VALIDATION REQUEST:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('System Prompt:', response.data.llmRequest.systemPrompt);
      console.log('User Prompt:', response.data.llmRequest.userPrompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // Log LLM validation message and latency in browser console
    if (response.data.latencies) {
      console.log('⏱️ Validation Latencies:');
      console.log(`  - LLM Validation: ${response.data.latencies.llmValidation}ms`);
      console.log(`  - Text-to-Speech: ${response.data.latencies.tts}ms`);
    }
    
    if (response.data.feedback) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📥 LLM VALIDATION RESPONSE:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Is Correct:', response.data.isCorrect === 1 ? '✓ Yes' : '✗ No');
      console.log('Feedback:', response.data.feedback);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    return response.data;
  } catch (error) {
    console.error(`[Validation] Failed:`, error);
    throw error;
  }
}

