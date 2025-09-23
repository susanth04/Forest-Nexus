# 🚀 Deployment & Setup Guide

## Quick Setup for New Users

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd forest-nexus-dss-ocr
npm install
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
# Copy example environment file
cp backend/.env.example backend/.env

# Edit the .env file with your configurations:
# - Add your Google Cloud service account key path
# - Add your Gemini API key
# - Adjust other settings as needed
```

### 3. Google Cloud Setup
1. Create a Google Cloud Project
2. Enable these APIs:
   - Cloud Vision API
   - Cloud Translate API
   - (Optional) Gemini API if using AI features
3. Create a Service Account and download the JSON key
4. Place the JSON key in the `backend/` directory
5. Update the `GOOGLE_APPLICATION_CREDENTIALS` path in `.env`

### 4. Run the Application
```bash
# Option 1: Run both frontend and backend together
npm run dev:full

# Option 2: Run separately
# Terminal 1 - Backend:
cd backend
uvicorn main:app --reload

# Terminal 2 - Frontend:
npm start
```

## Production Deployment

### Environment Variables for Production
```env
DEBUG=False
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Docker Deployment (Optional)
Create `Dockerfile` and `docker-compose.yml` for containerized deployment.

### Security Checklist
- [ ] API keys are in environment variables (not in code)
- [ ] Service account has minimal required permissions
- [ ] CORS is configured for specific domains in production
- [ ] HTTPS is enabled for production
- [ ] File upload limits are appropriate
- [ ] Rate limiting is configured if needed

## Troubleshooting Deployment

### Common Issues
1. **Port conflicts**: Change ports in environment variables
2. **API quotas**: Check Google Cloud console for API usage
3. **File permissions**: Ensure service account can read credential files
4. **Network issues**: Check firewall and security group settings

### Monitoring
- Check application logs
- Monitor API usage in Google Cloud Console
- Set up health check endpoints
- Configure error tracking (optional)

## Performance Optimization

### Frontend
- Build for production: `npm run build`
- Serve static files with a CDN
- Enable gzip compression
- Implement lazy loading for components

### Backend
- Use production ASGI server (Gunicorn + Uvicorn)
- Configure connection pooling
- Implement caching for frequent requests
- Set up proper logging levels

## Backup and Maintenance
- Regularly backup your Google Cloud project
- Update dependencies periodically
- Monitor API usage and costs
- Review and rotate API keys