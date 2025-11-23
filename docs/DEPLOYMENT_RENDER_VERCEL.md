# Deployment Guide: Render (Backend) + Vercel (Frontend)

Complete guide to deploy the AI Interview System with backend on Render and frontend on Vercel.

---

## Overview

- **Backend:** Render (Web Service)
- **Frontend:** Vercel (Static Site)
- **Cost:** Free tier available for both platforms
- **Time:** ~30 minutes

---

## Part 1: Backend Deployment on Render

### Step 1: Prepare Your Repository

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/ai-interview.git
   git push -u origin main
   ```

2. **Create `.env.example` in server folder:**
   ```bash
   cd server
   nano .env.example
   ```
   
   Add:
   ```env
   NODE_ENV=production
   PORT=5000
   OPENAI_API_KEY=your_openai_api_key_here
   FRONTEND_URL=https://your-app.vercel.app
   ```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### Step 3: Create Web Service on Render

1. **Click "New +" → "Web Service"**

2. **Connect Repository:**
   - Select your GitHub repository
   - Click "Connect"

3. **Configure Service:**
   - **Name:** `ai-interview-api` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `server` (important!)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
   - **Instance Type:** Free (or paid for better performance)

4. **Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   Add these variables:
   ```
   NODE_ENV = production
   PORT = 5000 (or leave default, Render sets this automatically)
   OPENAI_API_KEY = your_actual_openai_api_key
   FRONTEND_URL = https://your-app.vercel.app (update after frontend deploy)
   ```

5. **Click "Create Web Service"**

6. **Wait for Deployment:**
   - Render will build and deploy your service
   - This takes 5-10 minutes
   - You'll see build logs in real-time

### Step 4: Get Backend URL

1. Once deployed, Render provides a URL like:
   ```
   https://ai-interview-api.onrender.com
   ```

2. **Note this URL** - you'll need it for frontend configuration

3. **Test Backend:**
   ```bash
   curl https://ai-interview-api.onrender.com/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "AI Interview System is running"
   }
   ```

### Step 5: Update CORS (After Frontend Deploy)

After deploying frontend, update `FRONTEND_URL` in Render:
1. Go to your Render service
2. Click "Environment"
3. Update `FRONTEND_URL` to your Vercel URL
4. Click "Save Changes"
5. Service will automatically redeploy

---

## Part 2: Frontend Deployment on Vercel

### Step 1: Prepare Frontend

1. **Create `.env.production` in client folder:**
   ```bash
   cd client
   nano .env.production
   ```
   
   Add:
   ```env
   REACT_APP_API_URL=https://ai-interview-api.onrender.com/api
   ```
   
   **Note:** Replace with your actual Render backend URL

2. **Update `package.json` build script** (if needed):
   ```json
   {
     "scripts": {
       "build": "react-scripts build"
     }
   }
   ```

3. **Commit changes:**
   ```bash
   git add .
   git commit -m "Add production environment variables"
   git push
   ```

### Step 2: Create Vercel Account

1. Go to https://vercel.com
2. Sign up with GitHub (recommended)
3. Connect your GitHub account

### Step 3: Import Project

1. **Click "Add New..." → "Project"**

2. **Import Git Repository:**
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   - **Project Name:** `ai-interview` (or your preferred name)
   - **Framework Preset:** `Create React App` (auto-detected)
   - **Root Directory:** `client` (important!)
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** `build` (auto-filled)
   - **Install Command:** `npm install` (auto-filled)

4. **Environment Variables:**
   Click "Environment Variables" and add:
   ```
   REACT_APP_API_URL = https://ai-interview-api.onrender.com/api
   ```
   **Note:** Replace with your actual Render backend URL

5. **Click "Deploy"**

6. **Wait for Deployment:**
   - Vercel will build and deploy
   - Takes 2-5 minutes
   - You'll see build logs

### Step 4: Get Frontend URL

1. Once deployed, Vercel provides a URL like:
   ```
   https://ai-interview.vercel.app
   ```

2. **Note this URL**

3. **Test Frontend:**
   - Open the URL in browser
   - Should see login screen

### Step 5: Update Backend CORS

1. Go back to Render dashboard
2. Navigate to your backend service
3. Go to "Environment" tab
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL = https://ai-interview.vercel.app
   ```
   (Or add both URLs separated by comma)
5. Click "Save Changes"
6. Render will automatically redeploy

---

## Part 3: Custom Domain (Optional)

### Vercel Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Add your domain (e.g., `yourdomain.com`)
   - Follow DNS configuration instructions

2. **Update Environment Variables:**
   - Update `REACT_APP_API_URL` in Vercel
   - Update `FRONTEND_URL` in Render

### Render Custom Domain

1. **In Render Dashboard:**
   - Go to your service
   - Click "Settings" → "Custom Domains"
   - Add your domain
   - Follow DNS configuration instructions

---

## Part 4: Configuration Summary

### Render (Backend) Environment Variables

```
NODE_ENV = production
PORT = 5000 (or auto-set by Render)
OPENAI_API_KEY = sk-...
FRONTEND_URL = https://ai-interview.vercel.app
```

### Vercel (Frontend) Environment Variables

```
REACT_APP_API_URL = https://ai-interview-api.onrender.com/api
```

---

## Part 5: Testing Deployment

### Test Backend

```bash
# Health check
curl https://ai-interview-api.onrender.com/api/health

# Test question generation
curl -X POST https://ai-interview-api.onrender.com/api/interview/start \
  -H "Content-Type: application/json" \
  -d '{"subject":"computer science","previousQuestions":[]}'
```

### Test Frontend

1. Open your Vercel URL in browser
2. Try logging in
3. Test question generation
4. Test audio recording
5. Test answer validation

---

## Part 6: Important Notes

### Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- **First request after spin-down takes 30-60 seconds** (cold start)
- **512MB RAM limit**
- **Upgrade to paid plan for:**
  - Always-on service (no spin-down)
  - More RAM
  - Better performance

### Vercel Free Tier

- **Unlimited bandwidth**
- **Automatic HTTPS**
- **Global CDN**
- **Automatic deployments on git push**

### Cold Start Issue (Render Free Tier)

**Problem:** First request after 15 minutes of inactivity is slow

**Solutions:**
1. **Upgrade to paid plan** ($7/month) - Always-on service
2. **Use uptime monitoring** (UptimeRobot, etc.) to ping every 10 minutes
3. **Accept the delay** - Only affects first request

### Update Deployment

**Backend (Render):**
- Push to GitHub → Auto-deploys
- Or manually trigger from Render dashboard

**Frontend (Vercel):**
- Push to GitHub → Auto-deploys
- Or manually trigger from Vercel dashboard

---

## Part 7: Troubleshooting

### Backend Issues

**Problem: Build fails**
- Check build logs in Render
- Verify `Root Directory` is set to `server`
- Check `package.json` has correct scripts

**Problem: Service crashes**
- Check logs in Render dashboard
- Verify environment variables are set
- Check OpenAI API key is valid

**Problem: CORS errors**
- Verify `FRONTEND_URL` in Render matches Vercel URL
- Check frontend is using correct API URL

### Frontend Issues

**Problem: Build fails**
- Check build logs in Vercel
- Verify `Root Directory` is set to `client`
- Check environment variables are set

**Problem: API calls fail**
- Verify `REACT_APP_API_URL` is correct
- Check backend is running (Render dashboard)
- Check browser console for errors

**Problem: Blank page**
- Check browser console for errors
- Verify build completed successfully
- Check environment variables

---

## Part 8: File Structure for Deployment

Ensure your repository structure is:

```
ai-interview/
├── server/              # Backend (Render)
│   ├── index.js
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── package.json
│   └── .env.example
│
├── client/             # Frontend (Vercel)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.production
│
└── README.md
```

---

## Part 9: Quick Deployment Checklist

### Backend (Render)
- [ ] GitHub repository pushed
- [ ] Render account created
- [ ] Web Service created
- [ ] Root Directory set to `server`
- [ ] Environment variables configured
- [ ] Build command: `npm install`
- [ ] Start command: `node index.js`
- [ ] Service deployed successfully
- [ ] Health check endpoint working
- [ ] Backend URL noted

### Frontend (Vercel)
- [ ] Vercel account created
- [ ] Project imported from GitHub
- [ ] Root Directory set to `client`
- [ ] Environment variables configured
- [ ] Build settings correct
- [ ] Frontend deployed successfully
- [ ] Frontend URL noted
- [ ] Can access login page

### Configuration
- [ ] Backend `FRONTEND_URL` updated with Vercel URL
- [ ] Frontend `REACT_APP_API_URL` updated with Render URL
- [ ] Both services redeployed after URL updates
- [ ] Full flow tested (login → question → answer → validation)

---

## Part 10: Cost Estimation

### Free Tier (Both Platforms)

**Render:**
- Free tier available
- Spins down after 15 min inactivity
- 512MB RAM

**Vercel:**
- Free tier available
- Unlimited bandwidth
- Global CDN

**Total:** $0/month

### Paid Tier (Recommended for Production)

**Render:**
- Starter: $7/month
- Always-on service
- 512MB RAM
- Better performance

**Vercel:**
- Pro: $20/month (if needed)
- Usually free tier is sufficient

**Total:** $7-27/month

---

## Part 11: Monitoring

### Render Monitoring

1. **Dashboard:**
   - View service status
   - Check logs
   - Monitor metrics

2. **Logs:**
   - Real-time logs
   - Error tracking
   - Request logs

### Vercel Monitoring

1. **Dashboard:**
   - View deployments
   - Check analytics
   - Monitor performance

2. **Analytics:**
   - Page views
   - Performance metrics
   - Error tracking

---

## Part 12: Continuous Deployment

### Automatic Deployments

**Both platforms auto-deploy on git push:**

1. **Make changes locally**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **Render and Vercel automatically:**
   - Detect changes
   - Build and deploy
   - Update live site

### Manual Deployment

**Render:**
- Dashboard → Service → "Manual Deploy"

**Vercel:**
- Dashboard → Project → "Redeploy"

---

## Part 13: Environment Variables Reference

### Render (Backend) - Required

```env
NODE_ENV=production
OPENAI_API_KEY=sk-your-key-here
FRONTEND_URL=https://your-app.vercel.app
```

### Vercel (Frontend) - Required

```env
REACT_APP_API_URL=https://your-api.onrender.com/api
```

---

## Part 14: Quick Commands Reference

### Local Testing Before Deploy

```bash
# Test backend locally
cd server
npm install
node index.js

# Test frontend locally
cd client
npm install
npm run build
npm install -g serve
serve -s build
```

### Git Commands

```bash
# Initial setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/repo.git
git push -u origin main

# Update deployment
git add .
git commit -m "Update description"
git push
```

---

## Support & Resources

### Render
- Documentation: https://render.com/docs
- Support: support@render.com
- Status: https://status.render.com

### Vercel
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support
- Status: https://www.vercel-status.com

---

## Next Steps After Deployment

1. **Test Complete Flow:**
   - Login
   - Question generation
   - Audio recording
   - Answer validation
   - Report generation

2. **Monitor Performance:**
   - Check Render logs
   - Check Vercel analytics
   - Monitor API response times

3. **Setup Custom Domain** (optional)

4. **Configure Uptime Monitoring** (for Render free tier)

5. **Setup Error Tracking** (Sentry, etc.)

6. **Configure Analytics** (Google Analytics, etc.)

---

Your application is now live and accessible from anywhere! 🚀

**Backend URL:** `https://your-api.onrender.com`  
**Frontend URL:** `https://your-app.vercel.app`

