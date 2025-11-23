# Architecture Documentation

## System Overview

The AI Interview System is a full-stack web application that conducts MCQ interviews using AI-powered question generation, speech-to-text transcription, and text-to-speech conversion. The system is built with React (frontend) and Node.js/Express (backend), integrating with OpenAI APIs for LLM, Whisper, and TTS services.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ LoginScreen  │  │     App      │  │  Components  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                 │             │
│         └──────────────────┼─────────────────┘             │
│                            │                               │
│                    ┌───────▼────────┐                       │
│                    │  API Service  │                       │
│                    │   (api.js)    │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼───────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────┼───────────────────────────────┐
│                    SERVER LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Routes     │  │ Controllers  │  │  Middleware   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                 │           │
│         └──────────────────┼─────────────────┘           │
│                            │                             │
│                    ┌───────▼────────┐                   │
│                    │   Services     │                   │
│                    │  - LLM Service │                   │
│                    │  - TTS Service │                   │
│                    │  - Whisper Svc │                   │
│                    │  - Interview   │                   │
│                    └───────┬────────┘                   │
└────────────────────────────┼───────────────────────────────┘
                             │ API Calls
┌────────────────────────────┼───────────────────────────────┐
│                    EXTERNAL SERVICES                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ OpenAI GPT-4 │  │ OpenAI TTS   │  │ OpenAI      │     │
│  │              │  │              │  │ Whisper     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework:** React 18+
- **Language:** JavaScript (ES6+)
- **HTTP Client:** Axios, Fetch API
- **Audio:** HTML5 Audio API, MediaRecorder API
- **PDF Generation:** jsPDF
- **Styling:** CSS3

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** JavaScript (ES6+)
- **File Upload:** Multer
- **Rate Limiting:** express-rate-limit
- **CORS:** cors middleware

### External Services
- **OpenAI GPT-4:** Question generation and answer validation
- **OpenAI Whisper:** Speech-to-text transcription
- **OpenAI TTS:** Text-to-speech conversion

---

## Project Structure

```
AI-interview/
├── client/                          # Frontend React Application
│   ├── public/                      # Static assets
│   └── src/
│       ├── components/              # React Components
│       │   ├── LoginScreen.js      # Login/authentication UI
│       │   └── ...
│       ├── services/               # API Services
│       │   └── api.js              # HTTP client & API calls
│       ├── data/                   # Mock data
│       │   └── mockupData.js      # Configuration data
│       ├── App.js                  # Main application component
│       ├── App.css                 # Application styles
│       └── index.js                # React entry point
│
├── server/                          # Backend Node.js Application
│   ├── controllers/                # Request handlers
│   │   ├── interviewController.js  # Interview endpoints
│   │   └── audioController.js     # Audio endpoints
│   ├── services/                   # Business logic
│   │   ├── llmService.js          # LLM interactions
│   │   ├── ttsService.js          # Text-to-speech
│   │   ├── whisperService.js      # Speech-to-text
│   │   ├── interviewService.js    # Interview management
│   │   ├── prompts.js             # LLM prompts
│   │   └── openaiService.js       # OpenAI client wrapper
│   ├── routes/                     # API routes
│   │   ├── interview.js           # Interview routes
│   │   └── audio.js               # Audio routes
│   ├── middleware/                 # Express middleware
│   │   └── upload.js              # File upload handler
│   └── index.js                    # Server entry point
│
├── docs/                           # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── WORKFLOW_DOCUMENTATION.md
│   ├── STATE_TRANSITION_DIAGRAMS.md
│   └── ARCHITECTURE.md
│
└── package.json                    # Dependencies
```

---

## Component Architecture

### Frontend Components

#### App.js (Main Component)
**Responsibilities:**
- Application state management
- Interview flow orchestration
- Audio playback control
- Recording management
- Report generation

**Key State:**
- Authentication state
- Interview progress
- Question data
- Recording state
- Validation results

#### LoginScreen Component
**Responsibilities:**
- User authentication
- Interview configuration (MCQ count, subject)
- Username extraction from email

**Props:**
- `onLoginSuccess(username, email, mcqCount, subject)`

#### API Service (api.js)
**Responsibilities:**
- HTTP request handling
- Streaming response parsing
- Error handling
- Latency tracking

**Exports:**
- `startInterview(subject, previousQuestions, onQuestionReady)`
- `transcribeAudio(audioBlob)`
- `validateAnswer(question, transcribedText)`
- `textToSpeech(text)`

### Backend Components

#### Controllers Layer

**interviewController.js**
- `startInterview(req, res, next)` - Generate question
- `validateAnswer(req, res, next)` - Validate user answer

**audioController.js**
- `textToSpeech(req, res, next)` - Convert text to speech
- `transcribeAudio(req, res, next)` - Transcribe audio
- `streamAudio(req, res, next)` - Stream audio file

#### Services Layer

**llmService.js**
- `generateQuestions(subject, previousQuestions)` - Generate MCQ questions
- `validateAnswer(question, transcribedText)` - Validate answer
- `parseQuestionsResponse(response)` - Parse LLM response

**ttsService.js**
- `textToSpeech(text)` - Convert text to speech audio

**whisperService.js**
- `transcribeAudio(audioBuffer, filename)` - Transcribe audio to text

**interviewService.js**
- `generateSingleQuestion(subject, previousQuestions)` - Generate one question

**prompts.js**
- `getQuestionGenerationSystemPrompt(subject)` - System prompt for questions
- `getQuestionGenerationPrompt(previousQuestions)` - User prompt for questions
- `getValidationSystemPrompt()` - System prompt for validation
- `getValidationPrompt(question, transcribedText)` - User prompt for validation

---

## Data Flow

### Question Generation Flow

```
1. User logs in
   ↓
2. Frontend: App.js calls loadQuestion()
   ↓
3. Frontend: api.js calls startInterview()
   ↓
4. HTTP: POST /api/interview/start
   ↓
5. Backend: interviewController.startInterview()
   ↓
6. Backend: interviewService.generateSingleQuestion()
   ↓
7. Backend: llmService.generateQuestions()
   ↓
8. External: OpenAI GPT-4 API
   ↓
9. Backend: Parse response, stream to frontend
   ↓
10. Frontend: Parse streaming response
   ↓
11. Frontend: Display question, generate TTS
   ↓
12. Frontend: api.js calls textToSpeech()
   ↓
13. HTTP: POST /api/audio/text-to-speech
   ↓
14. Backend: audioController.textToSpeech()
   ↓
15. Backend: ttsService.textToSpeech()
   ↓
16. External: OpenAI TTS API
   ↓
17. Backend: Return base64 audio
   ↓
18. Frontend: Play audio automatically
```

### Answer Processing Flow

```
1. User records answer
   ↓
2. Frontend: MediaRecorder captures audio
   ↓
3. Frontend: Create audio blob
   ↓
4. Frontend: api.js calls transcribeAudio()
   ↓
5. HTTP: POST /api/audio/transcribe (multipart/form-data)
   ↓
6. Backend: audioController.transcribeAudio()
   ↓
7. Backend: whisperService.transcribeAudio()
   ↓
8. External: OpenAI Whisper API
   ↓
9. Backend: Return transcribed text
   ↓
10. Frontend: Display transcribed text, auto-validate
   ↓
11. Frontend: api.js calls validateAnswer()
   ↓
12. HTTP: POST /api/interview/validate-answer
   ↓
13. Backend: interviewController.validateAnswer()
   ↓
14. Backend: llmService.validateAnswer()
   ↓
15. External: OpenAI GPT-4 API
   ↓
16. Backend: ttsService.textToSpeech() for feedback
   ↓
17. External: OpenAI TTS API
   ↓
18. Backend: Return validation result + audio
   ↓
19. Frontend: Display feedback, play audio
```

---

## API Design

### RESTful Endpoints

**Interview Endpoints:**
- `POST /api/interview/start` - Start interview, generate question
- `POST /api/interview/validate-answer` - Validate user answer

**Audio Endpoints:**
- `POST /api/audio/text-to-speech` - Convert text to speech
- `POST /api/audio/transcribe` - Transcribe audio to text
- `GET /api/audio/stream/:sessionId` - Stream audio (legacy)

**Health Check:**
- `GET /api/health` - Service health status

### Request/Response Patterns

**Streaming Response:**
- `/interview/start` uses streaming to send question text immediately
- Response format: JSON chunks separated by newlines

**Standard JSON Response:**
- Most endpoints return standard JSON
- Includes `success`, `error`, and data fields

**Multipart Form Data:**
- `/audio/transcribe` accepts file uploads
- Uses Multer middleware for file handling

---

## State Management

### Frontend State Architecture

**Centralized State (App.js):**
- All interview state managed in main App component
- No external state management library (Redux, Zustand, etc.)
- Uses React hooks (useState, useEffect, useRef)

**State Categories:**
1. **Authentication State:** isAuthenticated, username, subject
2. **Interview State:** currentQuestionNum, interviewResults, askedQuestions
3. **Question State:** question, loading, error
4. **Recording State:** isRecording, mediaRecorderRef, audioChunksRef
5. **Audio State:** isAudioPlaying, hasAudioPlayed, audioRef
6. **Validation State:** transcribedText, validationResult, isValidating

**State Synchronization:**
- Uses `useRef` for synchronous state checks (isRecordingRef)
- Prevents stale closure issues in event handlers
- State updates trigger useEffect hooks for side effects

### Backend State Architecture

**Stateless Design:**
- Backend is stateless (no session storage)
- Each request is independent
- Previous questions passed in request body

**In-Memory Storage (Optional):**
- Audio files stored temporarily in memory (audioService)
- Not used in current implementation
- Could be extended for session management

---

## Security Architecture

### Authentication
- **Current:** Client-side hardcoded password
- **Future:** JWT tokens, OAuth integration

### CORS Configuration
- Configured for specific origins
- Environment-based origin whitelist
- Credentials enabled

### Rate Limiting
- 100 requests per 15 minutes per IP
- Applied to all `/api/` routes
- Prevents abuse and DoS attacks

### Input Validation
- Request body validation in controllers
- File size limits (10MB for audio)
- Type checking for required fields

### API Key Management
- OpenAI API key stored in environment variables
- Never exposed in client code
- Server-side only access

---

## Performance Architecture

### Optimization Strategies

1. **Streaming Responses:**
   - Question text sent immediately
   - Reduces perceived latency
   - Improves user experience

2. **On-Demand TTS:**
   - TTS generated only when needed
   - Reduces initial load time
   - Saves API costs

3. **Auto-Play Audio:**
   - Question audio plays automatically
   - Reduces user interaction
   - Smooth user experience

4. **Latency Tracking:**
   - All operations track latency
   - Performance monitoring
   - Optimization opportunities

### Caching Strategy

**Current:** No caching implemented
**Future Opportunities:**
- Cache common questions
- Cache TTS audio for repeated questions
- Browser audio caching

---

## Error Handling Architecture

### Frontend Error Handling

**Network Errors:**
- Axios interceptors catch errors
- Display user-friendly messages
- Allow retry for failed operations

**API Errors:**
- Parse error responses
- Display error messages in UI
- Log detailed errors to console

**Audio Errors:**
- Handle microphone access denied
- Handle audio playback failures
- Graceful degradation

### Backend Error Handling

**Error Middleware:**
- Centralized error handling
- Consistent error response format
- Stack traces in development

**Service Errors:**
- Try-catch blocks in all services
- Proper error propagation
- Detailed error logging

---

## Deployment Architecture

### Development Environment

```
Frontend: http://localhost:3000 (React Dev Server)
Backend:  http://localhost:5000 (Node.js)
```

### Production Environment

```
Frontend: Static build (React build)
Backend:  Node.js server (Express)
Database: (Future) PostgreSQL/MongoDB
```

### Environment Variables

**Frontend (.env):**
- `REACT_APP_API_URL` - Backend API URL

**Backend (.env):**
- `OPENAI_API_KEY` - OpenAI API key
- `PORT` - Server port
- `NODE_ENV` - Environment mode
- `FRONTEND_URL` - Allowed CORS origins

---

## Scalability Considerations

### Current Limitations

1. **Stateless Backend:**
   - No session persistence
   - Cannot scale horizontally without session management

2. **In-Memory Storage:**
   - Audio files stored in memory
   - Not suitable for production scale

3. **Single Server:**
   - No load balancing
   - No redundancy

### Future Scalability

1. **Database Integration:**
   - Store sessions in database
   - Enable horizontal scaling
   - Persistent data storage

2. **Caching Layer:**
   - Redis for session management
   - CDN for static assets
   - Cache common questions

3. **Microservices:**
   - Separate services for LLM, TTS, STT
   - Independent scaling
   - Better resource utilization

4. **Load Balancing:**
   - Multiple backend instances
   - Load balancer for distribution
   - High availability

---

## Monitoring & Logging

### Current Logging

**Frontend:**
- Console logs for debugging
- Performance timing logs
- Error logs

**Backend:**
- Console logs for requests
- Error stack traces
- Latency tracking

### Future Monitoring

1. **Application Monitoring:**
   - APM tools (New Relic, Datadog)
   - Error tracking (Sentry)
   - Performance metrics

2. **Logging:**
   - Centralized logging (ELK stack)
   - Structured logging (JSON)
   - Log aggregation

3. **Metrics:**
   - Request rates
   - Error rates
   - Latency percentiles
   - API usage

---

## Testing Architecture

### Current Testing

- Manual testing
- No automated tests

### Future Testing Strategy

1. **Unit Tests:**
   - Service functions
   - Utility functions
   - Component logic

2. **Integration Tests:**
   - API endpoints
   - Service interactions
   - Database operations

3. **E2E Tests:**
   - Complete user flows
   - Browser automation
   - Audio recording simulation

4. **Performance Tests:**
   - Load testing
   - Stress testing
   - Latency benchmarks

---

## Future Enhancements

1. **Database Integration:**
   - Store interview sessions
   - User accounts
   - Question banks

2. **Real-time Features:**
   - WebSocket for live updates
   - Real-time transcription
   - Live audio streaming

3. **Advanced AI:**
   - Adaptive difficulty
   - Personalized questions
   - Learning analytics

4. **Multi-language Support:**
   - Internationalization
   - Multi-language TTS
   - Translation services

5. **Mobile App:**
   - React Native
   - Native audio recording
   - Offline support

