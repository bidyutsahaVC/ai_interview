# Workflow Documentation

## Overview

The AI Interview System is a web-based application that conducts MCQ interviews using AI-powered question generation, speech-to-text transcription, and text-to-speech conversion. This document describes the complete workflow from user login to interview completion.

---

## System Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │◄───────►│   Server   │◄───────►│   OpenAI    │
│  (React)    │  HTTP   │  (Express) │   API   │    APIs     │
└─────────────┘         └─────────────┘         └─────────────┘
```

---

## Complete Interview Workflow

### Phase 1: Authentication & Setup

```
1. User opens application
   ↓
2. Login Screen displayed
   ↓
3. User enters:
   - Email (username)
   - Password (hardcoded: "5555")
   - Number of MCQs (default: 5)
   - Subject (dropdown: computer science, history, geography, politics, Indian mythology, or free text)
   ↓
4. User clicks "Login"
   ↓
5. System validates password
   ↓
6. If valid:
   - Extract username from email (text before @)
   - Store interview configuration
   - Initialize interview session
   - Navigate to interview screen
   ↓
7. If invalid:
   - Display error message
   - Stay on login screen
```

### Phase 2: Question Generation

```
1. Interview screen loads
   ↓
2. System calls: POST /api/interview/start
   Request: {
     subject: "computer science",
     previousQuestions: []
   }
   ↓
3. Backend:
   a. Generate question using LLM (GPT-4)
      - Use subject-specific system prompt
      - Avoid duplicate questions
      - Generate exactly one MCQ question
   b. Stream response to frontend
      - Send question text immediately
      - Include LLM latency
   ↓
4. Frontend receives question text
   ↓
5. Display question text in UI
   ↓
6. Automatically trigger TTS generation
   ↓
7. Call: POST /api/audio/text-to-speech
   Request: { text: question.readableText }
   ↓
8. Backend generates TTS audio
   ↓
9. Frontend receives audio data (base64)
   ↓
10. Convert base64 to audio blob
   ↓
11. Auto-play question audio
   ↓
12. User hears the question
```

### Phase 3: Answer Recording

```
1. Question audio finishes playing
   ↓
2. User clicks "Start Recording" button
   ↓
3. System:
   a. Stop any playing audio immediately
   b. Request microphone access
   c. Initialize MediaRecorder
   d. Start recording
   ↓
4. User speaks their answer
   ↓
5. User clicks "Stop Recording" button
   ↓
6. System:
   a. Stop MediaRecorder
   b. Collect audio chunks
   c. Create audio blob (WebM format)
   d. Show "Processing..." state
   ↓
7. Call: POST /api/audio/transcribe
   Request: FormData with audio blob
   ↓
8. Backend:
   a. Receive audio file
   b. Call OpenAI Whisper API
   c. Transcribe audio to text
   d. Return transcribed text + latency
   ↓
9. Frontend receives transcribed text
   ↓
10. Display transcribed text: "We hear you have said: [transcribed text]"
   ↓
11. Automatically trigger answer validation
```

### Phase 4: Answer Validation

```
1. System automatically calls: POST /api/interview/validate-answer
   Request: {
     question: { ...currentQuestion },
     transcribedText: "I think the answer is B"
   }
   ↓
2. Backend:
   a. Call LLM (GPT-4) to validate answer
      - Compare transcribed text with correct answer
      - Generate feedback
      - Determine if answer is correct (1) or incorrect (0)
   b. Generate TTS for feedback
      - Convert feedback text to speech
   c. Return validation result
      - isCorrect: 1 or 0
      - feedback: "Excellent! You're correct..."
      - audioData: base64 encoded audio
      - latencies: { llmValidation, tts }
   ↓
3. Frontend receives validation result
   ↓
4. Display:
   - Transcribed text: "We hear you have said: [text]"
   - AI Interviewer Response: "[feedback text]"
   ↓
5. Play feedback audio automatically
   ↓
6. Update UI:
   - Enable "Next Question" button
   - Disable "Play Once More" button
   - Disable "Start Recording" button
   ↓
7. Store result in interview results array
```

### Phase 5: Next Question

```
1. User clicks "Next Question" button
   ↓
2. System:
   a. Increment question number
   b. Reset all question-specific states
   c. Clear transcribed text
   d. Clear validation result
   e. Stop any playing audio
   f. Reset recording state
   ↓
3. Check if more questions needed
   ↓
4. If more questions:
   a. Call: POST /api/interview/start
      Request: {
        subject: "computer science", // Same subject throughout
        previousQuestions: [
          { question: "Question 1 text" },
          { question: "Question 2 text" },
          ...
        ]
      }
   b. Repeat Phase 2-4
   ↓
5. If all questions completed:
   a. Navigate to Report Screen
   b. Generate interview report
```

### Phase 6: Report Generation

```
1. All questions completed
   ↓
2. System calculates:
   - Total questions answered
   - Correct answers count
   - Score percentage
   - Interview duration
   ↓
3. Display Report Screen with:
   - Username
   - Subject
   - Date & Time
   - Score
   - Detailed results for each question
   ↓
4. User can:
   - View detailed report
   - Download PDF report
   - Download latency log (text file)
   - View admin log (latency breakdown)
   ↓
5. Report includes:
   - Question text
   - User's transcribed answer
   - AI Interviewer's response
   - Correct/Incorrect status
   - Explanation
```

---

## State Transitions

### Application States

```
┌─────────────┐
│   LOGIN     │
└──────┬──────┘
       │ (Login Success)
       ↓
┌─────────────┐
│  LOADING    │ (Initial question load)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ INTERVIEW   │◄────┐
│  (Question) │     │
└──────┬──────┘     │
       │            │
       │ (Next)     │ (More questions)
       ↓            │
┌─────────────┐    │
│  VALIDATING │    │
└──────┬──────┘    │
       │           │
       │ (Complete)│
       ↓           │
┌─────────────┐    │
│   REPORT    │    │
└─────────────┘    │
                   │
                   │
                   └─── (Back to INTERVIEW)
```

### Question States

```
┌─────────────┐
│  LOADING    │ (Question text loading)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  QUESTION   │ (Text displayed)
│   READY    │
└──────┬──────┘
       │
       ↓ (TTS generation)
┌─────────────┐
│  AUDIO      │ (Audio ready, auto-playing)
│  PLAYING    │
└──────┬──────┘
       │
       ↓ (User clicks Record)
┌─────────────┐
│ RECORDING   │ (User speaking)
└──────┬──────┘
       │
       ↓ (Stop recording)
┌─────────────┐
│ TRANSCRIBING│ (STT processing)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ VALIDATING  │ (LLM validation)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  COMPLETE   │ (Feedback displayed, Next enabled)
└─────────────┘
```

---

## Data Flow

### Question Generation Flow

```
Frontend (App.js)
  │
  │ POST /api/interview/start
  │ { subject, previousQuestions }
  ↓
Backend (interviewController.js)
  │
  │ generateSingleQuestion()
  ↓
Backend (interviewService.js)
  │
  │ generateQuestions()
  ↓
Backend (llmService.js)
  │
  │ OpenAI GPT-4 API
  ↓
Backend (prompts.js)
  │
  │ System & User Prompts
  ↓
Backend (llmService.js)
  │
  │ Parse JSON response
  ↓
Backend (interviewController.js)
  │
  │ Stream JSON response
  ↓
Frontend (api.js)
  │
  │ Parse streaming response
  ↓
Frontend (App.js)
  │
  │ Display question
  │ Generate TTS
  ↓
Backend (audioController.js)
  │
  │ POST /api/audio/text-to-speech
  │ OpenAI TTS API
  ↓
Frontend (App.js)
  │
  │ Play audio
```

### Answer Processing Flow

```
Frontend (App.js)
  │
  │ MediaRecorder captures audio
  │ Create audio blob
  ↓
Frontend (api.js)
  │
  │ POST /api/audio/transcribe
  │ FormData { audio: blob }
  ↓
Backend (audioController.js)
  │
  │ transcribeAudio()
  ↓
Backend (whisperService.js)
  │
  │ OpenAI Whisper API
  ↓
Backend (audioController.js)
  │
  │ Return { text, latency }
  ↓
Frontend (App.js)
  │
  │ Display transcribed text
  │ Auto-trigger validation
  ↓
Frontend (api.js)
  │
  │ POST /api/interview/validate-answer
  │ { question, transcribedText }
  ↓
Backend (interviewController.js)
  │
  │ validateAnswer()
  ↓
Backend (llmService.js)
  │
  │ OpenAI GPT-4 API
  │ Validate answer
  ↓
Backend (ttsService.js)
  │
  │ OpenAI TTS API
  │ Generate feedback audio
  ↓
Backend (interviewController.js)
  │
  │ Return { isCorrect, feedback, audioData, latencies }
  ↓
Frontend (App.js)
  │
  │ Display feedback
  │ Play feedback audio
  │ Enable Next Question
```

---

## Latency Tracking

The system tracks latencies for all major operations:

1. **LLM Question Generation** (`llmQuestionGeneration`)
   - Time from LLM API call to response
   - Measured in backend

2. **TTS Question Generation** (`ttsQuestionGeneration`)
   - Time from TTS API call to audio generation
   - Measured in backend

3. **STT User Answer** (`sttUserAnswer`)
   - Time from Whisper API call to transcription
   - Measured in backend

4. **LLM Answer Validation** (`llmAnswerValidation`)
   - Time from LLM API call to validation response
   - Measured in backend

5. **TTS Answer Validation** (`ttsAnswerValidation`)
   - Time from TTS API call to feedback audio generation
   - Measured in backend

All latencies are:
- Stored per question in `currentQuestionLatencies`
- Displayed in Admin Log view
- Included in downloadable latency log file
- Measured in milliseconds

---

## Error Handling

### Network Errors
- Display error message to user
- Allow retry for failed operations
- Log errors to console

### API Errors
- Backend returns error response with message
- Frontend displays user-friendly error
- Log detailed error for debugging

### Audio Errors
- Microphone access denied: Show error message
- Audio playback failed: Allow manual retry
- TTS generation failed: Show error, allow retry

### LLM Errors
- Question generation failed: Retry with same parameters
- Validation failed: Show error, allow manual next question

---

## User Interactions

### Button States

**"Next Question" Button:**
- Disabled: During question loading, recording, transcribing, validating
- Enabled: After validation complete, all questions answered

**"Play Once More" Button:**
- Visible: When question audio is available
- Disabled: During recording, after validation complete
- Enabled: When question audio is ready and not recording

**"Start Recording" Button:**
- Enabled: When question is ready and not recording
- Disabled: During recording, transcribing, validating, after validation complete
- Action: Stops any playing audio immediately

---

## Session Management

### Interview Session Data

```javascript
{
  username: "john_doe",
  subject: "computer science",
  totalMcqs: 5,
  currentQuestionNum: 3,
  interviewStartTime: Date,
  interviewResults: [
    {
      question: "Question text",
      transcribedText: "User's answer",
      aiResponse: "Feedback text",
      isCorrect: 1,
      explanation: "Explanation text",
      latencies: {
        llmQuestionGeneration: 2345,
        ttsQuestionGeneration: 567,
        sttUserAnswer: 1234,
        llmAnswerValidation: 890,
        ttsAnswerValidation: 456
      }
    },
    // ... more results
  ],
  askedQuestions: [
    { question: "Question 1 text" },
    { question: "Question 2 text" }
  ]
}
```

---

## Performance Optimizations

1. **Streaming Responses:** Question text is sent immediately, improving perceived performance
2. **On-Demand TTS:** TTS is generated only when needed, reducing initial load time
3. **Auto-Play Audio:** Question audio plays automatically when ready
4. **Immediate Audio Stop:** Recording stops any playing audio instantly
5. **Duplicate Prevention:** Tracks asked questions to avoid repetition
6. **Latency Tracking:** Monitors performance for optimization opportunities

---

## Security Considerations

1. **Password:** Currently hardcoded for demo (should use proper authentication in production)
2. **CORS:** Configured to allow specific origins
3. **Rate Limiting:** 100 requests per 15 minutes per IP
4. **File Upload Limits:** Maximum 10MB for audio files
5. **API Keys:** Stored in environment variables (not in code)

---

## Future Enhancements

1. **Authentication:** Implement proper user authentication (JWT, OAuth)
2. **Database:** Store interview sessions in database instead of memory
3. **Analytics:** Track user performance over time
4. **Multi-language:** Support multiple languages for questions and answers
5. **Voice Recognition:** Real-time voice recognition during recording
6. **Question Bank:** Pre-generated question bank for faster response
7. **Adaptive Difficulty:** Adjust question difficulty based on performance

