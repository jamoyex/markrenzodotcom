# 🚀 Deployment Guide - Mark Renzo Portfolio

## Environment Variables Required for Production

### ⚡ **Critical Variables (REQUIRED)**
```bash
NODE_ENV=production
PORT=3001

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
- `PORT` - Set to `3001`

### 2. **Database Setup**
Before first deployment, run:
```bash
npm run db:setup
```

### 3. **Build Configuration**
- **Build Command**: `npm run build`
- **Start Command**: `npm run start:prod`
- **Port**: `3001`
- **Health Check**: `/api/health`

### 4. **Container Configuration**
- Uses multi-stage Docker build
- Production dependencies only in final image
- Serves React app + API server on port 3001

## ✅ **Health Check**
The application provides a health check endpoint at:
```
GET /api/health
```

## 🔧 **Common Issues & Solutions**

### Issue: "Database connection failed"
- ✅ Verify all `DB_*` environment variables are set
- ✅ Check database connectivity from container
- ✅ Ensure database accepts connections from container IP

### Issue: "Module not found" errors
- ✅ Fixed in latest version with proper TypeScript imports
- ✅ Server uses `tsx` for TypeScript execution

### Issue: "Build fails with dependency issues"
- ✅ Fixed with multi-stage Docker build
- ✅ DevDependencies available during build, removed in production

## 📦 **Application Architecture**
- **Frontend**: React + Vite (served as static files)
- **Backend**: Express.js API server
- **Database**: PostgreSQL
- **Runtime**: Node.js 18 with TypeScript support via tsx 