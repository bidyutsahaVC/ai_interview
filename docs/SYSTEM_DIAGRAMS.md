# System Diagrams

## Complete System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[LoginScreen] --> B[App Component]
        B --> C[API Service]
        B --> D[Audio Player]
        B --> E[MediaRecorder]
    end
    
    subgraph "Server Layer"
        F[Express Server] --> G[Interview Routes]
        F --> H[Audio Routes]
        G --> I[Interview Controller]
        H --> J[Audio Controller]
        I --> K[Interview Service]
        I --> L[LLM Service]
        J --> M[TTS Service]
        J --> N[Whisper Service]
    end
    
    subgraph "External Services"
        O[OpenAI GPT-4]
        P[OpenAI TTS]
        Q[OpenAI Whisper]
    end
    
    C -->|HTTP| F
    D -->|Play Audio| E
    E -->|Record| C
    L -->|API| O
    M -->|API| P
    N -->|API| Q
    
    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style F fill:#fff4e1
    style O fill:#ffe1f5
    style P fill:#ffe1f5
    style Q fill:#ffe1f5
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Server
    participant O as OpenAI

    U->>F: Login
    F->>F: Validate Credentials
    F->>S: POST /interview/start
    S->>O: Generate Question (GPT-4)
    O-->>S: Question JSON
    S-->>F: Stream Question Text
    F->>F: Display Question
    F->>S: POST /audio/text-to-speech
    S->>O: Generate TTS
    O-->>S: Audio Buffer
    S-->>F: Base64 Audio
    F->>F: Play Audio
    U->>F: Start Recording
    F->>F: Record Audio
    U->>F: Stop Recording
    F->>S: POST /audio/transcribe
    S->>O: Transcribe (Whisper)
    O-->>S: Transcribed Text
    S-->>F: Text + Latency
    F->>F: Display Text
    F->>S: POST /interview/validate-answer
    S->>O: Validate (GPT-4)
    O-->>S: Validation Result
    S->>O: Generate Feedback TTS
    O-->>S: Feedback Audio
    S-->>F: Validation + Audio
    F->>F: Display Feedback
    F->>F: Play Feedback Audio
    U->>F: Next Question
    F->>S: POST /interview/start (with previous)
```

## Component Interaction Diagram

```mermaid
graph LR
    subgraph "App.js"
        A1[State Management]
        A2[Event Handlers]
        A3[useEffect Hooks]
    end
    
    subgraph "API Service"
        B1[startInterview]
        B2[transcribeAudio]
        B3[validateAnswer]
        B4[textToSpeech]
    end
    
    subgraph "Backend Controllers"
        C1[interviewController]
        C2[audioController]
    end
    
    subgraph "Backend Services"
        D1[llmService]
        D2[ttsService]
        D3[whisperService]
        D4[interviewService]
    end
    
    A1 --> A2
    A2 --> B1
    A2 --> B2
    A2 --> B3
    A2 --> B4
    B1 --> C1
    B2 --> C2
    B3 --> C1
    B4 --> C2
    C1 --> D1
    C1 --> D4
    C2 --> D2
    C2 --> D3
    A3 --> A1
```

## Interview Flow Diagram

```mermaid
flowchart TD
    Start([User Opens App]) --> Login[Login Screen]
    Login -->|Enter Credentials| Validate{Password Valid?}
    Validate -->|No| Login
    Validate -->|Yes| Init[Initialize Interview]
    Init --> LoadQ[Load Question]
    LoadQ --> GenQ[Generate Question via LLM]
    GenQ --> ShowQ[Display Question Text]
    ShowQ --> GenTTS[Generate TTS]
    GenTTS --> PlayQ[Play Question Audio]
    PlayQ --> Wait[Wait for User]
    Wait -->|User Clicks Record| Record[Start Recording]
    Record -->|User Stops| Stop[Stop Recording]
    Stop --> Transcribe[Transcribe Audio]
    Transcribe --> ValidateA[Validate Answer]
    ValidateA --> ShowFB[Show Feedback]
    ShowFB --> Check{More Questions?}
    Check -->|Yes| LoadQ
    Check -->|No| Report[Generate Report]
    Report --> End([End])
```

## State Machine - Complete Flow

```mermaid
stateDiagram-v2
    [*] --> Login
    Login --> Authenticated: Valid Credentials
    Login --> Login: Invalid Credentials
    
    Authenticated --> LoadingQuestion: Start Interview
    LoadingQuestion --> QuestionReady: Question Received
    QuestionReady --> GeneratingTTS: Request TTS
    GeneratingTTS --> AudioReady: TTS Complete
    AudioReady --> AudioPlaying: Auto-play
    AudioPlaying --> Recording: User Records
    AudioPlaying --> AudioStopped: Audio Ends
    AudioStopped --> Recording: User Records
    
    Recording --> Transcribing: Stop Recording
    Transcribing --> Validating: Transcription Done
    Validating --> Complete: Validation Done
    
    Complete --> LoadingQuestion: Next Question
    Complete --> GeneratingReport: All Done
    GeneratingReport --> Report: Report Ready
    Report --> [*]
```

## Audio Processing Pipeline

```mermaid
graph TD
    A[User Speaks] --> B[MediaRecorder]
    B --> C[Audio Chunks]
    C --> D[Create Blob]
    D --> E[FormData]
    E --> F[POST /audio/transcribe]
    F --> G[Whisper API]
    G --> H[Transcribed Text]
    H --> I[Display Text]
    I --> J[POST /interview/validate-answer]
    J --> K[GPT-4 API]
    K --> L[Validation Result]
    L --> M[Generate Feedback TTS]
    M --> N[TTS API]
    N --> O[Feedback Audio]
    O --> P[Play Audio]
```

## Question Generation Pipeline

```mermaid
graph LR
    A[User Login] --> B[Select Subject]
    B --> C[POST /interview/start]
    C --> D[Get Previous Questions]
    D --> E[Build Prompt]
    E --> F[GPT-4 API]
    F --> G[Parse Response]
    G --> H[Stream Question]
    H --> I[Display Question]
    I --> J[Request TTS]
    J --> K[TTS API]
    K --> L[Play Audio]
```

## Latency Tracking Flow

```mermaid
graph TD
    A[Operation Starts] --> B[Record Start Time]
    B --> C[Execute Operation]
    C --> D[Record End Time]
    D --> E[Calculate Latency]
    E --> F[Store in State]
    F --> G[Display in Admin Log]
    F --> H[Include in Report]
    
    subgraph "Operations Tracked"
        I[LLM Question Gen]
        J[TTS Question Gen]
        K[STT User Answer]
        L[LLM Validation]
        M[TTS Validation]
    end
```

## Error Handling Flow

```mermaid
graph TD
    A[Operation] --> B{Success?}
    B -->|Yes| C[Continue Flow]
    B -->|No| D[Capture Error]
    D --> E{Error Type?}
    E -->|Network| F[Show Network Error]
    E -->|API| G[Show API Error]
    E -->|Audio| H[Show Audio Error]
    E -->|LLM| I[Show LLM Error]
    F --> J[Allow Retry]
    G --> J
    H --> J
    I --> J
    J --> K{User Retries?}
    K -->|Yes| A
    K -->|No| L[Show Error Message]
```

## File Structure Diagram

```
AI-interview/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── LoginScreen.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── data/
│   │   │   └── mockupData.js
│   │   ├── App.js
│   │   └── App.css
│   └── public/
│
├── server/
│   ├── controllers/
│   │   ├── interviewController.js
│   │   └── audioController.js
│   ├── services/
│   │   ├── llmService.js
│   │   ├── ttsService.js
│   │   ├── whisperService.js
│   │   ├── interviewService.js
│   │   ├── prompts.js
│   │   └── openaiService.js
│   ├── routes/
│   │   ├── interview.js
│   │   └── audio.js
│   ├── middleware/
│   │   └── upload.js
│   └── index.js
│
└── docs/
    ├── API_DOCUMENTATION.md
    ├── WORKFLOW_DOCUMENTATION.md
    ├── STATE_TRANSITION_DIAGRAMS.md
    ├── ARCHITECTURE.md
    └── SYSTEM_DIAGRAMS.md
```

## Technology Stack Diagram

```mermaid
graph TB
    subgraph "Frontend"
        A[React]
        B[JavaScript ES6+]
        C[HTML5 Audio API]
        D[MediaRecorder API]
        E[Axios/Fetch]
        F[jsPDF]
    end
    
    subgraph "Backend"
        G[Node.js]
        H[Express.js]
        I[Multer]
        J[express-rate-limit]
        K[CORS]
    end
    
    subgraph "External APIs"
        L[OpenAI GPT-4]
        M[OpenAI TTS]
        N[OpenAI Whisper]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    G --> H
    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
    H --> N
    E --> H
```

## Request/Response Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant API as API Service
    participant S as Server
    participant O as OpenAI

    Note over C,O: Question Generation
    C->>API: startInterview(subject, previous)
    API->>S: POST /interview/start
    S->>O: GPT-4: Generate Question
    O-->>S: Question JSON
    S-->>API: Stream Question Text
    API-->>C: Question Data
    
    Note over C,O: TTS Generation
    C->>API: textToSpeech(text)
    API->>S: POST /audio/text-to-speech
    S->>O: TTS API
    O-->>S: Audio Buffer
    S-->>API: Base64 Audio
    API-->>C: Audio Data
    
    Note over C,O: Answer Processing
    C->>API: transcribeAudio(blob)
    API->>S: POST /audio/transcribe
    S->>O: Whisper API
    O-->>S: Transcribed Text
    S-->>API: Text + Latency
    API-->>C: Transcribed Text
    
    Note over C,O: Answer Validation
    C->>API: validateAnswer(question, text)
    API->>S: POST /interview/validate-answer
    S->>O: GPT-4: Validate
    O-->>S: Validation Result
    S->>O: TTS: Feedback
    O-->>S: Feedback Audio
    S-->>API: Result + Audio
    API-->>C: Validation Data
```

