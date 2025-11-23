/**
 * Welcome Screen Component
 * 
 * Initial screen where user starts the interview
 */

import React, { useState } from 'react';
import './WelcomeScreen.css';
import { startInterview } from '../services/api';

function WelcomeScreen({ onStart }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStart = async () => {
    const startTime = performance.now();
    console.log(`[WelcomeScreen] [${new Date().toISOString()}] Starting interview...`);
    setLoading(true);
    setError(null);

    try {
      const response = await startInterview();
      const totalTime = performance.now() - startTime;
      console.log(`[WelcomeScreen] Interview started in ${totalTime.toFixed(2)}ms`);
      
      if (response.success) {
        console.log('[WelcomeScreen] Interview started successfully');
        console.log('[WelcomeScreen] Question received:', response.question);
        console.log('[WelcomeScreen] Question audio URL:', response.questionAudioUrl);
        
        // Pass complete question data along with sessionId (including all question fields)
        onStart(response.sessionId, {
          ...response.question, // Spread all question properties
          questionAudioUrl: response.questionAudioUrl
        });
      } else {
        console.error('[WelcomeScreen] Interview start failed:', response);
        setError('Failed to start interview. Please try again.');
      }
    } catch (err) {
      const errorTime = performance.now() - startTime;
      console.error(`[WelcomeScreen] Interview start error after ${errorTime.toFixed(2)}ms:`, err);
      setError(err.message || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-card">
        <h1>🎤 AI Interview System</h1>
        <p className="subtitle">
          Fully conversational voice-based interview. Questions and responses are spoken aloud.
        </p>
        <div className="features">
          <div className="feature-item">
            <span className="icon">🎯</span>
            <span>5 MCQ Questions</span>
          </div>
          <div className="feature-item">
            <span className="icon">🗣️</span>
            <span>Voice Interaction</span>
          </div>
          <div className="feature-item">
            <span className="icon">📊</span>
            <span>Detailed Report</span>
          </div>
        </div>
        {error && <div className="error-message">{error}</div>}
        <button
          className="start-button"
          onClick={handleStart}
          disabled={loading}
        >
          {loading ? 'Starting...' : 'Start Interview'}
        </button>
        <p className="info-text">
          Make sure your microphone is enabled and working
        </p>
      </div>
    </div>
  );
}

export default WelcomeScreen;

