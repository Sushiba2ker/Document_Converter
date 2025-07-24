# Backend Deployment Guide

## Quick Deploy to Railway (Recommended)

### 1. Prepare for Railway
```bash
# Create Procfile for Railway
echo "web: python run.py" > Procfile

# Update run.py for production
# Railway provides PORT environment variable
```

### 2. Deploy Steps
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-detect Python and deploy

### 3. Configure Environment
- Railway will automatically set PORT
- No additional config needed for basic setup

### 4. Get Your Backend URL
- After deployment: `https://your-app.railway.app`
- Copy this URL for frontend configuration

## Update Frontend on Vercel

### 1. Add Environment Variable
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add new variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://your-backend-url.railway.app`
5. Redeploy frontend

### 2. Test Full Stack
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.railway.app`
- API Docs: `https://your-backend.railway.app/docs`

## Alternative: Render

### 1. Create Web Service
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python run.py`

### 2. Environment Variables
- Render auto-sets PORT
- No additional config needed

## Production Checklist

- [ ] Backend deployed to Railway/Render
- [ ] Backend URL obtained
- [ ] Frontend environment variable updated
- [ ] Frontend redeployed on Vercel
- [ ] Full stack tested
- [ ] API documentation accessible

## Troubleshooting

### Backend Issues
- Check logs in Railway/Render dashboard
- Verify requirements.txt includes all dependencies
- Ensure run.py uses PORT from environment

### Frontend Issues
- Verify NEXT_PUBLIC_API_URL is correct
- Check browser network tab for API calls
- Ensure environment variable is set in Vercel
