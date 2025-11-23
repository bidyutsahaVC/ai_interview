# AI Interview System

A comprehensive AI-powered interview system that conducts voice-based general knowledge tests with Indian context. The system uses OpenAI's Whisper for speech-to-text, GPT for question generation and conversational responses, and TTS for audio feedback.

## 🚀 Features

- **Voice Interaction**: Record and process voice input using browser microphone
- **AI-Powered Questions**: Automatically generates 5 MCQ questions on general knowledge with Indian context
- **Real-time Audio Visualization**: Audio equalizer display when AI is speaking
- **Comprehensive Test Report**: Detailed results with score, answer justifications, and performance metrics
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modular Architecture**: Clean, well-documented, and easy to upgrade

## 📋 Prerequisites

- Node.js (v18 or higher recommended for File API support)
- npm or yarn
- OpenAI API key

> **Quick Start?** See [QUICK_START.md](QUICK_START.md) for a 5-minute setup guide!

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd AI-interview
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   NODE_ENV=development
   ```

## 🎯 Usage

1. **Start the development server**
   ```bash
   npm run dev
   ```
   
   This will start both the backend server (port 5000) and frontend React app (port 3000).

2. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Allow microphone access when prompted
   - Click "Start Interview" to begin

3. **Interview Flow**
   - The system will generate 5 MCQ questions
   - Record your voice response or select an answer
   - View the AI's audio response with visualization
   - Submit answers and proceed through all questions
   - View detailed test report with score and justifications

## 📁 Project Structure

```
AI-interview/
├── server/                 # Backend server
│   ├── controllers/       # Request handlers
│   │   ├── interviewController.js
│   │   └── audioController.js
│   ├── services/          # Business logic
│   │   ├── openaiService.js    # OpenAI API integration
│   │   ├── interviewService.js # Interview management
│   │   └── audioService.js     # Audio handling
│   ├── routes/            # API routes
│   │   ├── interview.js
│   │   └── audio.js
│   ├── middleware/        # Express middleware
│   │   └── upload.js
│   └── index.js           # Server entry point
├── client/                # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── WelcomeScreen.js
│   │   │   ├── InterviewScreen.js
│   │   │   ├── ResultsScreen.js
│   │   │   ├── VoiceRecorder.js
│   │   │   └── AudioVisualizer.js
│   │   ├── services/      # API service
│   │   │   └── api.js
│   │   ├── App.js         # Main app component
│   │   └── index.js       # React entry point
│   └── public/
├── .env.example           # Environment variables template
├── .gitignore
├── package.json           # Backend dependencies
└── README.md
```

## 🔧 API Endpoints

### Interview Endpoints

- `POST /api/interview/start` - Start a new interview session
- `POST /api/interview/process-voice` - Process voice input (multipart/form-data)
- `POST /api/interview/submit-answer` - Submit answer for current question
- `GET /api/interview/status/:sessionId` - Get current interview status
- `POST /api/interview/end` - End interview and get results

### Audio Endpoints

- `POST /api/audio/text-to-speech` - Convert text to speech
- `GET /api/audio/stream/:sessionId` - Stream audio for a session

## 🎨 Key Components

### Backend Services

1. **openaiService.js**: Handles all OpenAI API interactions
   - Whisper transcription
   - GPT question generation and responses
   - Text-to-speech conversion

2. **interviewService.js**: Manages interview sessions
   - Session creation and management
   - Question tracking
   - Answer validation and scoring

3. **audioService.js**: Audio storage and streaming

### Frontend Components

1. **WelcomeScreen**: Initial screen to start interview
2. **InterviewScreen**: Main interview interface with questions and voice recording
3. **ResultsScreen**: Test report with detailed results
4. **VoiceRecorder**: Handles microphone recording
5. **AudioVisualizer**: Real-time audio equalizer visualization

## 🔐 Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)

## 📝 Configuration

### OpenAI Models Used

- **Whisper-1**: Speech-to-text transcription
- **GPT-4**: Question generation and conversational responses
- **TTS-1**: Text-to-speech conversion

### Customization

You can customize:
- Number of questions (default: 5) in `interviewService.js`
- TTS voice in `openaiService.js` (options: alloy, echo, fable, onyx, nova, shimmer)
- Question topics and difficulty in the GPT prompt

## 🚀 Production Deployment

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   PORT=5000
   OPENAI_API_KEY=your_key
   ```

3. **Use a process manager** (PM2, etc.)
   ```bash
   pm2 start server/index.js
   ```

4. **Configure reverse proxy** (nginx, etc.) for serving static files and API

## 🐛 Troubleshooting

- **Microphone not working**: Check browser permissions and HTTPS requirement
- **API errors**: Verify OpenAI API key and quota
- **CORS issues**: Ensure backend CORS is configured correctly
- **Audio playback issues**: Check browser audio codec support

## 📚 Documentation

### Documentation Files

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[SETUP.md](SETUP.md)** - Detailed setup and configuration guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design
- **[API.md](API.md)** - Complete API documentation

### Code Documentation

Each file contains detailed JSDoc comments explaining:
- Purpose and functionality
- Parameters and return values
- Usage examples

## 🔄 Upgrading

The modular architecture makes it easy to:
- Add new question types
- Integrate additional AI models
- Extend audio processing
- Add new features

## 📄 License

MIT License

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing patterns
- Documentation is updated
- Tests are added for new features

## 📞 Support

For issues or questions, please check the documentation or create an issue in the repository.

