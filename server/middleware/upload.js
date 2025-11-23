/**
 * File Upload Middleware
 * 
 * Handles audio file uploads for voice processing
 */

const multer = require('multer');
const path = require('path');

// Configure multer for audio file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept audio files
  const allowedMimes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/ogg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
}).single('audio');

module.exports = { uploadAudio };

