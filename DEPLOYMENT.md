# 🚀 Deployment Guide - Mark Renzo Portfolio

## Environment Variables Required for Production

### ⚡ **Critical Variables (REQUIRED)**
```bash
NODE_ENV=production
PORT=3005

# Database Configuration (PostgreSQL)
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=markrenzo_portfolio
DB_USER=your-db-username
DB_PASSWORD=your-db-password
```

## 🐳 Coolify Deployment Setup

### 1. **Environment Variables in Coolify**
Set these in your Coolify application environment:
- `DB_HOST` - Your PostgreSQL database host
- `DB_PORT` - Database port (usually 5432)
- `DB_NAME` - Database name (e.g., `markrenzo_portfolio`)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `NODE_ENV` - Set to `production`
- `PORT` - Set to `3005`

### 2. **Database Setup**
Before first deployment, run:
```bash
npm run db:setup
```

### 3. **Build Configuration**
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Port**: `3005`
- **Health Check**: `/api/health`

### 4. **Container Configuration**
- Uses multi-stage Docker build
- Production dependencies only in final image
- Serves React app + API server on port 3005
- **IMPORTANT**: Server binds to `0.0.0.0:3005` (required for containers)

## ✅ **Health Check**
The application provides a health check endpoint at:
```
GET /api/health
```

## 🔧 **Common Issues & Solutions**

### Issue: "502 Bad Gateway" from Cloudflare
**Root Cause**: Application not starting properly in container

**✅ Debug Steps**:
1. Check Coolify container logs for startup errors
2. Verify all environment variables are set
3. Ensure database connectivity (app will run without DB but with fallbacks)
4. Check if port 3005 is properly exposed

**✅ App Features**: 
- Comprehensive startup logging
- Graceful database error handling
- Fallback data when database unavailable
- Global error handlers prevent crashes

### Issue: "Database connection failed"
- ✅ App will continue running with fallback data
- ✅ No database crashes - all DB errors are handled gracefully
- ✅ Verify all `DB_*` environment variables are set
- ✅ Check database connectivity from container

### Issue: "Module not found" errors
- ✅ Fixed in latest version with proper TypeScript imports
- ✅ Server uses `tsx` for TypeScript execution
- ✅ Top-level await support for database imports

### Issue: "Build fails with dependency issues"
- ✅ Fixed with multi-stage Docker build
- ✅ DevDependencies available during build, removed in production
- ✅ Build verification steps included in Dockerfile

### Issue: "Static files not found"
- ✅ Fixed: Server properly serves from `/dist` directory  
- ✅ Comprehensive logging shows file paths
- ✅ Dockerfile verification ensures files are copied correctly

## 🚨 **Debugging Production Issues**

### View Application Logs
```bash
# In Coolify, check the container logs for:
🚀 Starting Mark Renzo Portfolio Server...
📊 Environment: production
🌐 Port: 3005
📁 Serving static files from: /app/dist
✅ Database functions loaded successfully
🚀 API Server running on http://0.0.0.0:3005
✅ Server startup complete!
```

### Test Health Endpoint
```bash
curl https://your-domain.com/api/health
# Should return:
{
  "status": "OK",
  "message": "API server is running",
  "environment": "production",
  "port": 3005,
  "database": "loaded" // or "fallback"
}
```

## 📦 **Application Architecture**
- **Frontend**: React + Vite (served as static files)
- **Backend**: Express.js API server
- **Database**: PostgreSQL (with graceful fallbacks)
- **Runtime**: Node.js 18 with TypeScript support via tsx
- **Error Handling**: Comprehensive logging + graceful error recovery 