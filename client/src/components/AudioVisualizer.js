/**
 * Audio Visualizer Component
 * 
 * Displays audio equalizer visualization during LLM speech
 */

import React, { useEffect, useRef } from 'react';
import './AudioVisualizer.css';

function AudioVisualizer() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const barCount = 32;
    const barWidth = canvas.width / barCount;

    // Initialize bars with random heights for demo (only once)
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => ({
        height: Math.random() * 100,
        targetHeight: Math.random() * 100,
      }));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      barsRef.current.forEach((bar, index) => {
        // Smoothly transition to target height
        bar.height += (bar.targetHeight - bar.height) * 0.1;

        // Randomly change target height
        if (Math.random() < 0.1) {
          bar.targetHeight = Math.random() * 100;
        }

        // Draw bar
        const x = index * barWidth;
        const barHeight = (bar.height / 100) * canvas.height;
        const gradient = ctx.createLinearGradient(x, canvas.height, x, canvas.height - barHeight);
        
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(0.5, '#764ba2');
        gradient.addColorStop(1, '#f093fb');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, canvas.height - barHeight, barWidth - 4, barHeight);
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  return (
    <div className="audio-visualizer-container">
      <div className="visualizer-label">AI Speaking</div>
      <canvas
        ref={canvasRef}
        className="audio-visualizer"
        width={400}
        height={100}
      />
    </div>
  );
}

export default AudioVisualizer;

