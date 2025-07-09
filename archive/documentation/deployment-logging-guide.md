# Deployment Logging Guide

## How to Monitor Authentication in Production

### 1. **Replit Deployment Logs**
- In your Replit deployment interface, click "View Logs"
- Look for console.log entries with these prefixes:
  - `🔑 LOGIN_ATTEMPT` - When someone tries to log in
  - `✅ LOGIN_SUCCESS` - Successful login
  - `❌ LOGIN_FAILED` - Failed login attempts
  - `🔍 AUTH_CHECK` - Session validation checks
  - `🔍 ADMIN_AUTH_CHECK` - Admin session checks

### 2. **Key Log Messages to Watch For**
```
✅ LOGIN_SUCCESS { userId: 141, email: 'owner@template.com', role: 'owner', domain: 'task-master-leatfield.replit.app' }
❌ AUTH_CHECK_NO_SESSION { domain: 'task-master-leatfield.replit.app' }
🔍 AUTH_CHECK { sessionId: 'abc12345...', userId: 141, domain: 'task-master-leatfield.replit.app' }
```

### 3. **Troubleshooting Common Issues**
- **"No session" messages**: Session cookies not persisting
- **"User not found" messages**: Database connectivity issues
- **Domain mismatches**: Check if authentication works on both domains

### 4. **Testing After Deployment**
1. Try logging in with: `owner@template.com` / `password`
2. Try admin login with: `admin` / `password123`
3. Check if sessions persist across page refreshes
4. Test on both your custom domain and the default Replit domain

### 5. **Current Authentication Status**
- ✅ Session cookie configuration fixed for deployment
- ✅ Enhanced logging added for debugging
- ✅ Database-driven authentication implemented
- ✅ Works locally - deploy to test in production