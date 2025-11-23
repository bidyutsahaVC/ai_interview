import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { startInterview, transcribeAudio, validateAnswer } from './services/api';
import LoginScreen from './components/LoginScreen';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [totalMcqs, setTotalMcqs] = useState(5);
  const [subject, setSubject] = useState('');
  const [currentQuestionNum, setCurrentQuestionNum] = useState(0);
  const [interviewResults, setInterviewResults] = useState([]);
  const [askedQuestions, setAskedQuestions] = useState([]); // Track asked questions to avoid duplicates
  const [showReport, setShowReport] = useState(false);
  const [showAdminLog, setShowAdminLog] = useState(false); // Admin log view
  const [interviewStartTime, setInterviewStartTime] = useState(null);
  const [currentQuestionLatencies, setCurrentQuestionLatencies] = useState(null); // Store latencies for current question
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [hasAudioPlayed, setHasAudioPlayed] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const audioRef = useRef(null);
  const feedbackAudioRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isRecordingRef = useRef(false); // Ref to track current recording state

  const handleLoginSuccess = (extractedUsername, email, mcqCount, selectedSubject) => {
    setUsername(extractedUsername);
    setTotalMcqs(parseInt(mcqCount));
    setSubject(selectedSubject);
    setIsAuthenticated(true);
    setCurrentQuestionNum(1);
    setInterviewStartTime(new Date());
    // Pass subject directly to avoid state update delay
    loadQuestion(false, selectedSubject);
  };

  // STEP 3: Prepare audio element and auto-play when audioData is available
  useEffect(() => {
    console.log('[App] ========================================');
    console.log('[App] useEffect triggered - Question audioData check');
    console.log('[App] ========================================');
    console.log('[App] Question exists:', !!question);
    console.log('[App] Question has audioData:', !!question?.audioData);
    console.log('[App] Current question number:', currentQuestionNum);
    console.log('[App] isRecording:', isRecording);
    console.log('[App] isRecordingRef.current:', isRecordingRef.current);
    
    if (question && question.audioData) {
      console.log('[App] ========================================');
      console.log('[App] STEP 3: TTS AUDIO RECEIVED - Preparing audio element and auto-playing');
      console.log('[App] ========================================');
      console.log('[App] Question number:', currentQuestionNum);
      console.log('[App] Question text:', question.question?.substring(0, 50) + '...');
      console.log('[App] Audio data length:', question.audioData?.length || 0, 'characters');
      
      // Reset hasAudioPlayed when new question audio is ready (for auto-play)
      // This ensures each new question can auto-play
      setHasAudioPlayed(false);
      setIsAudioPlaying(false);
      
      // Reset audio element to ensure clean state for new question
      if (audioRef.current) {
        console.log('[App] Resetting audio element for new question...');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      // Convert base64 to blob
      let audioUrl = null;
      try {
        const binaryString = atob(question.audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(audioBlob);
        
        console.log('[App] Audio blob created, size:', audioBlob.size, 'bytes');
        console.log('[App] Setting audio source and preparing for auto-play...');
        
        if (audioRef.current) {
          // Set up audio element
          audioRef.current.src = audioUrl;
          
          // Define event handlers
          const handleCanPlay = () => {
            console.log('[App] Audio element ready - checking if should auto-play...');
            
            // CRITICAL: Check current recording state using ref (not closure value)
            if (isRecordingRef.current) {
              console.log('[App] Recording is ACTIVE (checked via ref) - IMMEDIATELY skipping auto-play');
              return;
            }
            
            // Also check state as fallback
            if (isRecording) {
              console.log('[App] Recording is active (checked via state) - skipping auto-play');
              return;
            }
            
            // Auto-play logic: if audio is stopped (paused and currentTime is 0) and not recording
            // This means it's a fresh audio load for a new question
            if (audioRef.current && audioRef.current.paused && audioRef.current.currentTime === 0) {
              // Auto-play for fresh audio loads (new question TTS)
              console.log('[App] Fresh audio load detected - auto-playing...');
              
              const playPromise = audioRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('[App] ✓✓✓ AUDIO IS NOW PLAYING AUTOMATICALLY! ✓✓✓');
                    setIsAudioPlaying(true);
                    setHasAudioPlayed(true);
                  })
                  .catch(err => {
                    console.error('[App] ✗ Auto-play blocked by browser:', err);
                    console.error('[App] Error details:', err.message);
                    console.log('[App] User can click "Play Question Audio" button to play manually');
                    setIsAudioPlaying(false);
                  });
              }
            } else if (audioRef.current && !isRecording && !audioRef.current.paused) {
              // Audio is already playing, do nothing
              console.log('[App] Audio is already playing');
            } else if (audioRef.current && !isRecording && audioRef.current.paused && audioRef.current.currentTime > 0) {
              // Audio is paused (not stopped) - don't auto-play
              console.log('[App] Audio is paused (not stopped) - not auto-playing');
            }
          };
          
          const handleError = (e) => {
            console.error('[App] ✗ Audio element error:', e);
            setIsAudioPlaying(false);
          };
          
          // Fallback timeout reference for cleanup
          let fallbackTimeout = null;
          
          // Wrap handleCanPlay to clear fallback timeout when it fires
          const wrappedHandleCanPlay = () => {
            if (fallbackTimeout) {
              clearTimeout(fallbackTimeout);
              fallbackTimeout = null;
            }
            handleCanPlay();
          };
          
          // Remove any existing listeners first
          // We'll use a unique identifier to track this question's audio
          const questionId = `${currentQuestionNum}-${question.question?.substring(0, 20)}`;
          console.log('[App] Setting up audio for question:', questionId);
          
          // Reset audio element completely
          if (audioRef.current) {
            // Stop any current playback
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            // Clear old source
            audioRef.current.src = '';
            audioRef.current.load();
            console.log('[App] Audio element reset for new question');
          }
          
          // Set the new source
          audioRef.current.src = audioUrl;
          
          // Add event listeners (old ones are cleaned up in the cleanup function)
          audioRef.current.addEventListener('canplay', wrappedHandleCanPlay);
          audioRef.current.addEventListener('error', handleError);
          
          // Load the audio - this will trigger canplay event when ready
          console.log('[App] Loading audio element with new source...');
          audioRef.current.load();
          console.log('[App] Audio load() called, readyState:', audioRef.current.readyState, 'waiting for canplay event...');
          
          // Try to play immediately if audio is already ready (cached or loads instantly)
          if (audioRef.current.readyState >= 3) { // HAVE_FUTURE_DATA or higher
            console.log('[App] Audio already loaded (readyState >= 3), attempting immediate auto-play...');
            // Small delay to ensure everything is set up
            setTimeout(() => {
              wrappedHandleCanPlay();
            }, 100);
          }
          
          // Fallback: Try auto-play after a short delay in case canplay event doesn't fire
          // This ensures audio plays even if the event system has issues
          fallbackTimeout = setTimeout(() => {
            if (audioRef.current && 
                audioRef.current.readyState >= 2 && // HAVE_CURRENT_DATA or higher
                audioRef.current.paused && 
                audioRef.current.currentTime === 0 &&
                !isRecordingRef.current &&
                !isRecording) {
              console.log('[App] Fallback: Attempting auto-play after delay...');
              wrappedHandleCanPlay();
            }
          }, 500);
          
          // Cleanup function
        return () => {
            if (audioRef.current) {
              audioRef.current.removeEventListener('canplay', wrappedHandleCanPlay);
              audioRef.current.removeEventListener('error', handleError);
            }
            if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
            }
            if (fallbackTimeout) {
              clearTimeout(fallbackTimeout);
            }
        };
        } else {
          console.error('[App] ✗ audioRef.current is null! Audio element not found.');
        }
      } catch (err) {
        console.error('[App] ✗ Error processing audio data:', err);
        setIsAudioPlaying(false);
      }
    } else if (question && !question.audioData) {
      // Question text is ready but audio is not yet available
      console.log('[App] Question text displayed, waiting for TTS audio to arrive...');
      // Reset audio state when question exists but audio is not ready
      setIsAudioPlaying(false);
      setHasAudioPlayed(false); // Reset so new question can auto-play
    } else {
      // No question yet - reset state
      setIsAudioPlaying(false);
      setHasAudioPlayed(false);
    }
  }, [question?.audioData, currentQuestionNum]); // Trigger when audioData changes OR question number changes
  
  // Stop audio immediately when recording starts (STOP, not pause)
  // Also prevent audio from resuming when recording stops
  useEffect(() => {
    if (isRecording) {
      console.log('[App] ========================================');
      console.log('[App] RECORDING STARTED - STOPPING all audio (not pausing)');
      console.log('[App] ========================================');
      
      // STOP question audio (reset to beginning, not just pause)
      if (audioRef.current) {
        if (!audioRef.current.paused) {
          console.log('[App] STOPPING question audio (recording started)');
        }
        audioRef.current.pause();
        audioRef.current.currentTime = 0; // Reset to beginning (STOP, not pause)
        if (audioRef.current.src) {
          audioRef.current.load(); // Completely stop and reset
        }
        setIsAudioPlaying(false);
      }
      
      // STOP feedback audio (reset to beginning, not just pause)
      if (feedbackAudioRef.current) {
        if (!feedbackAudioRef.current.paused) {
          console.log('[App] STOPPING feedback audio (recording started)');
        }
        feedbackAudioRef.current.pause();
        feedbackAudioRef.current.currentTime = 0; // Reset to beginning (STOP, not pause)
        if (feedbackAudioRef.current.src) {
          feedbackAudioRef.current.load(); // Completely stop and reset
        }
      }
    } else {
      // Recording stopped - ensure audio does NOT resume/play
      console.log('[App] ========================================');
      console.log('[App] RECORDING STOPPED - Ensuring audio does NOT resume');
      console.log('[App] ========================================');
      
      // Make sure audio stays stopped (don't resume)
      if (audioRef.current) {
        if (!audioRef.current.paused) {
          console.log('[App] Audio was playing - stopping it (recording just stopped)');
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        // Always ensure audio is stopped and reset
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsAudioPlaying(false);
        console.log('[App] ✓ Audio confirmed stopped (will NOT resume)');
      }
      
      // Also stop feedback audio
      if (feedbackAudioRef.current) {
        feedbackAudioRef.current.pause();
        feedbackAudioRef.current.currentTime = 0;
      }
    }
  }, [isRecording]);
  
  // Track audio playback state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handlePlay = () => {
      setIsAudioPlaying(true);
      setHasAudioPlayed(true);
    };
    
    const handlePause = () => {
      setIsAudioPlaying(false);
    };
    
    const handleEnded = () => {
      setIsAudioPlaying(false);
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [question]);

  // Helper function to generate TTS for a question (can be called automatically or manually)
  const generateTTSForQuestion = async (questionToProcess) => {
    if (!questionToProcess) {
      console.error('[App] No question available to generate TTS');
      return;
    }

    console.log('[App] ========================================');
    console.log('[App] GENERATING TTS FOR QUESTION');
    console.log('[App] ========================================');
    
    // Stop any currently playing audio first
    if (audioRef.current && !audioRef.current.paused) {
      console.log('[App] Stopping currently playing audio before generating new TTS');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
    }
    
    setIsGeneratingAudio(true);
    
    try {
      // Get question text for TTS
      const questionText = questionToProcess.readableText || questionToProcess.question;
      console.log('[App] Question text for TTS:', questionText);
      
      // Call TTS API
      const startTime = performance.now();
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/audio/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: questionText })
      });
      
      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }
      
      const result = await response.json();
      const clientLatency = performance.now() - startTime;
      
      if (result.success && result.audioData) {
        console.log('[App] ✓ TTS audio generated successfully');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏱️ TTS LATENCY:');
        console.log(`  - Server Latency: ${result.latency || 0}ms`);
        console.log(`  - Client Latency (including network): ${clientLatency.toFixed(2)}ms`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[App] Audio data length:', result.audioData.length, 'characters (base64)');
        
        // Update question with audio data
        // Use functional update to ensure we're updating the current question
        console.log('[App] ========================================');
        console.log('[App] UPDATING QUESTION STATE WITH AUDIO DATA');
        console.log('[App] ========================================');
        setQuestion(prev => {
          if (prev) {
            console.log('[App] Previous question text:', prev.question?.substring(0, 50));
            console.log('[App] Previous question audioData exists:', !!prev.audioData);
            console.log('[App] New audioData length:', result.audioData?.length || 0);
            
            const updatedQuestion = {
              ...prev,
              audioData: result.audioData
            };
            
            console.log('[App] Updated question audioData exists:', !!updatedQuestion.audioData);
            console.log('[App] This should trigger useEffect for auto-play...');
            
            return updatedQuestion;
          }
          console.warn('[App] No previous question state to update with audioData');
          return prev;
        });
        
        // Force a small delay to ensure state update is processed
        // This helps React detect the state change and trigger useEffect
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // Update TTS latency
        if (result.latency) {
          setCurrentQuestionLatencies(prev => ({
            ...prev,
            ttsQuestionGeneration: result.latency
          }));
        }
        
        // Audio is ready - useEffect will handle auto-play when audioData is set
        console.log('[App] ✓ TTS audio ready - useEffect will auto-play when audio element is ready');
      } else {
        throw new Error('TTS generation failed');
      }
    } catch (error) {
      console.error('[App] ✗ Error generating TTS:', error);
      setError('Failed to generate audio. Please try again.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleReadQuestion = async () => {
    if (!question) {
      console.error('[App] No question available to read');
      return;
    }

    console.log('[App] ========================================');
    console.log('[App] READ BUTTON CLICKED - Generating TTS');
    console.log('[App] ========================================');
    
    // Use the shared TTS generation function
    await generateTTSForQuestion(question);
  };

  const handlePlayAudio = () => {
    console.log('[App] ========================================');
    console.log('[App] REPLAY/PLAY BUTTON CLICKED');
    console.log('[App] ========================================');
    
    if (!audioRef.current) {
      console.error('[App] ✗ audioRef.current is null! Audio element not found.');
      return;
    }
    
    // Check if audio is currently playing
    const isCurrentlyPlaying = !audioRef.current.paused && !audioRef.current.ended;
    
    if (isCurrentlyPlaying) {
      // If playing, stop it (pause and reset to beginning)
      console.log('[App] Audio is currently playing - stopping it');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
      console.log('[App] ✓ Audio stopped');
    } else {
      // If not playing, first stop any current playback, then play from beginning
      console.log('[App] Audio is not playing - stopping any current playback and starting from beginning');
      
      // Stop and reset to beginning
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
      
      // Play from beginning
      if (!isRecording) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[App] ✓ Audio playback started from beginning');
              setIsAudioPlaying(true);
              setHasAudioPlayed(true);
            })
            .catch(err => {
              console.error('[App] ✗ Error playing audio:', err);
              console.error('[App] Error details:', err.message);
              setIsAudioPlaying(false);
            });
        }
      } else {
        console.log('[App] Recording is active - cannot play audio');
      }
    }
  };

  const validateAnswerText = async (textToValidate, sttLatencyParam = null) => {
    if (!textToValidate || !question) {
      setError('Please record and transcribe an answer first');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await validateAnswer(question, textToValidate);
      
      if (response.success) {
        // Store validation result to display LLM response
        const result = {
          isCorrect: response.isCorrect,
          feedback: response.feedback,
          audioData: response.audioData
        };
        setValidationResult(result);
        
        // Get STT latency - use parameter if provided, otherwise from state
        // This ensures we capture the latency even if state hasn't updated yet
        const sttLatency = sttLatencyParam !== null 
          ? sttLatencyParam 
          : (currentQuestionLatencies?.sttUserAnswer || 0);
        
        // Save result for report with latencies
        const finalLatencies = {
          llmQuestionGeneration: currentQuestionLatencies?.llmQuestionGeneration || 0,
          ttsQuestionGeneration: currentQuestionLatencies?.ttsQuestionGeneration || 0,
          sttUserAnswer: sttLatency, // STT latency for user answer (use parameter to ensure it's captured)
          llmAnswerValidation: response.latencies?.llmValidation || 0,
          ttsAnswerValidation: response.latencies?.tts || 0
        };
        console.log('[App] ========================================');
        console.log('[App] SAVING INTERVIEW RESULT WITH LATENCIES');
        console.log('[App] ========================================');
        console.log('[App] Final Latencies:', finalLatencies);
        console.log('[App]   - LLM Question Generation:', finalLatencies.llmQuestionGeneration, 'ms');
        console.log('[App]   - TTS Question Generation:', finalLatencies.ttsQuestionGeneration, 'ms');
        console.log('[App]   - STT for User Answer:', finalLatencies.sttUserAnswer, 'ms');
        console.log('[App]   - LLM Answer Validation:', finalLatencies.llmAnswerValidation, 'ms');
        console.log('[App]   - TTS Answer Validation:', finalLatencies.ttsAnswerValidation, 'ms');
        console.log('[App] Current question latencies state:', currentQuestionLatencies);
        console.log('[App] Validation response latencies:', response.latencies);
        
        const interviewResult = {
          questionNumber: currentQuestionNum,
          question: question.question,
          options: question.options,
          userAnswer: textToValidate,
          isCorrect: response.isCorrect,
          feedback: response.feedback,
          latencies: finalLatencies
        };
        setInterviewResults(prev => [...prev, interviewResult]);
        // Track asked question to avoid duplicates
        setAskedQuestions(prev => [...prev, { question: question.question }]);
        // Clear current question latencies
        setCurrentQuestionLatencies(null);

        // Play feedback audio
        if (response.audioData && feedbackAudioRef.current) {
          try {
            const binaryString = atob(response.audioData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            feedbackAudioRef.current.src = audioUrl;
            feedbackAudioRef.current.play().catch(err => {
              console.error('Error playing feedback audio:', err);
            });
          } catch (err) {
            console.error('Error processing feedback audio:', err);
          }
        }
      } else {
        setError('Failed to validate answer');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Error validating answer: ' + err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSendAnswer = async () => {
    await validateAnswerText(transcribedText);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      // IMMEDIATELY stop any playing audio (STOP, not pause) - synchronous, no delays
      console.log('[App] ========================================');
      console.log('[App] START RECORDING CLICKED - IMMEDIATELY STOPPING all audio');
      console.log('[App] ========================================');
      
      // CRITICAL: Update ref and state FIRST before stopping audio
      // This ensures any queued handleCanPlay events will see recording is active
      isRecordingRef.current = true;
      setIsRecording(true); // Set state immediately
      
      // IMMEDIATELY STOP question audio (synchronous, no async operations)
      if (audioRef.current) {
        const wasPlaying = !audioRef.current.paused;
        console.log('[App] Question audio state - paused:', audioRef.current.paused, 'currentTime:', audioRef.current.currentTime);
        
        if (wasPlaying) {
          console.log('[App] IMMEDIATELY STOPPING question audio (recording started)');
        }
        
        // IMMEDIATE STOP: pause, reset to beginning (synchronous operations)
        try {
          // Stop immediately - these are synchronous operations
          audioRef.current.pause(); // Stop playback immediately
          audioRef.current.currentTime = 0; // Reset to beginning (STOP, not pause)
          setIsAudioPlaying(false); // Update state immediately
          
          console.log('[App] ✓ Question audio IMMEDIATELY STOPPED (not paused)');
        } catch (err) {
          console.error('[App] Error stopping question audio:', err);
          setIsAudioPlaying(false); // Ensure state is updated even on error
        }
      } else {
        // Even if audioRef is null, ensure state is correct
        setIsAudioPlaying(false);
      }
      
      // IMMEDIATELY STOP feedback audio (synchronous, no async operations)
      if (feedbackAudioRef.current) {
        const wasPlaying = !feedbackAudioRef.current.paused;
        console.log('[App] Feedback audio state - paused:', feedbackAudioRef.current.paused, 'currentTime:', feedbackAudioRef.current.currentTime);
        
        if (wasPlaying) {
          console.log('[App] IMMEDIATELY STOPPING feedback audio (recording started)');
        }
        
        // IMMEDIATE STOP: pause, reset to beginning (synchronous operations)
        // DO NOT call load() as it might trigger canplay event
        try {
          // Stop immediately - these are synchronous operations
          feedbackAudioRef.current.pause(); // Stop playback immediately
          feedbackAudioRef.current.currentTime = 0; // Reset to beginning (STOP, not pause)
          
          console.log('[App] ✓ Feedback audio IMMEDIATELY STOPPED (not paused)');
        } catch (err) {
          console.error('[App] Error stopping feedback audio:', err);
        }
      }
      
      console.log('[App] All audio IMMEDIATELY stopped - Recording state already set to true');
      console.log('[App] Starting recording now...');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Create audio blob and send for transcription
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Send for transcription
          setIsTranscribing(true);
          try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            const response = await transcribeAudio(formData);
            if (response.success) {
              setTranscribedText(response.text);
              
              // Capture STT latency for user answer
              const sttLatency = response.latency || 0;
              console.log('[App] ========================================');
              console.log('[App] STT FOR USER ANSWER - Latency captured');
              console.log('[App] ========================================');
              console.log('[App] STT Latency:', sttLatency, 'ms');
              console.log('[App] Transcribed Text:', response.text);
              console.log('[App] Full Response:', response);
              
              // Update latencies with STT for user answer - use functional update to ensure we have latest state
              setCurrentQuestionLatencies(prev => {
                if (prev) {
                  const updated = {
                    ...prev,
                    sttUserAnswer: sttLatency // STT latency for user answer
                  };
                  console.log('[App] Updated latencies with STT for user answer:', updated);
                  return updated;
                } else {
                  // If latencies not initialized, create them
                  console.warn('[App] Creating new latencies object for STT');
                  return {
                    questionNumber: currentQuestionNum || 1,
                    llmQuestionGeneration: 0,
                    ttsQuestionGeneration: 0,
                    sttUserAnswer: sttLatency, // STT latency for user answer
                    llmAnswerValidation: 0,
                    ttsAnswerValidation: 0
                  };
                }
              });
              
              // Automatically send for validation immediately after transcription
              // Pass sttLatency directly to ensure it's captured even if state hasn't updated
              setIsTranscribing(false);
              await validateAnswerText(response.text, sttLatency);
            } else {
              setError('Transcription failed');
              setIsTranscribing(false);
            }
          } catch (err) {
            console.error('Transcription error:', err);
            setError('Error transcribing audio: ' + err.message);
            setIsTranscribing(false);
          }
        };

        mediaRecorder.start();
        // isRecording is already set to true above, before getUserMedia
      } catch (err) {
        console.error('Error accessing microphone:', err);
        setError('Error accessing microphone: ' + err.message);
      }
    }
  };

  const loadQuestion = async (isNext = false, subjectToUse = null) => {
    try {
      if (isNext) {
        setIsLoadingNext(true);
      } else {
        setLoading(true);
      }
      
      // Reset state for new question
      setTranscribedText('');
      setValidationResult(null);
      setError(null);
      setIsAudioPlaying(false);
      setHasAudioPlayed(false);
      setIsRecording(false);
      // CRITICAL: Reset the recording ref to ensure auto-play works for new questions
      isRecordingRef.current = false;
      console.log('[App] Reset isRecordingRef.current to false for new question');
      
      // Use provided subject or fall back to state (for subsequent questions)
      const currentSubject = subjectToUse || subject || 'general knowledge';
      // Get list of previously asked questions to avoid duplicates
      const previousQuestions = askedQuestions.map(r => ({ question: r.question }));
      console.log(`[App] Loading question for subject: ${currentSubject} (from ${subjectToUse ? 'parameter' : 'state'})`);
      console.log(`[App] Previously asked questions: ${previousQuestions.length}`);
      
      // Callbacks for streaming updates
      const onQuestionReady = (questionData) => {
        // STEP 1: Show question text immediately when LLM generates it
        console.log('[App] ========================================');
        console.log('[App] ✓✓✓ STEP 1: LLM QUESTION IS READY! ✓✓✓');
        console.log('[App] ========================================');
        console.log('[App] Question:', questionData.question?.question || 'N/A');
        console.log('[App] Options:', questionData.question?.options || 'N/A');
        console.log('[App] LLM Latency:', questionData.latencies?.llmQuestion || 0, 'ms');
        console.log('[App] Now displaying question in frontend UI...');
        
        // Set question with text only (no audio yet)
        const newQuestion = {
          ...questionData.question,
          audioData: null // Audio not ready yet - will be updated when TTS completes
        };
        setQuestion(newQuestion);
        
        console.log('[App] ✓ Question state updated - Question text is now visible to user');
        console.log('[App] Automatically starting TTS generation...');
        
        // Store initial latencies
        if (questionData.latencies) {
          const latencies = {
            questionNumber: currentQuestionNum || 1,
            llmQuestionGeneration: questionData.latencies.llmQuestion || 0,
            ttsQuestionGeneration: 0, // Will be updated when audio arrives
            sttUserAnswer: 0,
            llmAnswerValidation: 0,
            ttsAnswerValidation: 0
          };
          console.log('[App] Storing initial question latencies:', latencies);
          setCurrentQuestionLatencies(latencies);
        }
        
        // Stop loading since question text is ready
        setLoading(false);
        setIsLoadingNext(false);
        console.log('[App] ✓ Loading state cleared - User can now see the question');
        
        // Automatically start TTS generation for the question
        // Use setTimeout to ensure state is updated first, then use current question from state
        setTimeout(() => {
          // Use the question from state (which was just set above) instead of local newQuestion
          // This ensures we're working with the actual state
          generateTTSForQuestion(newQuestion);
        }, 150); // Slightly longer delay to ensure state is fully updated
      };
      
      // TTS is automatically generated when question is ready (via onQuestionReady callback)
      // Only pass onQuestionReady callback since TTS is generated automatically after question text is ready
      const response = await startInterview(currentSubject, previousQuestions, onQuestionReady, null);
      
      // Final update with complete data (in case callbacks didn't fire or for fallback)
      if (response.success && response.question) {
        setQuestion({
          ...response.question,
          audioData: response.audioData || null
        });
        
        // Store final latencies
        if (response.latencies) {
          const latencies = {
            questionNumber: currentQuestionNum || 1,
            llmQuestionGeneration: response.latencies.llmQuestion || 0,
            ttsQuestionGeneration: response.latencies.tts || 0,
            sttUserAnswer: 0,
            llmAnswerValidation: 0,
            ttsAnswerValidation: 0
          };
          console.log('[App] Storing final question latencies:', latencies);
          setCurrentQuestionLatencies(latencies);
        }
      } else {
        setError('Failed to load question');
      }
    } catch (err) {
      setError('Error loading question: ' + err.message);
    } finally {
      if (isNext) {
        setIsLoadingNext(false);
      } else {
        setLoading(false);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionNum >= totalMcqs) {
      // All questions completed, show report
      setShowReport(true);
    } else {
      setCurrentQuestionNum(currentQuestionNum + 1);
      // Pass subject from state for subsequent questions
      loadQuestion(true, subject);
    }
  };

  const downloadLatencyFile = () => {
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0];
    
    let content = '='.repeat(80) + '\n';
    content += 'AI INTERVIEW LATENCY REPORT\n';
    content += '='.repeat(80) + '\n\n';
    content += `Candidate: ${username}\n`;
    content += `Subject: ${subject}\n`;
    content += `Interview Date & Time: ${interviewStartTime ? interviewStartTime.toLocaleString() : 'N/A'}\n`;
    content += `Report Generated: ${now.toLocaleString()}\n`;
    content += `Total Questions: ${interviewResults.length}\n\n`;
    content += '='.repeat(80) + '\n';
    content += 'LATENCY BREAKDOWN BY QUESTION\n';
    content += '='.repeat(80) + '\n\n';
    
    interviewResults.forEach((result, index) => {
      content += `Question ${result.questionNumber}\n`;
      content += '-'.repeat(80) + '\n';
      content += `Question: ${result.question}\n\n`;
      
      if (result.latencies) {
        content += 'Latencies:\n';
        content += `  - LLM Call for Question Generation: ${result.latencies.llmQuestionGeneration || 0} ms\n`;
        content += `  - TTS for LLM Question Generation: ${result.latencies.ttsQuestionGeneration || 0} ms\n`;
        content += `  - STT for User Answer: ${result.latencies.sttUserAnswer || 0} ms\n`;
        content += `  - LLM Call for Answer Validation: ${result.latencies.llmAnswerValidation || 0} ms\n`;
        content += `  - TTS for Answer Validation: ${result.latencies.ttsAnswerValidation || 0} ms\n`;
        
        const totalLatency = (result.latencies.llmQuestionGeneration || 0) + 
                            (result.latencies.ttsQuestionGeneration || 0) + 
                            (result.latencies.sttUserAnswer || 0) + 
                            (result.latencies.llmAnswerValidation || 0) + 
                            (result.latencies.ttsAnswerValidation || 0);
        content += `  - Total Latency: ${totalLatency} ms\n`;
      } else {
        content += 'Latencies: Not available\n';
      }
      
      content += `Status: ${result.isCorrect === 1 ? 'Correct' : 'Incorrect'}\n`;
      content += `User Answer: ${result.userAnswer}\n\n`;
    });
    
    // Summary statistics
    content += '='.repeat(80) + '\n';
    content += 'SUMMARY STATISTICS\n';
    content += '='.repeat(80) + '\n\n';
    
    const latencies = interviewResults.map(r => r.latencies).filter(l => l);
    if (latencies.length > 0) {
      const avgLLMQuestion = latencies.reduce((sum, l) => sum + (l.llmQuestionGeneration || 0), 0) / latencies.length;
      const avgTTSQuestion = latencies.reduce((sum, l) => sum + (l.ttsQuestionGeneration || 0), 0) / latencies.length;
      const avgSTT = latencies.reduce((sum, l) => sum + (l.sttUserAnswer || 0), 0) / latencies.length;
      const avgLLMValidation = latencies.reduce((sum, l) => sum + (l.llmAnswerValidation || 0), 0) / latencies.length;
      const avgTTSValidation = latencies.reduce((sum, l) => sum + (l.ttsAnswerValidation || 0), 0) / latencies.length;
      
      content += `Average LLM Call for Question Generation: ${avgLLMQuestion.toFixed(2)} ms\n`;
      content += `Average TTS for LLM Question Generation: ${avgTTSQuestion.toFixed(2)} ms\n`;
      content += `Average STT for User Answer: ${avgSTT.toFixed(2)} ms\n`;
      content += `Average LLM Call for Answer Validation: ${avgLLMValidation.toFixed(2)} ms\n`;
      content += `Average TTS for Answer Validation: ${avgTTSValidation.toFixed(2)} ms\n`;
      
      const totalAvg = avgLLMQuestion + avgTTSQuestion + avgSTT + avgLLMValidation + avgTTSValidation;
      content += `Average Total Latency per Question: ${totalAvg.toFixed(2)} ms\n`;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-latency-report-${username}-${timestamp}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadReport = async () => {
    // Dynamically import jsPDF
    const { default: jsPDF } = await import('jspdf');
    
    // Also download latency file
    downloadLatencyFile();
    
    const correctCount = interviewResults.filter(r => r.isCorrect === 1).length;
    const totalCount = interviewResults.length;
    const score = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0;
    
    const now = new Date();
    const interviewDate = interviewStartTime ? interviewStartTime.toLocaleString() : now.toLocaleString();
    const reportDate = now.toLocaleString();

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with gradient effect (simulated with colored box)
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('AI Interview Report', pageWidth / 2, 25, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    yPosition = 50;

    // Candidate Information Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Candidate Information', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${username}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Subject: ${subject}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Interview Date & Time: ${interviewDate}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Report Generated: ${reportDate}`, 20, yPosition);
    yPosition += 15;

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Questions: ${totalCount}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Correct Answers: ${correctCount}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Score: ${score}%`, 20, yPosition);
    yPosition += 15;

    // Detailed Results
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Results', 20, yPosition);
    yPosition += 10;

    interviewResults.forEach((result, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      // Question Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      const statusColor = result.isCorrect === 1 ? [40, 167, 69] : [220, 53, 69];
      doc.setTextColor(...statusColor);
      doc.text(`Question ${result.questionNumber} - ${result.isCorrect === 1 ? 'Correct ✓' : 'Incorrect ✗'}`, 20, yPosition);
      yPosition += 8;

      // Question Text
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const questionLines = doc.splitTextToSize(result.question, pageWidth - 40);
      doc.text(questionLines, 20, yPosition);
      yPosition += questionLines.length * 6 + 5;

      // Options
      if (result.options) {
        doc.setFont('helvetica', 'bold');
        doc.text('Options:', 20, yPosition);
        yPosition += 6;
        doc.setFont('helvetica', 'normal');
        Object.entries(result.options).forEach(([key, value]) => {
          const optionText = `${key}: ${value}`;
          const optionLines = doc.splitTextToSize(optionText, pageWidth - 50);
          doc.text(optionLines, 30, yPosition);
          yPosition += optionLines.length * 6;
        });
        yPosition += 3;
      }

      // User Answer
      doc.setFont('helvetica', 'bold');
      doc.text('Your Answer:', 20, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const answerLines = doc.splitTextToSize(result.userAnswer, pageWidth - 40);
      doc.text(answerLines, 20, yPosition);
      yPosition += answerLines.length * 6 + 3;

      // Feedback
      doc.setFont('helvetica', 'bold');
      doc.text('Feedback:', 20, yPosition);
      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const feedbackLines = doc.splitTextToSize(result.feedback, pageWidth - 40);
      doc.text(feedbackLines, 20, yPosition);
      yPosition += feedbackLines.length * 6 + 10;

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;
    });

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Save PDF
    const fileName = `interview-report-${username}-${now.toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Show admin log if requested
  if (showAdminLog) {
    return (
      <div className="App">
        <div className="question-container report-container">
          <div className="report-header" style={{ position: 'relative' }}>
            <h1>Admin Log - Latency Report</h1>
            <button onClick={() => setShowAdminLog(false)} style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>
              Back to Report
            </button>
            <p className="report-subtitle">Performance metrics for each question</p>
          </div>
          
          <div className="report-info">
            <p><strong>Candidate:</strong> {username}</p>
            <p><strong>Subject:</strong> {subject}</p>
            <p><strong>Interview Date & Time:</strong> {interviewStartTime ? interviewStartTime.toLocaleString() : 'N/A'}</p>
            <p><strong>Total Questions:</strong> {interviewResults.length}</p>
          </div>

          <div className="admin-log-container">
            {interviewResults.map((result, index) => (
              <div key={index} className="admin-log-item">
                <div className="admin-log-header">
                  <h3>Question {result.questionNumber}</h3>
                  <span className={`result-status ${result.isCorrect === 1 ? 'correct' : 'incorrect'}`}>
                    {result.isCorrect === 1 ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <div className="admin-log-question">{result.question}</div>
                {result.latencies && (
                  <div className="admin-log-latencies">
                    <h4>Latencies:</h4>
                    <div className="latency-grid">
                      <div className="latency-item">
                        <span className="latency-label">LLM Call for Question Generation:</span>
                        <span className="latency-value">{result.latencies.llmQuestionGeneration || 0} ms</span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">TTS for LLM Question Generation:</span>
                        <span className="latency-value">
                          {result.latencies.ttsQuestionGeneration > 0 
                            ? `${result.latencies.ttsQuestionGeneration} ms` 
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">STT for User Answer:</span>
                        <span className="latency-value">{result.latencies.sttUserAnswer || 0} ms</span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">LLM Call for Answer Validation:</span>
                        <span className="latency-value">{result.latencies.llmAnswerValidation || 0} ms</span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">TTS for Answer Validation:</span>
                        <span className="latency-value">{result.latencies.ttsAnswerValidation || 0} ms</span>
                      </div>
                      <div className="latency-item total">
                        <span className="latency-label">Total:</span>
                        <span className="latency-value">
                          {((result.latencies.llmQuestionGeneration || 0) + 
                            (result.latencies.ttsQuestionGeneration || 0) + 
                            (result.latencies.sttUserAnswer || 0) + 
                            (result.latencies.llmAnswerValidation || 0) + 
                            (result.latencies.ttsAnswerValidation || 0))} ms
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {interviewResults.length > 0 && interviewResults[0].latencies && (
              <div className="admin-log-summary">
                <h3>Summary Statistics</h3>
                {(() => {
                  const latencies = interviewResults.map(r => r.latencies).filter(l => l);
                  const avgLLMQuestion = latencies.reduce((sum, l) => sum + (l.llmQuestionGeneration || 0), 0) / latencies.length;
                  const avgTTSQuestion = latencies.reduce((sum, l) => sum + (l.ttsQuestionGeneration || 0), 0) / latencies.length;
                  const avgSTT = latencies.reduce((sum, l) => sum + (l.sttUserAnswer || 0), 0) / latencies.length;
                  const avgLLMValidation = latencies.reduce((sum, l) => sum + (l.llmAnswerValidation || 0), 0) / latencies.length;
                  const avgTTSValidation = latencies.reduce((sum, l) => sum + (l.ttsAnswerValidation || 0), 0) / latencies.length;
                  const totalAvg = avgLLMQuestion + avgTTSQuestion + avgSTT + avgLLMValidation + avgTTSValidation;
                  
                  return (
                    <div className="latency-grid">
                      <div className="latency-item">
                        <span className="latency-label">Avg LLM Call for Question Generation:</span>
                        <span className="latency-value">{avgLLMQuestion.toFixed(2)} ms</span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">Avg TTS for LLM Question Generation:</span>
                        <span className="latency-value">{avgTTSQuestion.toFixed(2)} ms</span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">Avg STT for User Answer:</span>
                        <span className="latency-value">{avgSTT.toFixed(2)} ms</span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">Avg LLM Call for Answer Validation:</span>
                        <span className="latency-value">{avgLLMValidation.toFixed(2)} ms</span>
                      </div>
                      <div className="latency-item">
                        <span className="latency-label">Avg TTS for Answer Validation:</span>
                        <span className="latency-value">{avgTTSValidation.toFixed(2)} ms</span>
                      </div>
                      <div className="latency-item total">
                        <span className="latency-label">Avg Total:</span>
                        <span className="latency-value">{totalAvg.toFixed(2)} ms</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show report screen when all questions are completed
  if (showReport) {
    const correctCount = interviewResults.filter(r => r.isCorrect === 1).length;
    const totalCount = interviewResults.length;
    const score = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0;

    return (
      <div className="App">
        <div className="question-container report-container">
          <div className="report-header">
            <h1>Interview Report</h1>
            <p className="report-subtitle">Congratulations on completing the interview!</p>
            <div className="report-info">
              <p><strong>Candidate:</strong> {username}</p>
              <p><strong>Subject:</strong> {subject}</p>
              <p><strong>Interview Date & Time:</strong> {interviewStartTime ? interviewStartTime.toLocaleString() : new Date().toLocaleString()}</p>
              <p><strong>Report Generated:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <div className="report-summary">
            <div className="summary-card">
              <div className="summary-value">{totalCount}</div>
              <div className="summary-label">Total Questions</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{correctCount}</div>
              <div className="summary-label">Correct Answers</div>
            </div>
            <div className="summary-card">
              <div className="summary-value">{score}%</div>
              <div className="summary-label">Score</div>
            </div>
          </div>

          <div className="report-details">
            <h2>Detailed Results</h2>
            {interviewResults.map((result, index) => (
              <div key={index} className="result-item">
                <div className="result-header">
                  <span className="result-number">Question {result.questionNumber}</span>
                  <span className={`result-status ${result.isCorrect === 1 ? 'correct' : 'incorrect'}`}>
                    {result.isCorrect === 1 ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
                <div className="result-question">{result.question}</div>
                <div className="result-answer">
                  <strong>Your Answer:</strong> {result.userAnswer}
                </div>
                <div className="result-feedback">
                  <strong>Feedback:</strong> {result.feedback}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '30px', flexWrap: 'wrap' }}>
            <button onClick={downloadReport} className="download-btn">
              Download Report (PDF + Latency File)
            </button>
            <button onClick={() => setShowAdminLog(true)} className="download-btn" style={{ background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)' }}>
              View Admin Log
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderHeader = () => (
    <div className="user-header">
      <div className="user-info">
        <svg className="user-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z" fill="currentColor"/>
          <path d="M8 9C4.68629 9 2 11.6863 2 15C2 15.5523 2.44772 16 3 16H13C13.5523 16 14 15.5523 14 15C14 11.6863 11.3137 9 8 9Z" fill="currentColor"/>
        </svg>
        <span className="username">Welcome, {username}</span>
      </div>
      <button
        onClick={handleNextQuestion}
        className="header-next-btn"
        disabled={!validationResult || isLoadingNext || isValidating}
      >
        {isLoadingNext ? 'Loading...' : currentQuestionNum >= totalMcqs ? 'View Report' : 'Next Question'}
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="App">
        <div className="question-container">
          {renderHeader()}
        <div className="loading">Loading question...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="question-container">
          {renderHeader()}
        <div className="error">{error}</div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="App">
        <div className="question-container">
          {renderHeader()}
        <div className="error">No question available</div>
        </div>
      </div>
    );
  }

  // Show loading state when loading next question
  if (isLoadingNext) {
  return (
    <div className="App">
      <div className="question-container">
          {renderHeader()}
          <div className="loading-next-question">
            <div className="loading-spinner"></div>
            <p>Loading next question...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="question-container">
        {renderHeader()}
          <h1>MCQ Question {currentQuestionNum} of {totalMcqs}</h1>
        <div className="question">
          <h2>{question.question}</h2>
          <div className="options">
            {Object.entries(question.options || {}).map(([key, value]) => (
              <div key={key} className="option">
                <strong>{key}:</strong> {value}
              </div>
            ))}
          </div>
          <div className="audio-recording-controls">
          {/* Read button - generates TTS on demand */}
          {question && !question.audioData && !isGeneratingAudio && (
            <button 
              onClick={handleReadQuestion} 
              className="read-btn"
              disabled={!!validationResult || isGeneratingAudio}
            >
              <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9V15H7L12 20V4L7 9H3ZM16.5 12C16.5 10.23 15.5 8.71 14 7.97V16.02C15.5 15.29 16.5 13.77 16.5 12ZM14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z" fill="currentColor"/>
              </svg>
              <span>Read Question</span>
            </button>
          )}
          
          {/* Loading state while generating audio */}
          {isGeneratingAudio && (
            <div className="audio-loading-indicator" style={{ 
              padding: '10px 20px', 
              color: '#666', 
              fontSize: '0.9rem', 
              fontStyle: 'italic',
              background: '#f5f5f5',
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              ⏳ Generating audio...
            </div>
          )}
          
          {/* Play button - shows when audio is ready */}
          {question && question.audioData && (
            <button 
              onClick={handlePlayAudio} 
              className="play-audio-btn"
              disabled={!!validationResult}
            >
              <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {isAudioPlaying ? (
                  <path d="M6 4H10V20H6V4ZM14 4H18V20H14V4Z" fill="currentColor"/>
                ) : (
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                )}
              </svg>
              <span>{isAudioPlaying ? 'Playing...' : hasAudioPlayed ? 'Replay Audio' : 'Play Question Audio'}</span>
            </button>
          )}
          
            <button 
              onClick={handleToggleRecording} 
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              disabled={isTranscribing || !!validationResult}
            >
              <svg className="btn-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                {isRecording ? (
                  <path d="M6 6H18V18H6V6Z" fill="currentColor"/>
                ) : (
                  <path d="M12 14C13.1 14 14 13.1 14 12V6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6V12C10 13.1 10.9 14 12 14ZM17.3 12C17.3 15 14.8 17.4 11.8 17.8V20H16V22H8V20H12.2V17.8C9.2 17.4 6.7 15 6.7 12H8.7C8.7 14.2 10.5 16 12.7 16C14.9 16 16.7 14.2 16.7 12H17.3Z" fill="currentColor"/>
                )}
              </svg>
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
          </div>
            
          <div className="recording-section">
            {isTranscribing && (
              <div className="transcribing">Transcribing...</div>
            )}
            
            {isValidating && (
              <div className="validating-indicator">
                <p>Validating...</p>
              </div>
            )}

            {(transcribedText || validationResult) && (
              <div className="response-container">
                {transcribedText && (
                  <p className="transcribed-line"><strong>We hear you have said:</strong> {transcribedText}</p>
                )}
            {validationResult && (
                  <p className="llm-line"><strong>AI Interviewer Response:</strong> {validationResult.feedback}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <audio ref={audioRef} />
      <audio ref={feedbackAudioRef} />
    </div>
  );
}

export default App;
