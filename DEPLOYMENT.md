# 🚀 Production Deployment Guide

Comprehensive guide for deploying the Mark Renzo Portfolio application to production using Coolify.

## 🏗️ **Architecture Overview**

This is a full-stack TypeScript application with:
- **Frontend**: React + Vite (served as static files)
- **Backend**: Express.js API server (TypeScript via tsx)
- **Database**: PostgreSQL with connection pooling
- **Deployment**: Nixpacks on Coolify with Docker containerization

## ⚡ **Required Environment Variables**

### **Application Configuration**
```bash
NODE_ENV=production
PORT=3005
```

### **Database Configuration (PostgreSQL)**
```bash
DB_HOST=your-database-host.com
DB_PORT=5432
DB_NAME=markrenzo_portfolio
DB_USER=your-db-username
DB_PASSWORD=your-db-password
```

## 🚀 **Coolify Deployment**

### **1. Environment Setup**
In your Coolify application dashboard, set these environment variables:
- `NODE_ENV` → `production`
- `PORT` → `3005`
- `DB_HOST` → Your PostgreSQL host
- `DB_PORT` → `5432` (or your custom port)
- `DB_NAME` → `markrenzo_portfolio`
- `DB_USER` → Your database username
- `DB_PASSWORD` → Your database password

### **2. Deployment Configuration**
Coolify automatically detects the `nixpacks.toml` configuration:
```toml
[variables]
NODE_ENV = "production"
PORT = "3005"

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start:prod"
```

### **3. Database Initialization**
Before first deployment, initialize your database:
```bash
# On your database server or via connection tool
psql -h your-host -U your-user -d your-database -f database_schema.sql
```

### **4. Health Check**
The application provides a comprehensive health check at:
```
GET /api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "API server is running",
  "environment": "production",
  "port": 3005,
  "database": "loaded",
  "timestamp": "2025-07-25T02:30:00.000Z"
}
```

## 🔐 **Security Features**

### **Production-Safe Logging**
- Sensitive console output filtered in production
- Error details sanitized (no stack traces exposed)
- Request logging disabled in production for performance

### **Error Handling**
- Graceful database connection failures
- Fallback data when database unavailable
- Global exception handlers prevent crashes

### **Database Security**
- Parameterized queries prevent SQL injection
- Connection pooling with limits
- Environment variable validation

## 🐳 **Docker Architecture**

### **Multi-Stage Build**
1. **Builder Stage**: Install all dependencies + build React app
2. **Production Stage**: Copy built assets + production dependencies only

### **Container Features**
- Server binds to `0.0.0.0:3005` (container-friendly)
- Static files served from `/dist`
- TypeScript execution via `tsx` in production

## 📊 **Monitoring & Debugging**

### **Application Logs**
**Successful startup logs:**
```
ℹ️  🚀 Starting Mark Renzo Portfolio Server...
ℹ️  📊 Environment: production
ℹ️  🌐 Port: 3005
ℹ️  📁 Serving static files from: /app/dist
✅ Database functions loaded successfully
✅ API Server running on http://0.0.0.0:3005
✅ Server startup complete!
```

### **API Endpoints**
```bash
# Test endpoints
curl https://v2.markrenzo.com/api/health
curl https://v2.markrenzo.com/api/test
curl https://v2.markrenzo.com/api/identifiers
```

### **Common Log Patterns**
- `🔍` - Debug information (development only)  
- `ℹ️` - General information
- `✅` - Success messages
- `❌` - Error messages
- `⚠️` - Warning messages

## 🔧 **Troubleshooting**

### **Issue: 502 Bad Gateway**
**Cause**: Server not starting properly

**Debug Steps**:
1. Check Coolify container logs for startup errors
2. Verify all environment variables are set
3. Test database connectivity
4. Ensure port 3005 is properly configured

### **Issue: API Returns HTML Instead of JSON**
**Cause**: Express server not running, only static files served

**Solution**: 
- Verify `nixpacks.toml` configuration
- Check container logs for Express startup messages
- Ensure `npm run start:prod` is being executed

### **Issue: Database Connection Errors**
**Symptoms**: API works but returns fallback data

**Solutions**:
- Verify all `DB_*` environment variables
- Test database connectivity from container
- Check PostgreSQL server logs
- Ensure database accepts connections from container IP

### **Issue: Build Failures**
**Common Causes**:
- TypeScript compilation errors
- Missing dependencies
- Network timeouts during npm install

**Solutions**:
- Run `npm run lint` locally to check for errors
- Verify all dependencies are in `package.json`
- Check Coolify build logs for specific error messages

## 🚀 **Performance Optimizations**

### **Frontend**
- React app pre-built and served as static files
- Gzip compression enabled
- Asset optimization via Vite

### **Backend**
- Connection pooling for database
- Error response caching
- Request logging optimized for production

### **Database**
- Indexed queries for portfolio data
- Connection limits to prevent overload
- Graceful fallbacks reduce database pressure

## 📈 **Scaling Considerations**

### **Horizontal Scaling**
- Stateless Express server (scales horizontally)
- Database connection pooling handles multiple instances
- Static assets can be served via CDN

### **Database Scaling**
- PostgreSQL connection pooling
- Read replicas for portfolio data (future enhancement)
- Caching layer (Redis) can be added if needed

## 🔄 **Deployment Workflow**

1. **Code Changes** → Push to GitHub
2. **Coolify Detects** → Auto-deployment triggered
3. **Build Phase** → Nixpacks builds container
4. **Database Check** → Health check verifies connectivity
5. **Traffic Switch** → Zero-downtime deployment
6. **Monitoring** → Health checks ensure stability

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Database accessible and initialized
- [ ] Code tested locally with `npm run dev:full`
- [ ] Build passes with `npm run build`

### **Post-Deployment**
- [ ] Health check returns 200 OK
- [ ] All API endpoints return JSON (not HTML)
- [ ] Frontend loads without console errors
- [ ] Database connections working (check logs)

### **Production Verification**
- [ ] Portfolio data loads correctly
- [ ] Chat interface functional
- [ ] All images and assets load
- [ ] Site performance acceptable

---

## 🆘 **Emergency Procedures**

### **Rollback**
If deployment fails, Coolify can rollback to previous version:
1. Go to Coolify dashboard
2. Select "Deployments" tab
3. Click "Rollback" on last working deployment

### **Database Recovery**
If database issues occur:
1. Check database server status
2. Verify connection credentials
3. Application will continue with fallback data
4. No user-facing downtime expected

### **Quick Health Check**
```bash
# Verify all systems operational
curl -f https://v2.markrenzo.com/api/health || echo "API DOWN"
curl -f https://v2.markrenzo.com/ || echo "FRONTEND DOWN"
```

---

**For support, check container logs in Coolify dashboard or contact the development team.** 