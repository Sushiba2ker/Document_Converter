# Deployment Guide

## Vercel Deployment (Frontend)

### Prerequisites
- GitHub account
- Vercel account
- Repository pushed to GitHub

### Steps

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Click "New Project"
- Import your GitHub repository

3. **Configure Build Settings**
- Framework Preset: **Next.js**
- Build Command: `cd frontend && npm run build`
- Output Directory: `frontend/.next`
- Install Command: `cd frontend && npm install`

4. **Environment Variables** (if needed)
- Add any required environment variables
- Example: `NEXT_PUBLIC_API_URL=https://your-backend.com`

5. **Deploy**
- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-app.vercel.app`

## Backend Deployment Options

### Option 1: Railway

1. **Create Railway Account**
- Go to [railway.app](https://railway.app)
- Connect GitHub account

2. **Deploy**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository
- Railway will auto-detect Python and deploy

3. **Configure**
- Set start command: `python run.py`
- Add environment variables if needed
- Set port to Railway's provided PORT

### Option 2: Render

1. **Create Render Account**
- Go to [render.com](https://render.com)
- Connect GitHub

2. **Create Web Service**
- Click "New Web Service"
- Connect repository
- Configure:
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `python run.py`

### Option 3: Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Create Procfile**
```
web: python run.py
```

3. **Deploy**
```bash
heroku create your-app-name
git push heroku main
```

## Environment Configuration

### Production Environment Variables

**Backend:**
```env
HOST=0.0.0.0
PORT=8000
RELOAD=false
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

## Domain Configuration

### Custom Domain on Vercel

1. Go to Project Settings
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### SSL Certificate

- Vercel automatically provides SSL certificates
- For custom domains, SSL is automatically configured

## Monitoring and Analytics

### Vercel Analytics
- Enable in Project Settings
- Monitor performance and usage

### Backend Monitoring
- Use server stats endpoint: `/server-stats`
- Monitor logs in deployment platform
- Set up health checks: `/health`

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check Node.js version (>=18)
   - Verify all dependencies in package.json
   - Check build logs for specific errors

2. **API Connection Issues**
   - Verify backend URL in environment variables
   - Check CORS configuration
   - Ensure backend is deployed and accessible

3. **File Upload Issues**
   - Check file size limits
   - Verify supported file types
   - Monitor server resources

### Debug Commands

```bash
# Check frontend build locally
cd frontend && npm run build

# Test backend locally
python run.py

# Check dependencies
npm audit
pip check
```

## Performance Optimization

### Frontend
- Images are optimized by Next.js
- Static files are cached
- Code splitting is automatic

### Backend
- Adjust worker count for production
- Monitor memory usage
- Implement rate limiting if needed

## Security Considerations

- Environment variables for sensitive data
- CORS properly configured
- File upload validation
- Rate limiting on API endpoints
- HTTPS enforced in production

## Backup and Recovery

- Code is backed up in Git repository
- Database backups (if using database)
- Monitor deployment logs
- Set up alerts for downtime
