/**
 * AI Interview System - Main Server Entry Point
 * 
 * This server handles:
 * - Voice input processing via OpenAI Whisper
 * - LLM interactions for interview questions
 * - Text-to-speech conversion
 * - Interview session management
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const interviewRoutes = require('./routes/interview');
const audioRoutes = require('./routes/audio');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow frontend origin from environment or default to localhost
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:3000'];

console.log('[Server] Allowed CORS origins:', allowedOrigins);
console.log('[Server] NODE_ENV:', process.env.NODE_ENV);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('[Server] Request with no origin - allowing');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list (normalize by removing trailing slashes)
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      const normalizedOrigin = origin.replace(/\/$/, '');
      const normalizedAllowed = allowedOrigin.replace(/\/$/, '');
      return normalizedOrigin === normalizedAllowed;
    });
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      console.log('[Server] CORS: Allowing origin:', origin);
      callback(null, true);
    } else {
      console.log('[Server] CORS: Blocking origin:', origin);
      console.log('[Server] CORS: Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting - skip for OPTIONS requests (preflight)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req) => req.method === 'OPTIONS' // Skip rate limiting for preflight requests
});
app.use('/api/', limiter);

// Routes
app.use('/api/interview', interviewRoutes);
app.use('/api/audio', audioRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Interview System is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  console.error('[Server Error] Stack:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

