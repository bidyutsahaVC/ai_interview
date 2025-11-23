# Deployment Guide

Complete guide to deploy the AI Interview System to a server for public access.

---

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Server Setup](#server-setup)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Domain & SSL Setup](#domain--ssl-setup)
8. [Process Management](#process-management)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Deployment Options

### Option 1: VPS (Virtual Private Server) - Recommended
- **Providers:** DigitalOcean, AWS EC2, Linode, Vultr, Hetzner
- **Cost:** $5-20/month
- **Pros:** Full control, scalable, cost-effective
- **Cons:** Requires server management

### Option 2: Platform as a Service (PaaS)
- **Providers:** Heroku, Railway, Render, Fly.io
- **Cost:** Free tier available, $5-25/month for production
- **Pros:** Easy deployment, managed services
- **Cons:** Less control, potential vendor lock-in

### Option 3: Cloud Platforms
- **AWS:** EC2, Elastic Beanstalk, Amplify
- **Google Cloud:** App Engine, Cloud Run
- **Azure:** App Service
- **Pros:** Enterprise-grade, scalable
- **Cons:** More complex, higher cost

**This guide focuses on VPS deployment (most common and flexible).**

---

## Prerequisites

1. **Server Requirements:**
   - Ubuntu 20.04/22.04 LTS (recommended)
   - 1GB RAM minimum (2GB+ recommended)
   - 20GB storage
   - Node.js 18+ installed
   - Nginx (for reverse proxy)
   - PM2 (for process management)

2. **Domain Name (Optional but Recommended):**
   - Purchase from Namecheap, GoDaddy, etc.
   - Point DNS to your server IP

3. **SSH Access:**
   - SSH key pair for secure access

---

## Server Setup

### Step 1: Connect to Your Server

```bash
ssh root@your_server_ip
# or
ssh username@your_server_ip
```

### Step 2: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 3: Install Node.js

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 6: Install Git (if not installed)

```bash
sudo apt install git -y
```

---

## Backend Deployment

### Step 1: Clone Your Repository

```bash
# Create app directory
sudo mkdir -p /var/www/ai-interview
cd /var/www/ai-interview

# Clone repository (replace with your repo URL)
sudo git clone https://github.com/your-username/ai-interview.git .

# Or upload files via SCP/SFTP
```

### Step 2: Install Dependencies

```bash
cd /var/www/ai-interview/server
sudo npm install --production
```

### Step 3: Create Environment File

```bash
cd /var/www/ai-interview/server
sudo nano .env
```

Add the following:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration
FRONTEND_URL=https://yourdomain.com,http://yourdomain.com

# Optional: Database (if you add one later)
# DATABASE_URL=postgresql://user:password@localhost:5432/ai_interview
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Test Backend Locally

```bash
cd /var/www/ai-interview/server
node index.js
```

If it runs without errors, press `Ctrl+C` to stop.

### Step 5: Start with PM2

```bash
cd /var/www/ai-interview/server

# Start the application
pm2 start index.js --name "ai-interview-api"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown (usually run a sudo command)
```

### Step 6: Verify Backend is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs ai-interview-api

# Test API
curl http://localhost:5000/api/health
```

---

## Frontend Deployment

### Step 1: Build React Application

```bash
cd /var/www/ai-interview/client

# Install dependencies
sudo npm install

# Create production build
sudo npm run build
```

This creates a `build` folder with optimized production files.

### Step 2: Configure Environment Variables

```bash
cd /var/www/ai-interview/client
sudo nano .env.production
```

Add:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
# or if using same domain:
REACT_APP_API_URL=https://yourdomain.com/api
```

Rebuild after adding environment variables:

```bash
sudo npm run build
```

### Step 3: Configure Nginx for Frontend

```bash
sudo nano /etc/nginx/sites-available/ai-interview
```

Add configuration:

```nginx
# Frontend Configuration
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/ai-interview/client/build;
    index index.html;

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy (if backend on same server)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and exit.

### Step 4: Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/ai-interview /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Alternative: Separate Backend Server

If you want backend on a separate subdomain:

### Backend Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/api.yourdomain.com
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable it:

```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Domain & SSL Setup

### Step 1: Point Domain to Server

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add DNS A record:
   - Type: `A`
   - Host: `@` (or leave blank)
   - Value: Your server IP address
   - TTL: 3600 (or default)

3. Add CNAME for www (optional):
   - Type: `CNAME`
   - Host: `www`
   - Value: `yourdomain.com`
   - TTL: 3600

4. Wait for DNS propagation (5 minutes to 48 hours)

### Step 2: Install Certbot (Let's Encrypt SSL)

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 3: Obtain SSL Certificate

```bash
# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API subdomain (if separate)
sudo certbot --nginx -d api.yourdomain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: Yes)
```

### Step 4: Auto-Renewal

Certbot automatically sets up auto-renewal. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Environment Configuration

### Update Backend .env

After setting up domain, update backend `.env`:

```bash
sudo nano /var/www/ai-interview/server/.env
```

```env
NODE_ENV=production
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
```

### Update Frontend Build

Rebuild frontend with correct API URL:

```bash
cd /var/www/ai-interview/client
sudo nano .env.production
```

```env
REACT_APP_API_URL=https://api.yourdomain.com/api
# or
REACT_APP_API_URL=https://yourdomain.com/api
```

Rebuild:

```bash
sudo npm run build
```

Restart services:

```bash
pm2 restart ai-interview-api
sudo systemctl reload nginx
```

---

## Process Management

### PM2 Commands

```bash
# View all processes
pm2 list

# View logs
pm2 logs ai-interview-api

# Restart application
pm2 restart ai-interview-api

# Stop application
pm2 stop ai-interview-api

# Delete application from PM2
pm2 delete ai-interview-api

# Monitor resources
pm2 monit

# View detailed info
pm2 show ai-interview-api
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log
```

---

## Monitoring & Maintenance

### Setup Log Rotation

```bash
# PM2 already handles log rotation, but you can configure it
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Setup Firewall

```bash
# Install UFW (Uncomplicated Firewall)
sudo apt install ufw -y

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages (in project directory)
cd /var/www/ai-interview/server
npm update

cd /var/www/ai-interview/client
npm update
```

### Backup Strategy

```bash
# Create backup script
sudo nano /usr/local/bin/backup-ai-interview.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ai-interview"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/ai-interview

# Backup environment files
cp /var/www/ai-interview/server/.env $BACKUP_DIR/env_$DATE.env

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/backup-ai-interview.sh
```

Add to crontab (daily backup at 2 AM):

```bash
sudo crontab -e
# Add this line:
0 2 * * * /usr/local/bin/backup-ai-interview.sh
```

---

## Deployment Checklist

- [ ] Server provisioned and accessible
- [ ] Node.js 18+ installed
- [ ] Nginx installed and configured
- [ ] PM2 installed
- [ ] Repository cloned/uploaded
- [ ] Backend dependencies installed
- [ ] Backend .env configured
- [ ] Backend running with PM2
- [ ] Frontend dependencies installed
- [ ] Frontend built (npm run build)
- [ ] Frontend .env.production configured
- [ ] Nginx configured for frontend
- [ ] Domain DNS configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Backend accessible at /api/health
- [ ] Frontend accessible at root URL
- [ ] CORS configured correctly
- [ ] Logs monitoring setup
- [ ] Backup strategy in place

---

## Troubleshooting

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs ai-interview-api

# Check if port is in use
sudo lsof -i :5000

# Check environment variables
cd /var/www/ai-interview/server
cat .env
```

### Frontend Not Loading

```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify build files exist
ls -la /var/www/ai-interview/client/build

# Check Nginx configuration
sudo nginx -t
```

### API Not Accessible

```bash
# Test backend directly
curl http://localhost:5000/api/health

# Check CORS configuration
# Verify FRONTEND_URL in .env matches your domain

# Check Nginx proxy configuration
sudo nginx -t
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

### High Memory Usage

```bash
# Monitor PM2 processes
pm2 monit

# Restart if needed
pm2 restart ai-interview-api

# Check system resources
htop
# or
free -h
```

---

## Quick Deployment Script

Create a deployment script for easy updates:

```bash
sudo nano /usr/local/bin/deploy-ai-interview.sh
```

```bash
#!/bin/bash

echo "Starting deployment..."

# Navigate to project directory
cd /var/www/ai-interview

# Pull latest changes (if using git)
# git pull origin main

# Install/update backend dependencies
echo "Installing backend dependencies..."
cd server
npm install --production

# Install/update frontend dependencies
echo "Installing frontend dependencies..."
cd ../client
npm install

# Build frontend
echo "Building frontend..."
npm run build

# Restart backend
echo "Restarting backend..."
pm2 restart ai-interview-api

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"
```

Make executable:

```bash
sudo chmod +x /usr/local/bin/deploy-ai-interview.sh
```

Run deployment:

```bash
sudo /usr/local/bin/deploy-ai-interview.sh
```

---

## Security Best Practices

1. **Keep System Updated:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Use Strong Passwords:** Change default passwords

3. **SSH Key Authentication:** Disable password authentication for SSH

4. **Firewall:** Only open necessary ports (22, 80, 443)

5. **Environment Variables:** Never commit `.env` files to git

6. **Rate Limiting:** Already configured in Express

7. **HTTPS Only:** Redirect HTTP to HTTPS

8. **Regular Backups:** Automated backup strategy

9. **Monitor Logs:** Check logs regularly for issues

10. **Update Dependencies:** Regularly update npm packages

---

## Cost Estimation

### VPS Deployment (Monthly)

- **Server:** $5-20 (DigitalOcean, Linode, etc.)
- **Domain:** $10-15/year (~$1/month)
- **SSL:** Free (Let's Encrypt)
- **Total:** ~$6-21/month

### PaaS Deployment (Monthly)

- **Heroku:** Free tier or $7-25/month
- **Railway:** Free tier or $5-20/month
- **Render:** Free tier or $7-25/month

---

## Next Steps

After deployment:

1. Test all endpoints from external network
2. Monitor server resources
3. Setup error tracking (Sentry, etc.)
4. Setup analytics (Google Analytics, etc.)
5. Configure CDN for static assets (optional)
6. Setup database if needed (PostgreSQL, MongoDB)
7. Implement proper authentication
8. Setup CI/CD pipeline (GitHub Actions, etc.)

---

## Support

If you encounter issues:

1. Check server logs: `pm2 logs` and `sudo tail -f /var/log/nginx/error.log`
2. Verify environment variables
3. Test endpoints individually
4. Check firewall rules
5. Verify DNS propagation

Your application should now be accessible from anywhere! 🚀

