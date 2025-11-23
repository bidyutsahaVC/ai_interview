# API Documentation

## Base URL

**Development:** `http://localhost:5000/api`  
**Production:** Configure via `REACT_APP_API_URL` environment variable

---

## Authentication

Currently, no authentication is required. The system uses client-side login with hardcoded credentials for demo purposes.

---

## Interview Endpoints

### 1. Start Interview

Generate a single MCQ question for the interview session.

**Endpoint:** `POST /api/interview/start`

**Request Body:**
```json
{
  "subject": "computer science",
  "previousQuestions": [
    { "question": "What is the capital of India?" },
    { "question": "Who invented the telephone?" }
  ]
}
```

**Request Parameters:**
- `subject` (string, optional): Subject/topic for question generation. Default: "general knowledge"
  - Options: "computer science", "history", "geography", "politics", "indian mythology", or any custom text
- `previousQuestions` (array, optional): List of previously asked questions to avoid duplicates
  - Each item: `{ "question": "question text" }`

**Response (Streaming):**
The response is sent as a streaming JSON chunk:

```json
{
  "success": true,
  "question": {
    "question": "What is the main function of a compiler in computer science?",
    "options": {
      "A": "To execute code",
      "B": "To translate high-level code to machine code",
      "C": "To debug programs",
      "D": "To store data"
    },
    "correctAnswer": "B",
    "explanation": "A compiler translates high-level programming language code into machine code that can be executed by a computer.",
    "readableText": "What is the main function of a compiler in computer science? Option A: To execute code. Option B: To translate high-level code to machine code. Option C: To debug programs. Option D: To store data."
  },
  "audioData": null,
  "llmRequest": {
    "model": "gpt-4",
    "messages": [...],
    "temperature": 0.7
  },
  "latencies": {
    "llmQuestion": 2345,
    "tts": 0
  },
  "audioReady": false
}
```

**Response Fields:**
- `success` (boolean): Request success status
- `question` (object): Generated MCQ question
  - `question` (string): Question text
  - `options` (object): Answer options (A, B, C, D)
  - `correctAnswer` (string): Correct answer key (A, B, C, or D)
  - `explanation` (string): Explanation of the correct answer
  - `readableText` (string): Full question text formatted for TTS
- `audioData` (string|null): Base64 encoded audio (null for initial response)
- `llmRequest` (object|null): LLM request details for debugging
- `latencies` (object): Performance metrics
  - `llmQuestion` (number): LLM question generation latency in milliseconds
  - `tts` (number): TTS generation latency (0 for initial response)
- `audioReady` (boolean): Whether audio is included in this response

**Status Codes:**
- `200` - Success
- `400` - Bad request (invalid parameters)
- `500` - Server error

**Notes:**
- Response is streamed: question text is sent immediately, TTS is generated on-demand
- The frontend should call `/api/audio/text-to-speech` separately to generate audio

---

### 2. Validate Answer

Validate user's transcribed answer using LLM and generate feedback.

**Endpoint:** `POST /api/interview/validate-answer`

**Request Body:**
```json
{
  "question": {
    "question": "What is the main function of a compiler?",
    "options": {
      "A": "To execute code",
      "B": "To translate high-level code to machine code",
      "C": "To debug programs",
      "D": "To store data"
    },
    "correctAnswer": "B"
  },
  "transcribedText": "I think the answer is B, to translate high-level code to machine code"
}
```

**Request Parameters:**
- `question` (object, required): The question object from the interview
- `transcribedText` (string, required): User's transcribed answer text

**Response:**
```json
{
  "success": true,
  "isCorrect": 1,
  "feedback": "Excellent! You're absolutely correct. A compiler is indeed a program that translates high-level programming language code into machine code that can be executed by a computer.",
  "audioData": "base64_encoded_audio_string...",
  "llmRequest": {
    "model": "gpt-4",
    "messages": [...],
    "temperature": 0.7
  },
  "latencies": {
    "llmValidation": 1234,
    "tts": 567
  }
}
```

**Response Fields:**
- `success` (boolean): Request success status
- `isCorrect` (number): 1 if correct, 0 if incorrect
- `feedback` (string): LLM-generated feedback text
- `audioData` (string): Base64 encoded audio of the feedback
- `llmRequest` (object|null): LLM request details for debugging
- `latencies` (object): Performance metrics
  - `llmValidation` (number): LLM validation latency in milliseconds
  - `tts` (number): TTS generation latency in milliseconds

**Status Codes:**
- `200` - Success
- `400` - Bad request (missing required fields)
- `500` - Server error

---

## Audio Endpoints

### 1. Text to Speech

Convert text to speech audio (on-demand TTS generation).

**Endpoint:** `POST /api/audio/text-to-speech`

**Request Body:**
```json
{
  "text": "What is the main function of a compiler in computer science?"
}
```

**Request Parameters:**
- `text` (string, required): Text to convert to speech

**Response:**
```json
{
  "success": true,
  "audioData": "base64_encoded_audio_string...",
  "latency": 1234
}
```

**Response Fields:**
- `success` (boolean): Request success status
- `audioData` (string): Base64 encoded MP3 audio data
- `latency` (number): TTS generation latency in milliseconds

**Status Codes:**
- `200` - Success
- `400` - Bad request (missing text)
- `500` - Server error

**Audio Format:**
- Format: MP3
- Model: OpenAI TTS-1
- Voice: Configurable (default: "alloy")

---

### 2. Transcribe Audio

Convert speech to text using Whisper.

**Endpoint:** `POST /api/audio/transcribe`

**Content-Type:** `multipart/form-data`

**Request Body:**
- `audio` (File, required): Audio file (webm, wav, mp3, ogg)
  - Maximum size: 10MB

**Example (using curl):**
```bash
curl -X POST http://localhost:5000/api/audio/transcribe \
  -F "audio=@recording.webm"
```

**Response:**
```json
{
  "success": true,
  "text": "I think the answer is B, to translate high-level code to machine code",
  "latency": 2345
}
```

**Response Fields:**
- `success` (boolean): Request success status
- `text` (string): Transcribed text
- `latency` (number): Transcription latency in milliseconds

**Status Codes:**
- `200` - Success
- `400` - Bad request (no audio file provided)
- `500` - Server error

**Supported Audio Formats:**
- WebM (webm)
- WAV (wav)
- MP3 (mp3)
- OGG (ogg)

---

### 3. Stream Audio

Get the audio file for a session (legacy endpoint, not currently used).

**Endpoint:** `GET /api/audio/stream/:sessionId`

**Parameters:**
- `sessionId` (path parameter): Session ID

**Response:**
- Content-Type: `audio/mpeg`
- Body: MP3 audio file (binary)

**Status Codes:**
- `200` - Success
- `404` - Audio not found for this session
- `500` - Server error

---

## Health Check

### Health Status

Check if the API is running.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "message": "AI Interview System is running"
}
```

**Status Codes:**
- `200` - Service is running

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid input, missing required fields)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server-side error)

**Development Mode:**
In development mode, error responses may include a `stack` field with error details:
```json
{
  "error": "Error message",
  "stack": "Error stack trace..."
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Limit:** 100 requests per 15 minutes per IP address
- **Headers:** Rate limit information is included in response headers

---

## Request/Response Formats

### Supported Audio Formats

**Input (Voice Recording):**
- WebM (webm) - Recommended for browser recordings
- WAV (wav)
- MP3 (mp3)
- OGG (ogg)

**Output (TTS):**
- MP3 (audio/mpeg)

### File Size Limits

- **Audio Upload:** Maximum 10MB

### Content Types

- **JSON:** `application/json`
- **Multipart Form Data:** `multipart/form-data` (for file uploads)
- **Audio:** `audio/mpeg` (for audio responses)

---

## Latency Tracking

All API responses include latency information where applicable:

1. **LLM Question Generation:** Time taken to generate question from LLM
2. **TTS Question Generation:** Time taken to convert question text to speech
3. **STT User Answer:** Time taken to transcribe user's audio answer
4. **LLM Answer Validation:** Time taken to validate answer using LLM
5. **TTS Answer Validation:** Time taken to convert validation feedback to speech

Latencies are measured in milliseconds and included in response objects.

---

## Example Usage

### Complete Interview Flow

```javascript
// 1. Start interview and get question
const response = await fetch('http://localhost:5000/api/interview/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'computer science',
    previousQuestions: []
  })
});

// Parse streaming response
const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';
  for (const line of lines) {
    if (line.trim()) {
      const data = JSON.parse(line);
      if (data.question) {
        console.log('Question:', data.question);
      }
    }
  }
}

// 2. Generate TTS for question (on-demand)
const ttsResponse = await fetch('http://localhost:5000/api/audio/text-to-speech', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: question.readableText
  })
});
const ttsData = await ttsResponse.json();
const audioData = ttsData.audioData; // Base64 encoded audio

// 3. Transcribe user's audio answer
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
const transcribeResponse = await fetch('http://localhost:5000/api/audio/transcribe', {
  method: 'POST',
  body: formData
});
const transcribeData = await transcribeResponse.json();
const transcribedText = transcribeData.text;

// 4. Validate answer
const validateResponse = await fetch('http://localhost:5000/api/interview/validate-answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: question,
    transcribedText: transcribedText
  })
});
const validateData = await validateResponse.json();
console.log('Is Correct:', validateData.isCorrect);
console.log('Feedback:', validateData.feedback);
```

---

## Environment Variables

**Server-side:**
- `OPENAI_API_KEY` (required): OpenAI API key
- `PORT` (optional): Server port (default: 5000)
- `NODE_ENV` (optional): Environment mode (development/production)
- `FRONTEND_URL` (optional): Allowed CORS origins (comma-separated)

**Client-side:**
- `REACT_APP_API_URL` (optional): Backend API URL (default: http://localhost:5000/api)

---

## Notes

1. **Streaming Responses:** The `/interview/start` endpoint uses streaming to send question text immediately, improving perceived performance.

2. **On-Demand TTS:** TTS is generated on-demand when the user clicks "Read Question" button, not automatically with the question.

3. **Latency Tracking:** All operations track latency for performance monitoring and admin logs.

4. **Duplicate Prevention:** The system tracks previously asked questions to avoid duplicates within a session.

5. **Subject-Based Questions:** Questions are generated based on the selected subject (computer science, history, geography, etc.).

