import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { db as database } from '../db';
import { siteAdmins } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Extend Express types to include admin user
declare global {
  namespace Express {
    interface Request {
      admin?: {
        id: number;
        username: string;
        email: string;
        role: string;
        permissions: any;
        is2faEnabled: boolean;
      };
    }
  }
}

export interface AdminSession {
  adminId?: number;
  is2faVerified?: boolean;
  pending2fa?: boolean;
}

// Admin authentication middleware
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = req.session as any;
    
    if (!session.adminId) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    // Get admin from database
    const admin = await database.select().from(siteAdmins).where(eq(siteAdmins.id, session.adminId)).limit(1);
    
    if (!admin.length || !admin[0].isActive) {
      session.adminId = undefined;
      return res.status(401).json({ message: 'Admin account not found or inactive' });
    }

    const adminUser = admin[0];

    // Check if 2FA is required and verified
    if (adminUser.is2faEnabled && !session.is2faVerified) {
      return res.status(403).json({ 
        message: '2FA verification required',
        require2fa: true 
      });
    }

    // Attach admin to request
    req.admin = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions || {},
      is2faEnabled: adminUser.is2faEnabled
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Role-based permission middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Admin login function
export const adminLogin = async (username: string, password: string) => {
  try {
    const admin = await database.select().from(siteAdmins)
      .where(eq(siteAdmins.username, username))
      .limit(1);

    if (!admin.length || !admin[0].isActive) {
      return null;
    }

    const adminUser = admin[0];
    const passwordMatch = await bcrypt.compare(password, adminUser.password);

    if (!passwordMatch) {
      return null;
    }

    // Update last login
    await database.update(siteAdmins)
      .set({ lastLogin: new Date() })
      .where(eq(siteAdmins.id, adminUser.id));

    return {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      is2faEnabled: adminUser.is2faEnabled
    };
  } catch (error) {
    console.error('Admin login error:', error);
    return null;
  }
};