# 🚀 Mark Renzo Portfolio - Full-Stack Application

A modern, production-ready portfolio application built with React, TypeScript, Express.js, and PostgreSQL.

## 🏗️ **Architecture**

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **TailwindCSS** for styling
- **Framer Motion** for animations
- **Radix UI** for accessible components

### **Backend**
- **Express.js** API server with TypeScript
- **PostgreSQL** database with connection pooling
- **tsx** for TypeScript execution in production
- Comprehensive error handling and logging

### **Deployment**
- **Docker** containerization with multi-stage builds
- **Nixpacks** for production builds on Coolify
- **Cloudflare** for CDN and SSL

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- PostgreSQL database
- npm or yarn

### **Installation**

```bash
# Clone the repository
git clone https://github.com/jamoyex/markrenzodotcom.git
cd markrenzodotcom/markrenzo-react

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npm run db:setup

# Start development server
npm run dev:full
```

### **Environment Variables**

```bash
# Required for production
NODE_ENV=production
PORT=3005

# Database Configuration
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=markrenzo_portfolio
DB_USER=your-username
DB_PASSWORD=your-password
```

## 📝 **Available Scripts**

```bash
# Development
npm run dev          # Start Vite dev server
npm run server       # Start Express server only
npm run dev:full     # Start both frontend and backend

# Production
npm run build        # Build for production
npm run start:prod   # Start production server
npm run preview      # Preview production build

# Database
npm run db:setup     # Initialize database and tables
npm run db:test      # Test database connection
npm run db:reset     # Reset database (re-run setup)

# Code Quality
npm run lint         # Run ESLint
```

## 🏢 **Project Structure**

```
markrenzo-react/
├── 📁 src/
│   ├── 📁 components/     # React components
│   │   ├── 📁 chat/       # Chat interface components
│   │   └── 📁 ui/         # Reusable UI components
│   ├── 📁 context/        # React contexts
│   ├── 📁 lib/            # Utilities and API clients
│   └── 📁 types/          # TypeScript type definitions
├── 📁 server/             # Express.js API server
├── 📁 scripts/            # Database setup scripts
├── 📁 dist/               # Production build output
├── 🐳 Dockerfile          # Multi-stage container build
├── ⚙️ nixpacks.toml       # Coolify deployment config
└── 📋 database_schema.sql # Database schema
```

## 🔐 **Security Features**

- **Production-safe logging** (sensitive data filtered)
- **Error sanitization** (stack traces hidden in production)
- **Environment variable validation**
- **SQL injection protection** via parameterized queries
- **CORS** configured for security

## 🚀 **Deployment**

### **Production (Coolify)**

1. **Set environment variables** in Coolify dashboard
2. **Deploy** - Nixpacks will handle the build automatically
3. **Health Check** - Available at `/api/health`

### **Local Docker**

```bash
# Build and run
docker build -t markrenzo-portfolio .
docker run -p 3005:3005 --env-file .env markrenzo-portfolio
```

## 🔧 **API Endpoints**

```bash
GET /api/health           # Health check
GET /api/test            # Simple test endpoint
GET /api/identifiers     # Get all portfolio identifiers
GET /api/portfolio/:id   # Get specific portfolio item
```

## 🗄️ **Database Schema**

The application uses PostgreSQL with the following main tables:
- `work_experience` - Professional experience
- `projects` - Portfolio projects
- `tools` - Technologies and tools
- `skills` - Professional skills
- `gallery` - Project gallery items

## 🛠️ **Development Tips**

### **Adding New Portfolio Items**

1. Add data to appropriate database table
2. Update the portfolio context if needed
3. Create corresponding React components

### **Debugging**

- **Server logs**: Check container logs in Coolify
- **Database**: Use `npm run db:test` to verify connection
- **API**: Test endpoints with curl or Postman

### **Common Issues**

- **Port conflicts**: Change PORT in environment variables
- **Database connection**: Verify all DB_* environment variables
- **Build failures**: Check for TypeScript errors with `npm run lint`

## 📦 **Dependencies**

### **Runtime**
- `express` - Web framework
- `pg` - PostgreSQL client
- `react` - UI library
- `framer-motion` - Animations
- `tsx` - TypeScript execution

### **Development**
- `vite` - Build tool
- `typescript` - Type checking
- `tailwindcss` - Styling
- `eslint` - Code linting

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

MIT License - see LICENSE file for details.

---

**Built with ❤️ by Mark Renzo Mariveles** 