// src/middleware/adminAuth.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { siteAdmins } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// ---- Extend Express' Session and Request types ----
declare module 'express-session' {
  interface SessionData {
    adminSession?: {
      adminId:       number;
      is2faVerified: boolean;
      pending2fa:    boolean;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id:           number;
        username:     string;
        email:        string;
        role:         string;
        permissions:  Record<string, boolean>;
        is2faEnabled: boolean;
      };
    }
  }
}

// ---- AdminSession interface for clarity ----
export interface AdminSession {
  adminId:       number;
  is2faVerified: boolean;
  pending2fa:    boolean;
}

// ---- Middleware: require a valid, 2FA-unblocked admin session ----
export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sess = req.session.adminSession as AdminSession | undefined;

    if (!sess?.adminId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Load the admin record
    const [adminRecord] = await db
      .select()
      .from(siteAdmins)
      .where(eq(siteAdmins.id, sess.adminId))
      .limit(1);

    if (!adminRecord || !adminRecord.isActive) {
      // Tear down invalid session
      delete req.session.adminSession;
      return res.status(401).json({ message: 'Account not found or inactive' });
    }

    // If 2FA is enabled but not yet verified, block all other routes
    if (adminRecord.is2faEnabled && !sess.is2faVerified) {
      return res.status(403).json({
        message:      'Two-factor authentication required',
        require2fa:   true,
        pending2fa:   sess.pending2fa ?? true,
      });
    }

    // All good: attach the admin payload to req
    req.admin = {
      id:           adminRecord.id,
      username:     adminRecord.username,
      email:        adminRecord.email,
      role:         adminRecord.role,
      permissions:  adminRecord.permissions || {},
      is2faEnabled: adminRecord.is2faEnabled,
    };

    next();
  } catch (err: any) {
    console.error('❌ adminAuth error:', err);
    res.status(500).json({ message: 'Internal authentication error' });
  }
};

// ---- Middleware: check for a specific role string ----
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Insufficient role permissions' });
    }
    next();
  };
};

// ---- Middleware: check for a named permission flag ----
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (!req.admin.permissions[permission]) {
      return res.status(403).json({ message: 'Permission denied' });
    }
    next();
  };
};

// ---- Helper: attempt admin login, returns session payload or null ----
export async function adminLogin(
  username: string,
  password: string
): Promise<Pick<AdminSession, 'adminId'> & { is2faVerified: boolean } | null> {
  try {
    const [adminRecord] = await db
      .select()
      .from(siteAdmins)
      .where(eq(siteAdmins.username, username))
      .limit(1);

    if (!adminRecord || !adminRecord.isActive) return null;

    const match = await bcrypt.compare(password, adminRecord.password);
    if (!match) return null;

    // record last login timestamp
    await db
      .update(siteAdmins)
      .set({ lastLogin: new Date() })
      .where(eq(siteAdmins.id, adminRecord.id));

    // start session: 2FA only if enabled
    return {
      adminId:       adminRecord.id,
      is2faVerified: !adminRecord.is2faEnabled,
    };
  } catch (err: any) {
    console.error('❌ adminLogin error:', err);
    return null;
  }
}
