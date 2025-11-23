# Postman API Testing Guide

This guide provides step-by-step instructions for testing all API endpoints in Postman.

## Prerequisites

1. **Postman installed** - Download from https://www.postman.com/downloads/
2. **Server running** - Start the backend server:
   ```bash
   cd server
   npm start
   ```
   Server should be running on `http://localhost:5000`

3. **Environment Variables** - Ensure `.env` file has:
   ```
   OPENAI_API_KEY=your_api_key_here
   PORT=5000
   ```

---

## Postman Collection Setup

### Step 1: Create a New Collection

1. Open Postman
2. Click **"New"** → **"Collection"**
3. Name it: **"AI Interview System API"**
4. Click **"Create"**

### Step 2: Create Environment Variables (Optional but Recommended)

1. Click **"Environments"** (left sidebar)
2. Click **"+"** to create new environment
3. Name it: **"Local Development"**
4. Add variables:
   - `base_url` = `http://localhost:5000/api`
   - `session_id` = (leave empty, will be set dynamically)
5. Click **"Save"**
6. Select this environment from the dropdown (top right)

---

## API Endpoints Testing

### 1. Health Check

**Purpose:** Verify server is running

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/health`
- **Headers:** None required
- **Body:** None

**Expected Response:**
```json
{
  "status": "ok",
  "message": "AI Interview System is running"
}
```

**Status Code:** `200 OK`

**Postman Steps:**
1. Create new request in collection
2. Name it: "Health Check"
3. Set method to `GET`
4. Enter URL: `{{base_url}}/health` (if using environment) or `http://localhost:5000/api/health`
5. Click **"Send"**

---

### 2. Start Interview (Generate Question)

**Purpose:** Generate a new MCQ question

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/interview/start`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "subject": "computer science",
    "previousQuestions": []
  }
  ```

**Request Body Options:**
```json
// First question (no previous questions)
{
  "subject": "computer science",
  "previousQuestions": []
}

// Subsequent question (with previous questions)
{
  "subject": "computer science",
  "previousQuestions": [
    { "question": "What is the main function of a compiler?" },
    { "question": "What is the difference between RAM and ROM?" }
  ]
}

// Different subjects
{
  "subject": "history",
  "previousQuestions": []
}

{
  "subject": "geography",
  "previousQuestions": []
}

{
  "subject": "politics",
  "previousQuestions": []
}

{
  "subject": "indian mythology",
  "previousQuestions": []
}

// Custom subject
{
  "subject": "quantum physics",
  "previousQuestions": []
}
```

**Expected Response (Streaming):**
The response is streamed as JSON chunks. You'll see:
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
    "explanation": "A compiler translates high-level programming language code into machine code.",
    "readableText": "What is the main function of a compiler in computer science? Option A: To execute code. Option B: To translate high-level code to machine code. Option C: To debug programs. Option D: To store data."
  },
  "audioData": null,
  "llmRequest": {
    "model": "gpt-4",
    "messages": [...]
  },
  "latencies": {
    "llmQuestion": 2345,
    "tts": 0
  },
  "audioReady": false
}
```

**Status Code:** `200 OK`

**Postman Steps:**
1. Create new request: "Start Interview"
2. Set method to `POST`
3. Enter URL: `{{base_url}}/interview/start`
4. Go to **"Headers"** tab
5. Add header: `Content-Type: application/json`
6. Go to **"Body"** tab
7. Select **"raw"** and **"JSON"** from dropdown
8. Paste the JSON body
9. Click **"Send"**

**Note:** Postman may show the response as a single chunk. In the actual application, this is streamed line by line.

---

### 3. Text to Speech (Generate Question Audio)

**Purpose:** Convert question text to speech audio

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/audio/text-to-speech`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "text": "What is the main function of a compiler in computer science? Option A: To execute code. Option B: To translate high-level code to machine code. Option C: To debug programs. Option D: To store data."
  }
  ```

**Expected Response:**
```json
{
  "success": true,
  "audioData": "base64_encoded_audio_string_here...",
  "latency": 1234
}
```

**Status Code:** `200 OK`

**Postman Steps:**
1. Create new request: "Text to Speech"
2. Set method to `POST`
3. Enter URL: `{{base_url}}/audio/text-to-speech`
4. Add header: `Content-Type: application/json`
5. Body → raw → JSON:
   ```json
   {
     "text": "Hello, this is a test message for text to speech conversion."
   }
   ```
6. Click **"Send"**

**Note:** The `audioData` field contains a very long base64 string. You can copy it and decode it to verify it's valid audio data.

**To Test with Actual Question:**
1. First call "Start Interview" endpoint
2. Copy the `readableText` from the response
3. Use that text in this endpoint

---

### 4. Transcribe Audio (Speech to Text)

**Purpose:** Convert audio recording to text

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/audio/transcribe`
- **Headers:** 
  ```
  Content-Type: multipart/form-data
  ```
  (Postman sets this automatically when using form-data)
- **Body (form-data):**
  - Key: `audio`
  - Type: **File** (select from dropdown)
  - Value: Select an audio file (webm, wav, mp3, ogg)

**Expected Response:**
```json
{
  "success": true,
  "text": "I think the answer is B, to translate high-level code to machine code",
  "latency": 2345
}
```

**Status Code:** `200 OK`

**Postman Steps:**
1. Create new request: "Transcribe Audio"
2. Set method to `POST`
3. Enter URL: `{{base_url}}/audio/transcribe`
4. Go to **"Body"** tab
5. Select **"form-data"**
6. Add key: `audio`
7. Change type from "Text" to **"File"** (dropdown on right)
8. Click **"Select Files"** and choose an audio file
9. Click **"Send"`

**Test Audio File:**
- You can record a short audio file using your phone or computer
- Supported formats: webm, wav, mp3, ogg
- Maximum size: 10MB

**Example Test:**
Record yourself saying: "I think the answer is B" and save as `test-audio.webm`, then upload it.

---

### 5. Validate Answer

**Purpose:** Validate user's transcribed answer using LLM

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/interview/validate-answer`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "question": {
      "question": "What is the main function of a compiler in computer science?",
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

**Expected Response:**
```json
{
  "success": true,
  "isCorrect": 1,
  "feedback": "Excellent! You're absolutely correct. A compiler is indeed a program that translates high-level programming language code into machine code that can be executed by a computer.",
  "audioData": "base64_encoded_audio_string_here...",
  "llmRequest": {
    "model": "gpt-4",
    "messages": [...]
  },
  "latencies": {
    "llmValidation": 1234,
    "tts": 567
  }
}
```

**Status Code:** `200 OK`

**Postman Steps:**
1. Create new request: "Validate Answer"
2. Set method to `POST`
3. Enter URL: `{{base_url}}/interview/validate-answer`
4. Add header: `Content-Type: application/json`
5. Body → raw → JSON:
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
     "transcribedText": "I think the answer is B"
   }
   ```
6. Click **"Send"**

**Test Scenarios:**

**Correct Answer:**
```json
{
  "question": { ... },
  "transcribedText": "The answer is B, to translate high-level code to machine code"
}
```
Expected: `"isCorrect": 1`

**Incorrect Answer:**
```json
{
  "question": { ... },
  "transcribedText": "I think it's A, to execute code"
}
```
Expected: `"isCorrect": 0`

**Partial Answer:**
```json
{
  "question": { ... },
  "transcribedText": "Option B"
}
```
Expected: LLM will evaluate and provide feedback

---

## Complete Testing Workflow

### Workflow 1: Full Interview Flow

1. **Health Check**
   - Verify server is running

2. **Start Interview (Question 1)**
   ```json
   {
     "subject": "computer science",
     "previousQuestions": []
   }
   ```
   - Save the `question` object from response

3. **Generate TTS for Question**
   - Use `readableText` from step 2
   ```json
   {
     "text": "<readableText from step 2>"
   }
   ```

4. **Transcribe Answer** (Optional - if you have audio file)
   - Upload audio file with user's answer

5. **Validate Answer**
   - Use `question` from step 2
   - Use transcribed text or manual text
   ```json
   {
     "question": { /* from step 2 */ },
     "transcribedText": "I think the answer is B"
   }
   ```

6. **Start Interview (Question 2)**
   ```json
   {
     "subject": "computer science",
     "previousQuestions": [
       { "question": "<question text from step 2>" }
     ]
   }
   ```
   - Repeat steps 3-5

### Workflow 2: Test Different Subjects

Test each subject type:

1. **Computer Science**
   ```json
   { "subject": "computer science", "previousQuestions": [] }
   ```

2. **History**
   ```json
   { "subject": "history", "previousQuestions": [] }
   ```

3. **Geography**
   ```json
   { "subject": "geography", "previousQuestions": [] }
   ```

4. **Politics**
   ```json
   { "subject": "politics", "previousQuestions": [] }
   ```

5. **Indian Mythology**
   ```json
   { "subject": "indian mythology", "previousQuestions": [] }
   ```

6. **Custom Subject**
   ```json
   { "subject": "quantum physics", "previousQuestions": [] }
   ```

---

## Error Testing

### Test 1: Missing Required Fields

**Validate Answer - Missing Question:**
```json
{
  "transcribedText": "I think the answer is B"
}
```
Expected: `400 Bad Request` with error message

**Validate Answer - Missing Transcribed Text:**
```json
{
  "question": { ... }
}
```
Expected: `400 Bad Request` with error message

### Test 2: Invalid Audio File

**Transcribe Audio - No File:**
- Send request without file
Expected: `400 Bad Request` - "No audio file provided"

**Transcribe Audio - Invalid Format:**
- Upload a text file or image
Expected: Error from OpenAI Whisper API

### Test 3: Empty Text

**Text to Speech - Empty Text:**
```json
{
  "text": ""
}
```
Expected: `400 Bad Request` - "Text is required"

---

## Postman Collection JSON

You can import this collection directly into Postman:

```json
{
  "info": {
    "name": "AI Interview System API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{base_url}}/health",
          "host": ["{{base_url}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Start Interview",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"subject\": \"computer science\",\n  \"previousQuestions\": []\n}"
        },
        "url": {
          "raw": "{{base_url}}/interview/start",
          "host": ["{{base_url}}"],
          "path": ["interview", "start"]
        }
      }
    },
    {
      "name": "Text to Speech",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"text\": \"Hello, this is a test message for text to speech conversion.\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/audio/text-to-speech",
          "host": ["{{base_url}}"],
          "path": ["audio", "text-to-speech"]
        }
      }
    },
    {
      "name": "Transcribe Audio",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "audio",
              "type": "file",
              "src": []
            }
          ]
        },
        "url": {
          "raw": "{{base_url}}/audio/transcribe",
          "host": ["{{base_url}}"],
          "path": ["audio", "transcribe"]
        }
      }
    },
    {
      "name": "Validate Answer",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"question\": {\n    \"question\": \"What is the main function of a compiler?\",\n    \"options\": {\n      \"A\": \"To execute code\",\n      \"B\": \"To translate high-level code to machine code\",\n      \"C\": \"To debug programs\",\n      \"D\": \"To store data\"\n    },\n    \"correctAnswer\": \"B\"\n  },\n  \"transcribedText\": \"I think the answer is B\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/interview/validate-answer",
          "host": ["{{base_url}}"],
          "path": ["interview", "validate-answer"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    }
  ]
}
```

**To Import:**
1. Copy the JSON above
2. In Postman, click **"Import"**
3. Select **"Raw text"**
4. Paste the JSON
5. Click **"Import"**

---

## Tips for Testing

1. **Save Responses:** Use Postman's "Save Response" feature to save example responses for reference

2. **Use Variables:** Create variables for:
   - `question_object` - Save question from "Start Interview"
   - `transcribed_text` - Save transcribed text
   - `base64_audio` - Save audio data if needed

3. **Test Scripts:** Add test scripts in Postman to:
   - Verify response status codes
   - Check response structure
   - Save variables automatically

4. **Collection Runner:** Use Collection Runner to test the complete flow automatically

5. **Environment Switching:** Create different environments for:
   - Local development
   - Staging
   - Production

---

## Common Issues

### Issue 1: CORS Error
**Solution:** Ensure server CORS is configured correctly. Check `server/index.js`

### Issue 2: 500 Internal Server Error
**Solution:** 
- Check server console for error logs
- Verify OpenAI API key is set in `.env`
- Check network connectivity

### Issue 3: Audio File Too Large
**Solution:** Ensure audio file is under 10MB

### Issue 4: Streaming Response Not Showing
**Solution:** This is normal in Postman. The actual application handles streaming differently.

---

## Next Steps

After testing all endpoints:
1. Verify all responses match expected format
2. Test error scenarios
3. Test with different subjects
4. Test duplicate question prevention
5. Verify latency tracking is working

Happy Testing! 🚀

