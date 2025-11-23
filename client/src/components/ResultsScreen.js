/**
 * Results Screen Component
 * 
 * Displays test report with:
 * - Score
 * - Answer details with justifications
 * - Performance summary
 */

import React from 'react';
import './ResultsScreen.css';

function ResultsScreen({ report, onRestart }) {
  if (!report) {
    return (
      <div className="results-screen">
        <div className="error">No results available</div>
      </div>
    );
  }

  const scorePercentage = report.score;
  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="results-screen">
      <div className="results-container">
        <h1>📊 Test Report</h1>
        
        <div className="score-section">
          <div className="score-circle" style={{ borderColor: getScoreColor(scorePercentage) }}>
            <div className="score-value" style={{ color: getScoreColor(scorePercentage) }}>
              {scorePercentage}%
            </div>
            <div className="score-label">Score</div>
          </div>
          
          <div className="score-details">
            <div className="detail-item">
              <span className="detail-label">Correct Answers:</span>
              <span className="detail-value correct">{report.correctAnswers}/{report.totalQuestions}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Incorrect Answers:</span>
              <span className="detail-value incorrect">{report.incorrectAnswers}/{report.totalQuestions}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{report.duration} seconds</span>
            </div>
          </div>
        </div>

        <div className="answers-section">
          <h2>Answer Details</h2>
          {report.answers.map((answer, index) => (
            <div
              key={index}
              className={`answer-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <div className="answer-header">
                <span className="answer-number">Question {answer.questionNumber}</span>
                <span className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </span>
              </div>
              
              <div className="answer-question">{answer.question}</div>
              
              <div className="answer-details">
                <div className="answer-row">
                  <span className="answer-label">Your Answer:</span>
                  <span className={`answer-value ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                    {answer.userAnswer}
                  </span>
                </div>
                <div className="answer-row">
                  <span className="answer-label">Correct Answer:</span>
                  <span className="answer-value correct">{answer.correctAnswer}</span>
                </div>
              </div>
              
              <div className="answer-explanation">
                <strong>Explanation:</strong> {answer.explanation}
              </div>
            </div>
          ))}
        </div>

        <button className="restart-button" onClick={onRestart}>
          Take Another Test
        </button>
      </div>
    </div>
  );
}

export default ResultsScreen;

