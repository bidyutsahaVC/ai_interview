/**
 * Interview Screen Component
 * 
 * Fully conversational interview interface with:
 * - Voice-based question delivery
 * - Voice input for answers
 * - Automatic answer extraction
 * - Conversational AI responses
 */

import React, { useState, useEffect, useRef } from 'react';
import './InterviewScreen.css';
import VoiceRecorder from './VoiceRecorder';
import AudioVisualizer from './AudioVisualizer';
import { getInterviewStatus, endInterview } from '../services/api';

function InterviewScreen({ sessionId, onComplete, initialQuestion }) {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [llmAudioUrl, setLlmAudioUrl] = useState(null);
  const [questionAudioUrl, setQuestionAudioUrl] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [error, setError] = useState(null);
  const [conversationStatus, setConversationStatus] = useState('listening'); // listening, processing, speaking
  const audioRef = useRef(null);
  const questionAudioRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      console.log(`[InterviewScreen] [${new Date().toISOString()}] Session ID received:`, sessionId);
      console.log('[InterviewScreen] Initial question provided:', initialQuestion);
      
      // If initial question is provided, use it
      if (initialQuestion && initialQuestion.question && initialQuestion.options) {
        console.log('[InterviewScreen] Using initial question from props');
        console.log('[InterviewScreen] Question:', initialQuestion.question);
        console.log('[InterviewScreen] Options:', initialQuestion.options);
        
        // Set question text immediately (sync)
        setCurrentQuestion(initialQuestion);
        setQuestionNumber(initialQuestion.questionNumber || 1);
        
        // Set audio URL to play (sync)
        if (initialQuestion.questionAudioUrl) {
          const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${initialQuestion.questionAudioUrl}`;
          console.log('[InterviewScreen] Setting question audio URL:', fullUrl);
          setQuestionAudioUrl(fullUrl);
        } else {
          console.warn('[InterviewScreen] No question audio URL in initial question');
        }
      } else {
        // Otherwise, load from status
        console.log('[InterviewScreen] No initial question, loading from status...');
        initializeInterview();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, initialQuestion]);

  const initializeInterview = async () => {
    const startTime = performance.now();
    console.log('[InterviewScreen] Initializing interview...');
    try {
      const response = await getInterviewStatus(sessionId);
      const loadTime = performance.now() - startTime;
      console.log(`[InterviewScreen] Status loaded in ${loadTime.toFixed(2)}ms`);
      
      if (response.success && response.currentQuestion) {
        console.log('[InterviewScreen] Question received:', response.currentQuestion);
        // Validate question has required fields
        if (response.currentQuestion.question && response.currentQuestion.options) {
          console.log('[InterviewScreen] Setting question in state');
          setCurrentQuestion(response.currentQuestion);
          setQuestionNumber(response.currentQuestion.questionNumber);
          
          // Load question audio if available - questions are shown in text AND spoken
          if (response.questionAudioUrl) {
            const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.questionAudioUrl}`;
            console.log('[InterviewScreen] Setting question audio URL:', fullUrl);
            setQuestionAudioUrl(fullUrl);
          } else {
            console.warn('[InterviewScreen] No question audio URL in response');
          }
        } else {
          console.error('[InterviewScreen] Question data incomplete:', response.currentQuestion);
          setError('Question data is incomplete. Please try again.');
        }
      } else {
        console.error('[InterviewScreen] Invalid response:', response);
      }
    } catch (err) {
      const errorTime = performance.now() - startTime;
      console.error(`[InterviewScreen] Error initializing interview after ${errorTime.toFixed(2)}ms:`, err);
      setError('Failed to load question. Please refresh the page.');
    }
  };

  // Play beep sound
  const playBeep = () => {
    const beepStartTime = performance.now();
    console.log('[InterviewScreen] Playing beep sound...');
    
    try {
      // Generate beep using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800 Hz beep
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      const beepTime = performance.now() - beepStartTime;
      console.log(`[InterviewScreen] Beep played in ${beepTime.toFixed(2)}ms`);
    } catch (err) {
      console.error('[InterviewScreen] Error playing beep:', err);
    }
  };

  // Auto-play question audio when it's available (after text is shown)
  useEffect(() => {
    if (questionAudioUrl && questionAudioRef.current && currentQuestion) {
      const audioStartTime = performance.now();
      console.log(`[InterviewScreen] [${new Date().toISOString()}] Question audio URL changed`);
      console.log('[InterviewScreen] Question text is already displayed, now loading audio...');
      
      // Reset audio element to ensure it plays
      questionAudioRef.current.load();
      setIsPlayingQuestion(true);
      setConversationStatus('speaking');
      
      // Small delay to ensure audio is loaded
      const playAudio = () => {
        const playStartTime = performance.now();
        if (questionAudioRef.current) {
          console.log('[InterviewScreen] Attempting to play question audio...');
          questionAudioRef.current.play()
            .then(() => {
              const playTime = performance.now() - playStartTime;
              const totalTime = performance.now() - audioStartTime;
              console.log(`[InterviewScreen] Question audio started playing (play: ${playTime.toFixed(2)}ms, total: ${totalTime.toFixed(2)}ms)`);
            })
            .catch(err => {
              const errorTime = performance.now() - audioStartTime;
              console.error(`[InterviewScreen] Error playing question audio after ${errorTime.toFixed(2)}ms:`, err);
              setIsPlayingQuestion(false);
              setConversationStatus('listening');
            });
        }
      };
      
      // Try to play immediately, or wait for canplay event
      if (questionAudioRef.current.readyState >= 2) {
        console.log('[InterviewScreen] Audio ready, playing immediately');
        playAudio();
      } else {
        console.log('[InterviewScreen] Waiting for audio to load...');
        questionAudioRef.current.addEventListener('canplay', () => {
          const loadTime = performance.now() - audioStartTime;
          console.log(`[InterviewScreen] Audio can play (loaded in ${loadTime.toFixed(2)}ms)`);
          playAudio();
        }, { once: true });
        // Fallback timeout
        setTimeout(() => {
          console.log('[InterviewScreen] Fallback: attempting to play audio');
          playAudio();
        }, 500);
      }
    } else if (questionAudioUrl && !currentQuestion) {
      console.warn('[InterviewScreen] Question audio URL set but question text not ready yet');
    }
  }, [questionAudioUrl, currentQuestion]);

  const handleQuestionAudioEnd = () => {
    console.log(`[InterviewScreen] [${new Date().toISOString()}] Question audio finished playing`);
    setIsPlayingQuestion(false);
    setConversationStatus('listening');
    // Don't auto-start - wait for user to press button
    console.log('[InterviewScreen] Question audio complete. Waiting for user to press record button...');
  };

  const handleVoiceProcessed = async (response) => {
    console.log(`[InterviewScreen] [${new Date().toISOString()}] ========== VOICE PROCESSED ==========`);
    console.log('[InterviewScreen] Response received:', response);
    setIsProcessing(false);
    setConversationStatus('speaking');
    
    // Step 1: Play LLM feedback audio (TTS already generated on server)
    if (response.audioUrl) {
      const audioStartTime = performance.now();
      const fullAudioUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.audioUrl}`;
      console.log(`[InterviewScreen] [Step 1] Setting LLM feedback audio URL: ${fullAudioUrl}`);
      setLlmAudioUrl(fullAudioUrl);
      
      // Auto-play the LLM response
      if (audioRef.current) {
        const playStartTime = performance.now();
        console.log('[InterviewScreen] Playing LLM feedback audio...');
        audioRef.current.play()
          .then(() => {
            const playTime = performance.now() - playStartTime;
            const totalTime = performance.now() - audioStartTime;
            console.log(`[InterviewScreen] [Step 1] LLM feedback audio started (play: ${playTime.toFixed(2)}ms, total: ${totalTime.toFixed(2)}ms)`);
          })
          .catch(err => {
            const errorTime = performance.now() - audioStartTime;
            console.error(`[InterviewScreen] Error playing feedback audio after ${errorTime.toFixed(2)}ms:`, err);
          });
      }
    } else {
      console.warn('[InterviewScreen] No audio URL in response');
    }

    // If answer was submitted, move to next question
    if (response.answerSubmitted) {
      console.log('[InterviewScreen] Answer was submitted, processing next question...');
      if (response.nextQuestion) {
        // Wait for feedback audio to finish, then load and play next question
        const handleFeedbackEnd = () => {
          const nextQuestionStartTime = performance.now();
          console.log('[InterviewScreen] Feedback audio ended, loading next question...');
          console.log('[InterviewScreen] Next question data:', response.nextQuestion);
          
          // Validate next question before updating
          if (response.nextQuestion && response.nextQuestion.question && response.nextQuestion.options) {
            console.log('[InterviewScreen] Next question is valid, updating state...');
            // Update question immediately (text appears first)
            setCurrentQuestion(response.nextQuestion);
            setQuestionNumber(response.nextQuestion.questionNumber);
            setLlmAudioUrl(null);
            
            // Load and play next question audio
            if (response.nextQuestionAudioUrl) {
              const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.nextQuestionAudioUrl}`;
              console.log('[InterviewScreen] Next question audio URL:', fullUrl);
              // Clear previous URL first to trigger useEffect properly
              setQuestionAudioUrl(null);
              // Set new URL after a brief delay - useEffect will handle playing it
              setTimeout(() => {
                const setTime = performance.now() - nextQuestionStartTime;
                console.log(`[InterviewScreen] Setting next question audio (${setTime.toFixed(2)}ms after feedback end)`);
                setQuestionAudioUrl(fullUrl);
              }, 200);
            } else {
              console.warn('[InterviewScreen] No next question audio URL, fetching from status...');
              // If no audio URL, try to get it from status
              setTimeout(async () => {
                try {
                  const statusStartTime = performance.now();
                  const statusResponse = await getInterviewStatus(sessionId);
                  const statusTime = performance.now() - statusStartTime;
                  console.log(`[InterviewScreen] Status fetched in ${statusTime.toFixed(2)}ms`);
                  
                  if (statusResponse.success && statusResponse.questionAudioUrl) {
                    const fullUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${statusResponse.questionAudioUrl}`;
                    console.log('[InterviewScreen] Got question audio URL from status:', fullUrl);
                    setQuestionAudioUrl(null);
                    setTimeout(() => {
                      setQuestionAudioUrl(fullUrl);
                    }, 200);
                  } else {
                    console.warn('[InterviewScreen] No question audio URL in status response');
                  }
                } catch (err) {
                  const errorTime = performance.now() - nextQuestionStartTime;
                  console.error(`[InterviewScreen] Error loading next question audio after ${errorTime.toFixed(2)}ms:`, err);
                }
              }, 500);
            }
          } else {
            console.error('[InterviewScreen] Next question data is invalid:', response.nextQuestion);
            setError('Failed to load next question. Please try again.');
          }
        };
        
        // Wait for feedback audio to finish, then play beep, then next question
        if (audioRef.current && response.audioUrl) {
          // Use the existing audio element's ended event
          const handleEnded = () => {
            const beepStartTime = performance.now();
            console.log('[InterviewScreen] Feedback audio ended, playing beep before next question...');
            // Play beep sound
            playBeep();
            // Wait a bit after beep, then load next question
            setTimeout(() => {
              const beepTime = performance.now() - beepStartTime;
              console.log(`[InterviewScreen] Beep completed, loading next question (${beepTime.toFixed(2)}ms after feedback)`);
              handleFeedbackEnd();
            }, 300); // Small delay after beep
          };
          audioRef.current.addEventListener('ended', handleEnded, { once: true });
        } else {
          // If no audio, play beep and proceed
          playBeep();
          setTimeout(handleFeedbackEnd, 500);
        }
      } else {
        // Interview complete
        const handleCompletion = () => {
          setTimeout(async () => {
            const reportResponse = await endInterview(sessionId);
            if (reportResponse.success) {
              onComplete(reportResponse.report);
            }
          }, 1000);
        };
        
        if (audioRef.current) {
          audioRef.current.addEventListener('ended', handleCompletion, { once: true });
        } else {
          handleCompletion();
        }
      }
    }
  };

  const handleAudioPlay = () => {
    setIsPlayingAudio(true);
  };

  const handleAudioEnd = () => {
    setIsPlayingAudio(false);
    setConversationStatus('listening');
    // Don't auto-start recording - wait for user to press button
    console.log('[InterviewScreen] LLM feedback audio ended. Waiting for user to press record button...');
  };

  if (!currentQuestion || !currentQuestion.question) {
    return (
      <div className="interview-screen">
        <div className="loading">Loading question...</div>
      </div>
    );
  }

  return (
    <div className="interview-screen">
      <div className="interview-container">
        <div className="question-section">
          <div className="question-header">
            <span className="question-number">
              Question {questionNumber} of {currentQuestion.totalQuestions}
            </span>
            <span className={`status-badge ${conversationStatus}`}>
              {conversationStatus === 'listening' && '🎤 Listening...'}
              {conversationStatus === 'processing' && '⚙️ Processing...'}
              {conversationStatus === 'speaking' && '🔊 AI Speaking...'}
            </span>
          </div>
          
          <h2 className="question-text">
            {currentQuestion?.question || 'Loading question...'}
            {isPlayingQuestion && <span className="speaking-indicator"> 🔊 Speaking...</span>}
          </h2>
          
          <div className="options-container">
            {currentQuestion?.options && Object.entries(currentQuestion.options).map(([key, value]) => (
              <div key={key} className="option-display">
                <span className="option-key">{key}</span>
                <span className="option-text">{value}</span>
              </div>
            ))}
            {!currentQuestion?.options && (
              <div className="loading-options">Loading options...</div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="action-buttons">
            <VoiceRecorder
              sessionId={sessionId}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              onProcessed={handleVoiceProcessed}
              setIsProcessing={setIsProcessing}
              setConversationStatus={setConversationStatus}
              isProcessing={isProcessing}
            />
          </div>

          <div className="instructions">
            <p>💡 Speak your answer (e.g., "The answer is A" or "Option B")</p>
          </div>
        </div>

        <div className="audio-section">
          {(isPlayingAudio || isPlayingQuestion) && <AudioVisualizer />}
          
          {/* Question Audio */}
          {questionAudioUrl && (
            <audio
              ref={questionAudioRef}
              key={questionAudioUrl} // Force re-render when URL changes
              src={questionAudioUrl}
              onEnded={handleQuestionAudioEnd}
              onError={(e) => {
                console.error('Error loading question audio:', e);
                setIsPlayingQuestion(false);
                setConversationStatus('listening');
              }}
              preload="auto"
            />
          )}
          
          {/* LLM Response Audio */}
          {llmAudioUrl && (
            <audio
              ref={audioRef}
              src={llmAudioUrl}
              onPlay={handleAudioPlay}
              onEnded={handleAudioEnd}
              autoPlay
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewScreen;
