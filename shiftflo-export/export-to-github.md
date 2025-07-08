# Export ShiftFlo to GitHub Guide

## Steps to Export Your Complete App and Database

### 1. Create GitHub Repository
1. Go to GitHub.com and create a new repository
2. Name it something like `shiftflo-workforce-management`
3. Set it to Private (recommended for business app)
4. Don't initialize with README (we'll push existing code)

### 2. Initialize Git in Your Replit Project
Open the Shell in Replit and run:
```bash
git init
git add .
git commit -m "Initial commit - Complete ShiftFlo workforce management system"
```

### 3. Connect to GitHub Repository
Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual values:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 4. Create Test Branch
```bash
git checkout -b test
git push -u origin test
```

### 5. Database Export Options

#### Option A: Export Schema and Sample Data
```bash
# Export database schema
npm run db:push --dry-run > database-schema.sql

# Export sample data (create a seed script)
node scripts/export-sample-data.js > sample-data.sql
```

#### Option B: Full Database Dump (if you have PostgreSQL access)
```bash
# Export full database (requires pg_dump)
pg_dump $DATABASE_URL > database-export.sql
```

### 6. Environment Variables Setup
Create a `.env.example` file with all required variables:
```
DATABASE_URL=your_database_url_here
GOOGLE_DELEGATED_EMAIL=your_email_here
GOOGLE_APP_PASSWORD=your_app_password_here
SITE_DOMAIN=your_domain_here
```

### 7. Update Documentation
- Update README.md with setup instructions
- Document all environment variables needed
- Include database setup steps

### 8. Push to Test Branch
```bash
git add .
git commit -m "Add database export and environment setup"
git push origin test
```

## What Gets Exported

✅ **Complete Application Code**
- React frontend with all components
- Express backend with all API routes
- TypeScript configurations
- Tailwind CSS styling
- All business logic and workflows

✅ **Database Structure**
- All 21 database tables with relationships
- Foreign key constraints
- Index definitions
- Data types and validation

✅ **Sample Data** (if exported)
- User accounts and authentication
- Business profiles and settings
- Shifts, schedules, and templates
- Time tracking and strike data

✅ **Configuration Files**
- Package.json with all dependencies
- Drizzle ORM configuration
- Vite build configuration
- ESLint and Prettier settings

## Next Steps After Export

1. **Clone on New Environment**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   npm install
   ```

2. **Set Up Database**:
   - Create new PostgreSQL database
   - Run migrations: `npm run db:push`
   - Import sample data if needed

3. **Configure Environment**:
   - Copy `.env.example` to `.env`
   - Add your actual environment variables
   - Set up email credentials

4. **Start Development**:
   ```bash
   npm run dev
   ```

The exported repository will be a complete, production-ready workforce management system that can be deployed anywhere.