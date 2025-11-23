# Quick Start Guide

Get up and running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm run install-all
```

## Step 2: Configure Environment

1. Create `.env` file in the root directory:
   ```bash
   # Windows
   copy .env.example .env
   
   # Mac/Linux
   cp .env.example .env
   ```

2. Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

## Step 3: Start the Application

```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000).

## Step 4: Open in Browser

Navigate to: **http://localhost:3000**

## Step 5: Start Interviewing!

1. Click "Start Interview"
2. Allow microphone access
3. Answer 5 MCQ questions
4. View your results!

## That's It! 🎉

For detailed setup, troubleshooting, or customization, see:
- [SETUP.md](SETUP.md) - Detailed setup instructions
- [README.md](README.md) - Full documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [API.md](API.md) - API documentation

## Common First-Time Issues

**"OPENAI_API_KEY is not set"**
→ Make sure you created `.env` file with your API key

**"Microphone access denied"**
→ Allow microphone permissions in your browser settings

**Port already in use**
→ Change PORT in `.env` or kill the process using the port

