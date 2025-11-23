/**
 * Voice Recorder Component
 * 
 * Handles microphone recording and sending audio to server
 * Now uses conversational processing that extracts answers automatically
 */

import React, { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';
import { processVoiceConversational } from '../services/api';

function VoiceRecorder({ 
  sessionId, 
  isRecording, 
  setIsRecording, 
  onProcessed, 
  setIsProcessing,
  setConversationStatus,
  isProcessing: externalIsProcessing
}) {
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [error, setError] = useState(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Auto-start recording when isRecording becomes true
  useEffect(() => {
    if (isRecording && !mediaRecorder && !externalIsProcessing) {
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, mediaRecorder, externalIsProcessing]);

  const startRecording = async () => {
    const startTime = performance.now();
    console.log(`[VoiceRecorder] [${new Date().toISOString()}] ========== STARTING RECORDING ==========`);
    try {
      setError(null);
      if (setConversationStatus) {
        setConversationStatus('listening');
      }
      
      const streamStartTime = performance.now();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const streamTime = performance.now() - streamStartTime;
      console.log(`[VoiceRecorder] [Step 1] Microphone access granted in ${streamTime.toFixed(2)}ms`);
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      const chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const stopTime = performance.now();
        console.log(`[VoiceRecorder] [${new Date().toISOString()}] ========== RECORDING STOPPED ==========`);
        console.log(`[VoiceRecorder] Creating audio blob from ${chunks.length} chunks...`);
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const blobTime = performance.now() - stopTime;
        console.log(`[VoiceRecorder] [Step 1] Audio blob created in ${blobTime.toFixed(2)}ms (${audioBlob.size} bytes)`);
        console.log(`[VoiceRecorder] [Step 2] Sending audio to server for processing...`);
        await sendAudioToServer(audioBlob);
      };

      const recorderStartTime = performance.now();
      recorder.start();
      setMediaRecorder(recorder);
      const recorderTime = performance.now() - recorderStartTime;
      const totalTime = performance.now() - startTime;
      console.log(`[VoiceRecorder] [Step 2] MediaRecorder started in ${recorderTime.toFixed(2)}ms`);
      console.log(`[VoiceRecorder] ========== RECORDING ACTIVE (total setup: ${totalTime.toFixed(2)}ms) ==========`);
    } catch (err) {
      setError('Microphone access denied or not available');
      console.error('Error accessing microphone:', err);
      setIsRecording(false);
      if (setConversationStatus) {
        setConversationStatus('listening');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log('[VoiceRecorder] Stopping recording...');
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setMediaRecorder(null);
      console.log('[VoiceRecorder] Recording stopped, processing audio...');
    }
  };

  const sendAudioToServer = async (audioBlob) => {
    const startTime = performance.now();
    console.log(`[VoiceRecorder] [${new Date().toISOString()}] Sending audio to server...`);
    console.log(`[VoiceRecorder] Audio blob size: ${audioBlob.size} bytes`);
    
    setIsProcessing(true);
    setError(null);
    
    if (setConversationStatus) {
      setConversationStatus('processing');
    }

    try {
      const formDataStartTime = performance.now();
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('sessionId', sessionId);
      console.log(`[VoiceRecorder] FormData created in ${(performance.now() - formDataStartTime).toFixed(2)}ms`);

      const response = await processVoiceConversational(formData);
      const totalTime = performance.now() - startTime;
      console.log(`[VoiceRecorder] Voice processed in ${totalTime.toFixed(2)}ms`);
      console.log('[VoiceRecorder] Response:', response);
      
      if (response.success) {
        console.log('[VoiceRecorder] Processing successful, calling onProcessed');
        onProcessed(response);
      } else {
        console.error('[VoiceRecorder] Processing failed:', response);
        setError('Failed to process voice. Please try again.');
        if (setConversationStatus) {
          setConversationStatus('listening');
        }
      }
    } catch (err) {
      const errorTime = performance.now() - startTime;
      console.error(`[VoiceRecorder] Error after ${errorTime.toFixed(2)}ms:`, err);
      setError(err.message || 'Failed to process voice. Please try again.');
      if (setConversationStatus) {
        setConversationStatus('listening');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      if (!externalIsProcessing) {
        setIsRecording(true);
      }
    }
  };

  return (
    <div className="voice-recorder">
      <button
        className={`record-button ${isRecording ? 'recording' : ''} ${externalIsProcessing ? 'processing' : ''}`}
        onClick={handleToggleRecording}
        disabled={!sessionId || externalIsProcessing}
      >
        {externalIsProcessing ? (
          <>
            <span className="processing-indicator">⏳</span>
            Processing...
          </>
        ) : isRecording ? (
          <>
            <span className="recording-indicator"></span>
            Stop & Send
          </>
        ) : (
          <>
            <span className="mic-icon">🎤</span>
            Start Speaking
          </>
        )}
      </button>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}

export default VoiceRecorder;
