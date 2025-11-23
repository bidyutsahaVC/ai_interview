/**
 * Mockup Data File
 * 
 * This file contains all hardcoded values and mockup data for the application.
 * Centralizing these values makes it easier to maintain and update.
 */

// Authentication credentials
export const AUTH_DATA = {
  // Default email and password for login form
  DEFAULT_EMAIL: 'admin@example.com',
  DEFAULT_PASSWORD: '5555',
  
  // Valid password for login authentication
  VALID_PASSWORD: '5555',
  
  // Error messages
  ERROR_MESSAGES: {
    INCORRECT_PASSWORD: 'Incorrect password',
    LOGIN_FAILED: 'Login failed. Please try again.',
  },
  
  // Login form configuration
  LOGIN_CONFIG: {
    SUBMIT_DELAY: 300, // Delay in milliseconds for better UX
    DEFAULT_MCQ_COUNT: 5, // Default number of MCQs
    DEFAULT_SUBJECT: 'Computer Science', // Default subject
  },
  
  // Subject options for interview
  SUBJECT_OPTIONS: [
    'Computer Science',
    'History',
    'Geography',
    'Politics',
    'Indian Mythology',
    'Custom'
  ],
};

// You can add more mockup data here as needed
// For example:
// export const USER_DATA = { ... };
// export const INTERVIEW_DATA = { ... };

