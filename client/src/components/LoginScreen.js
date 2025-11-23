import React, { useState } from 'react';
import './LoginScreen.css';
import { AUTH_DATA } from '../data/mockupData';

function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail] = useState(AUTH_DATA.DEFAULT_EMAIL);
  const [password, setPassword] = useState(AUTH_DATA.DEFAULT_PASSWORD);
  const [mcqCount, setMcqCount] = useState(AUTH_DATA.LOGIN_CONFIG.DEFAULT_MCQ_COUNT);
  const [subject, setSubject] = useState(AUTH_DATA.LOGIN_CONFIG.DEFAULT_SUBJECT);
  const [customSubject, setCustomSubject] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract username from email (part before @)
  const extractUsername = (email) => {
    if (!email || !email.includes('@')) {
      return email || '';
    }
    return email.split('@')[0];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (password === AUTH_DATA.VALID_PASSWORD) {
        const username = extractUsername(email);
        const selectedSubject = subject === 'Custom' ? customSubject.trim() : subject;
        if (subject === 'Custom' && !customSubject.trim()) {
          setError('Please enter a custom subject');
          setIsSubmitting(false);
          return;
        }
        onLoginSuccess(username, email, parseInt(mcqCount), selectedSubject);
      } else {
        setError(AUTH_DATA.ERROR_MESSAGES.INCORRECT_PASSWORD);
        setIsSubmitting(false);
      }
    }, AUTH_DATA.LOGIN_CONFIG.SUBMIT_DELAY);
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome</h1>
            <p>Please sign in to continue</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                disabled={isSubmitting}
                className="form-select"
              >
                {AUTH_DATA.SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {subject === 'Custom' && (
              <div className="form-group">
                <label htmlFor="customSubject">Enter Custom Subject</label>
                <input
                  type="text"
                  id="customSubject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Enter your custom subject"
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="mcqCount">Number of MCQs</label>
              <input
                type="number"
                id="mcqCount"
                value={mcqCount}
                onChange={(e) => setMcqCount(e.target.value)}
                placeholder="Enter number of MCQs"
                min="1"
                max="20"
                required
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="error-message" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting || !email || !password || !mcqCount || mcqCount < 1 || (subject === 'Custom' && !customSubject.trim())}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;

