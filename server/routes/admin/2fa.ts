import { Express } from 'express';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { nanoid } from 'nanoid';
import { adminAuth } from '../../middleware/adminAuth';
import { db as database } from '../../db';
import { siteAdmins } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export function setup2FARoutes(app: Express) {
  // POST /api/admin/2fa/setup
  app.post('/api/admin/2fa/setup', adminAuth, async (req, res) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const secret = speakeasy.generateSecret({ 
        name: `ShiftFlo Admin (${req.admin.username})`,
        issuer: 'ShiftFlo'
      });

      // Store the secret temporarily (not enabled until verified)
      await database.update(siteAdmins)
        .set({ totpSecret: secret.base32 })
        .where(eq(siteAdmins.id, req.admin.id));

      const qr = await qrcode.toDataURL(secret.otpauth_url!);

      console.log('🔐 2FA_SETUP_INITIATED', {
        adminId: req.admin.id,
        username: req.admin.username,
        timestamp: new Date()
      });

      res.json({ 
        otpauth_url: secret.otpauth_url, 
        qr,
        secret: secret.base32 // For manual entry if QR fails
      });
    } catch (error) {
      console.error('❌ 2FA_SETUP_ERROR', { error: error.message, adminId: req.admin?.id });
      res.status(500).json({ message: 'Failed to set up 2FA' });
    }
  });

  // POST /api/admin/2fa/verify
  app.post('/api/admin/2fa/verify', adminAuth, async (req, res) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'TOTP token required' });
      }

      // Get admin's TOTP secret
      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, req.admin.id))
        .limit(1);

      if (!admin.length || !admin[0].totpSecret) {
        return res.status(400).json({ message: '2FA setup not initiated' });
      }

      const valid = speakeasy.totp.verify({
        secret: admin[0].totpSecret,
        encoding: 'base32',
        token,
        window: 1 // Allow 30 seconds before/after
      });

      if (!valid) {
        console.log('❌ 2FA_VERIFY_FAILED', {
          adminId: req.admin.id,
          timestamp: new Date()
        });
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Generate recovery codes
      const recoveryCodes = Array.from({ length: 10 }, () => nanoid(8));

      // Enable 2FA
      await database.update(siteAdmins)
        .set({ 
          is2faEnabled: true, 
          recoveryCodes 
        })
        .where(eq(siteAdmins.id, req.admin.id));

      // Set session as 2FA verified
      const session = req.session as any;
      session.is2faVerified = true;

      console.log('✅ 2FA_ENABLED', {
        adminId: req.admin.id,
        username: req.admin.username,
        timestamp: new Date()
      });

      res.json({ 
        success: true,
        recoveryCodes,
        message: '2FA enabled successfully'
      });
    } catch (error) {
      console.error('❌ 2FA_VERIFY_ERROR', { error: error.message, adminId: req.admin?.id });
      res.status(500).json({ message: 'Failed to verify 2FA' });
    }
  });

  // POST /api/admin/2fa/challenge
  app.post('/api/admin/2fa/challenge', async (req, res) => {
    try {
      const session = req.session as any;
      const { token } = req.body;

      if (!session.adminId) {
        return res.status(401).json({ message: 'Admin session required' });
      }

      if (!token) {
        return res.status(400).json({ message: 'Token required' });
      }

      // Get admin from database
      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, session.adminId))
        .limit(1);

      if (!admin.length || !admin[0].is2faEnabled) {
        return res.status(400).json({ message: 'Invalid admin or 2FA not enabled' });
      }

      const adminUser = admin[0];
      let valid = false;
      let usedRecoveryCode = false;

      // Try TOTP first
      if (adminUser.totpSecret) {
        valid = speakeasy.totp.verify({
          secret: adminUser.totpSecret,
          encoding: 'base32',
          token,
          window: 1
        });
      }

      // If TOTP failed, try recovery code
      if (!valid && adminUser.recoveryCodes && adminUser.recoveryCodes.includes(token)) {
        valid = true;
        usedRecoveryCode = true;

        // Remove used recovery code
        const updatedCodes = adminUser.recoveryCodes.filter(code => code !== token);
        await database.update(siteAdmins)
          .set({ recoveryCodes: updatedCodes })
          .where(eq(siteAdmins.id, adminUser.id));
      }

      if (!valid) {
        console.log('❌ 2FA_CHALLENGE_FAILED', {
          adminId: adminUser.id,
          timestamp: new Date()
        });
        return res.status(400).json({ message: 'Invalid code' });
      }

      // Mark session as 2FA verified
      session.is2faVerified = true;

      console.log('✅ 2FA_CHALLENGE_SUCCESS', {
        adminId: adminUser.id,
        usedRecoveryCode,
        timestamp: new Date()
      });

      res.json({ 
        success: true,
        recoveryCodeUsed: usedRecoveryCode,
        remainingRecoveryCodes: usedRecoveryCode ? adminUser.recoveryCodes!.length - 1 : undefined
      });
    } catch (error) {
      console.error('❌ 2FA_CHALLENGE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to verify 2FA challenge' });
    }
  });

  // POST /api/admin/2fa/disable
  app.post('/api/admin/2fa/disable', adminAuth, async (req, res) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const { currentPassword } = req.body;

      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required to disable 2FA' });
      }

      // Verify current password
      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, req.admin.id))
        .limit(1);

      if (!admin.length) {
        return res.status(400).json({ message: 'Admin not found' });
      }

      const bcrypt = require('bcrypt');
      const passwordMatch = await bcrypt.compare(currentPassword, admin[0].password);

      if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }

      // Disable 2FA
      await database.update(siteAdmins)
        .set({ 
          is2faEnabled: false,
          totpSecret: null,
          recoveryCodes: null
        })
        .where(eq(siteAdmins.id, req.admin.id));

      console.log('🔓 2FA_DISABLED', {
        adminId: req.admin.id,
        username: req.admin.username,
        timestamp: new Date()
      });

      res.json({ success: true, message: '2FA disabled successfully' });
    } catch (error) {
      console.error('❌ 2FA_DISABLE_ERROR', { error: error.message, adminId: req.admin?.id });
      res.status(500).json({ message: 'Failed to disable 2FA' });
    }
  });

  // GET /api/admin/2fa/status
  app.get('/api/admin/2fa/status', adminAuth, async (req, res) => {
    try {
      if (!req.admin) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, req.admin.id))
        .limit(1);

      if (!admin.length) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      res.json({
        is2faEnabled: admin[0].is2faEnabled,
        recoveryCodesCount: admin[0].recoveryCodes?.length || 0
      });
    } catch (error) {
      console.error('❌ 2FA_STATUS_ERROR', { error: error.message, adminId: req.admin?.id });
      res.status(500).json({ message: 'Failed to get 2FA status' });
    }
  });
}