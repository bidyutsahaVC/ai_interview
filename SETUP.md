# Setup Guide

## Quick Start

### 1. Prerequisites Check

Ensure you have:
- **Node.js** v18 or higher installed (v18+ recommended for File API support)
- **npm** or **yarn** package manager
- **OpenAI API Key** (get one from https://platform.openai.com/api-keys)

Verify installation:
```bash
node --version
npm --version
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

Or use the convenience script:
```bash
npm run install-all
```

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=sk-your-actual-api-key-here
   PORT=5000
   NODE_ENV=development
   ```

### 4. Start the Application

**Option A: Run both server and client together (Recommended)**
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

**Option B: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

### 5. Access the Application

1. Open your browser and navigate to: `http://localhost:3000`
2. Allow microphone access when prompted by your browser
3. Click "Start Interview" to begin

## Troubleshooting

### Common Issues

#### 1. "OPENAI_API_KEY is not set"
- **Solution**: Make sure you've created `.env` file and added your API key
- Verify the key starts with `sk-`

#### 2. "Microphone access denied"
- **Solution**: 
  - Check browser permissions (Chrome: Settings > Privacy > Site Settings > Microphone)
  - Ensure you're using HTTPS or localhost (required for microphone access)
  - Try a different browser

#### 3. "Port already in use"
- **Solution**: 
  - Change PORT in `.env` file
  - Or kill the process using the port:
    ```bash
    # Windows
    netstat -ano | findstr :5000
    taskkill /PID <PID> /F
    
    # Mac/Linux
    lsof -ti:5000 | xargs kill
    ```

#### 4. "Module not found" errors
- **Solution**: 
  ```bash
  # Delete node_modules and reinstall
  rm -rf node_modules client/node_modules
  npm run install-all
  ```

#### 5. Audio not playing
- **Solution**:
  - Check browser console for errors
  - Verify CORS settings if using different ports
  - Ensure audio codec is supported (MP3 should work in all browsers)

#### 6. OpenAI API errors
- **Solution**:
  - Verify your API key is valid
  - Check your OpenAI account has credits/quota
  - Verify you have access to GPT-4, Whisper, and TTS models

### Browser Compatibility

**Recommended Browsers:**
- Chrome 90+ (Best support)
- Firefox 88+
- Edge 90+
- Safari 14+

**Required Features:**
- MediaRecorder API (for voice recording)
- Web Audio API (for audio visualization)
- File API (for audio upload)

### Development Tools

**Recommended VS Code Extensions:**
- ESLint
- Prettier
- JavaScript/TypeScript extensions

**Debugging:**
- Backend: Use `console.log` or Node.js debugger
- Frontend: Use React DevTools and browser DevTools

## Production Setup

### 1. Build Frontend

```bash
cd client
npm run build
cd ..
```

### 2. Environment Variables

Set production environment variables:
```env
NODE_ENV=production
PORT=5000
OPENAI_API_KEY=your_production_key
```

### 3. Start Server

```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start server/index.js --name ai-interview

# Or using node directly
NODE_ENV=production node server/index.js
```

### 4. Serve Static Files

Configure your web server (nginx, Apache) to:
- Serve static files from `client/build`
- Proxy API requests to `http://localhost:5000`

**Example nginx config:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/client/build;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Additional Configuration

### Customizing Question Count

Edit `server/services/interviewService.js`:
```javascript
const questions = await generateQuestions(5); // Change 5 to desired number
```

### Changing TTS Voice

Edit `server/services/openaiService.js`:
```javascript
voice: 'alloy', // Options: alloy, echo, fable, onyx, nova, shimmer
```

### Adjusting Rate Limits

Edit `server/index.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window
  max: 100 // Max requests per window
});
```

## Next Steps

- Read [README.md](README.md) for feature overview
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Review code comments for implementation details

