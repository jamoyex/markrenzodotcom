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

# Database Configuration (dummy example; replace privately)
DATABASE_URL=postgresql://portfolio_user:replace_me@db.example.com:5432/markrenzo_portfolio?sslmode=verify-full
```

`DATABASE_URL` is the preferred server-side configuration. It takes precedence over
all five legacy `DB_*` connection fields. Use `postgres://` or `postgresql://`, include
a username, password, host and database, and percent-encode special characters in
credentials (for example, `@` as `%40`). The port defaults to 5432. An empty or invalid
`DATABASE_URL` is an error; it never silently falls back to another database.

URL connections always verify the PostgreSQL TLS certificate and hostname, including
when no `sslmode` is specified. `sslmode=verify-full` is recommended; `sslmode=require`
also performs full verification in this app. Other modes and URL query parameters
are rejected so they cannot override TLS verification. For a private certificate
authority, set `DB_SSL_CA` to its PEM certificate(s), using actual newlines or `\n`.
Otherwise the Node.js default trusted CAs are used. The server must support PostgreSQL
TLS and present a valid certificate matching the hostname in the URL. HTTPS on the
portfolio website alone does not secure the PostgreSQL connection.

Existing deployments can omit `DATABASE_URL` and continue using all of `DB_HOST`,
`DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`. This preserves their previous
non-TLS behavior for compatibility. Set `DB_SSL_MODE=verify-full` to enable verified
TLS for that fallback; providing `DB_SSL_CA` also enables verified TLS. Do not use the
legacy non-TLS default for a remote database connection. To switch back to legacy
fields, remove `DATABASE_URL` rather than setting it to an empty string.

Keep these variables in backend runtime secrets or a gitignored `.env`, never in
`VITE_*` variables or frontend code. See [.env.example](.env.example) and
[the deployment guide](DEPLOYMENT.md) for configuration. After secure connectivity
is configured, `npm run db:test` runs only `SELECT 1`, closes the pool, and exits
nonzero for invalid configuration or a failed connection. It does not initialize
tables or change data. The setup/seed/import scripts referenced in `package.json`
are not present in this checkout.

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
npm test             # Offline database configuration tests (no live DB)
npm run typecheck:database # Type-check database configuration, client and tests
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
- **Database connection**: Verify `DATABASE_URL` (or all five legacy fields), TLS support and CA trust
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
