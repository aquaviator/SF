import express from "express";
import bcrypt from "bcrypt";
import { db as database } from "../../db";
import { siteAdmins } from "../../../shared/schema";
import { eq } from "drizzle-orm";
// Admin authentication middleware
const adminAuth = (req: any, res: any, next: any) => {
  const session = req.session as any;
  if (!session.adminId) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }
  next();
};

const router = express.Router();

// Change password endpoint
router.put("/password", adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const session = req.session as any;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long" });
    }

    // Get current admin data
    const admin = await database
      .select()
      .from(siteAdmins)
      .where(eq(siteAdmins.id, session.adminId))
      .limit(1);

    if (!admin.length) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const adminUser = admin[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, adminUser.password);
    if (!isValidPassword) {
      console.log('❌ ADMIN_PASSWORD_CHANGE_FAILED', { 
        adminId: session.adminId, 
        reason: 'invalid_current_password',
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await database
      .update(siteAdmins)
      .set({
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(siteAdmins.id, session.adminId));

    console.log('✅ ADMIN_PASSWORD_CHANGED', { 
      adminId: session.adminId, 
      username: adminUser.username,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: "Password updated successfully" 
    });

  } catch (error) {
    console.error('❌ ADMIN_PASSWORD_CHANGE_ERROR', { error });
    res.status(500).json({ message: "Failed to update password" });
  }
});

// Change email endpoint  
router.put("/email", adminAuth, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const session = req.session as any;

    if (!newEmail || !password) {
      return res.status(400).json({ message: "New email and password confirmation are required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Get current admin data
    const admin = await database
      .select()
      .from(siteAdmins)
      .where(eq(siteAdmins.id, session.adminId))
      .limit(1);

    if (!admin.length) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const adminUser = admin[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    if (!isValidPassword) {
      console.log('❌ ADMIN_EMAIL_CHANGE_FAILED', { 
        adminId: session.adminId, 
        reason: 'invalid_password',
        timestamp: new Date().toISOString()
      });
      return res.status(400).json({ message: "Password is incorrect" });
    }

    // Check if email is already in use
    const existingAdmin = await database
      .select()
      .from(siteAdmins)
      .where(eq(siteAdmins.email, newEmail))
      .limit(1);

    if (existingAdmin.length > 0 && existingAdmin[0].id !== session.adminId) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    // Update email
    await database
      .update(siteAdmins)
      .set({
        email: newEmail,
        updatedAt: new Date()
      })
      .where(eq(siteAdmins.id, session.adminId));

    console.log('✅ ADMIN_EMAIL_CHANGED', { 
      adminId: session.adminId, 
      username: adminUser.username,
      oldEmail: adminUser.email,
      newEmail,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: "Email updated successfully",
      newEmail 
    });

  } catch (error) {
    console.error('❌ ADMIN_EMAIL_CHANGE_ERROR', { error });
    res.status(500).json({ message: "Failed to update email" });
  }
});

// Get admin profile
router.get("/me", adminAuth, async (req, res) => {
  try {
    const session = req.session as any;

    const admin = await database
      .select({
        id: siteAdmins.id,
        username: siteAdmins.username,
        email: siteAdmins.email,
        role: siteAdmins.role,
        is2faEnabled: siteAdmins.is2faEnabled,
        lastLogin: siteAdmins.lastLogin,
        createdAt: siteAdmins.createdAt
      })
      .from(siteAdmins)
      .where(eq(siteAdmins.id, session.adminId))
      .limit(1);

    if (!admin.length) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.json({ success: true, admin: admin[0] });

  } catch (error) {
    console.error('❌ ADMIN_PROFILE_FETCH_ERROR', { error });
    res.status(500).json({ message: "Failed to fetch admin profile" });
  }
});

export { router as adminProfileRoutes };