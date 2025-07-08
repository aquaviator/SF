import { Express } from 'express';
import bcrypt from 'bcrypt';
import { db as database } from '../../db';
import { siteAdmins } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

// Database-based admin login function
async function adminLogin(username: string, password: string) {
  try {
    // Get admin user from database
    const admin = await database.select()
      .from(siteAdmins)
      .where(eq(siteAdmins.username, username))
      .limit(1);

    if (!admin.length) {
      console.log('❌ ADMIN_NOT_FOUND', { username, timestamp: new Date() });
      return null;
    }

    const adminUser = admin[0];

    // Check if admin is active
    if (!adminUser.isActive) {
      console.log('❌ ADMIN_INACTIVE', { username, timestamp: new Date() });
      return null;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    if (!isValidPassword) {
      console.log('❌ ADMIN_INVALID_PASSWORD', { username, timestamp: new Date() });
      return null;
    }

    console.log('✅ ADMIN_AUTHENTICATION_SUCCESS', { 
      username, 
      adminId: adminUser.id,
      timestamp: new Date() 
    });

    return adminUser;
  } catch (error) {
    console.error('❌ ADMIN_LOGIN_ERROR', { error: error.message, username, timestamp: new Date() });
    return null;
  }
}

export function setupAdminAuthRoutes(app: Express) {
  // POST /api/admin/login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password required' });
      }

      const admin = await adminLogin(username, password);

      if (!admin) {
        console.log('❌ ADMIN_LOGIN_FAILED', { username, timestamp: new Date() });
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const session = req.session as any;
      session.adminId = admin.id;

      // If 2FA is enabled, don't mark as fully authenticated yet
      if (admin.is2faEnabled) {
        session.pending2fa = true;
        session.is2faVerified = false;
        
        console.log('✅ ADMIN_LOGIN_PENDING_2FA', {
          adminId: admin.id,
          username: admin.username,
          timestamp: new Date()
        });

        return res.json({
          success: true,
          require2fa: true,
          admin: {
            id: admin.id,
            username: admin.username,
            role: admin.role
          }
        });
      }

      // No 2FA required - mark as fully authenticated
      session.is2faVerified = true;

      console.log('✅ ADMIN_LOGIN_SUCCESS', {
        adminId: admin.id,
        username: admin.username,
        role: admin.role,
        timestamp: new Date()
      });

      res.json({
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          is2faEnabled: admin.is2faEnabled
        }
      });
    } catch (error) {
      console.error('❌ ADMIN_LOGIN_ERROR', { error: error.message });
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // POST /api/admin/logout
  app.post('/api/admin/logout', async (req, res) => {
    try {
      const session = req.session as any;
      const adminId = session.adminId;

      session.adminId = undefined;
      session.is2faVerified = undefined;
      session.pending2fa = undefined;

      console.log('🚪 ADMIN_LOGOUT', {
        adminId,
        timestamp: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('❌ ADMIN_LOGOUT_ERROR', { error: error.message });
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // GET /api/admin/me
  app.get('/api/admin/me', async (req, res) => {
    try {
      const session = req.session as any;

      if (!session.adminId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, session.adminId))
        .limit(1);

      if (!admin.length || !admin[0].isActive) {
        session.adminId = undefined;
        return res.status(401).json({ message: 'Admin account not found or inactive' });
      }

      const adminUser = admin[0];

      // Check 2FA status
      if (adminUser.is2faEnabled && !session.is2faVerified) {
        return res.json({
          admin: {
            id: adminUser.id,
            username: adminUser.username,
            role: adminUser.role
          },
          require2fa: true
        });
      }

      res.json({
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          is2faEnabled: adminUser.is2faEnabled,
          lastLogin: adminUser.lastLogin
        }
      });
    } catch (error) {
      console.error('❌ ADMIN_ME_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to get admin info' });
    }
  });

  // POST /api/admin/create-admin (Super admin only)
  app.post('/api/admin/create-admin', async (req, res) => {
    try {
      const session = req.session as any;

      if (!session.adminId || !session.is2faVerified) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      // Check if requesting admin is super_admin
      const requestingAdmin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, session.adminId))
        .limit(1);

      if (!requestingAdmin.length || requestingAdmin[0].role !== 'super_admin') {
        return res.status(403).json({ message: 'Super admin privileges required' });
      }

      const { username, email, password, role = 'support' } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Username, email, and password required' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [newAdmin] = await database.insert(siteAdmins)
        .values({
          username,
          email,
          password: hashedPassword,
          role,
          isActive: true
        })
        .returning();

      console.log('✅ ADMIN_CREATED', {
        newAdminId: newAdmin.id,
        username,
        role,
        createdBy: session.adminId,
        timestamp: new Date()
      });

      res.json({
        success: true,
        admin: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          role: newAdmin.role
        }
      });
    } catch (error) {
      console.error('❌ ADMIN_CREATE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to create admin' });
    }
  });
}