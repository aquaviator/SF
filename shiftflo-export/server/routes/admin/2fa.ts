import { Express } from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db as database } from '../../db';
import { siteAdmins } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

export function setup2FARoutes(app: Express) {
  // POST /api/admin/2fa/setup - Generate 2FA secret and QR code
  app.post('/api/admin/2fa/setup', async (req, res) => {
    try {
      const session = req.session as any;

      if (!session.adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      // Get admin user
      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, session.adminId))
        .limit(1);

      if (!admin.length) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const adminUser = admin[0];

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `ShiftFlo Site Admin (${adminUser.username})`,
        issuer: 'ShiftFlo',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      console.log('🔐 2FA_SETUP_INITIATED', {
        adminId: adminUser.id,
        username: adminUser.username,
        timestamp: new Date()
      });

      res.json({
        success: true,
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      });

    } catch (error) {
      console.error('❌ 2FA_SETUP_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to setup 2FA' });
    }
  });

  // POST /api/admin/2fa/verify-setup - Verify and enable 2FA
  app.post('/api/admin/2fa/verify-setup', async (req, res) => {
    try {
      const session = req.session as any;
      const { token, secret } = req.body;

      if (!session.adminId) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      if (!token || !secret) {
        return res.status(400).json({ message: 'Token and secret required' });
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        console.log('❌ 2FA_VERIFICATION_FAILED', {
          adminId: session.adminId,
          timestamp: new Date()
        });
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Enable 2FA for the admin
      await database.update(siteAdmins)
        .set({
          is2faEnabled: true,
          totpSecret: secret,
          updatedAt: new Date()
        })
        .where(eq(siteAdmins.id, session.adminId));

      console.log('✅ 2FA_ENABLED', {
        adminId: session.adminId,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: '2FA enabled successfully'
      });

    } catch (error) {
      console.error('❌ 2FA_ENABLE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to enable 2FA' });
    }
  });

  // POST /api/admin/2fa/verify - Verify 2FA token during login
  app.post('/api/admin/2fa/verify', async (req, res) => {
    try {
      const session = req.session as any;
      const { token } = req.body;

      if (!session.adminId || !session.pending2fa) {
        return res.status(401).json({ message: 'No pending 2FA verification' });
      }

      if (!token) {
        return res.status(400).json({ message: 'Verification code required' });
      }

      // Get admin user and 2FA secret
      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, session.adminId))
        .limit(1);

      if (!admin.length || !admin[0].totpSecret) {
        return res.status(400).json({ message: 'Invalid 2FA configuration' });
      }

      const adminUser = admin[0];

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: adminUser.totpSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        console.log('❌ 2FA_LOGIN_VERIFICATION_FAILED', {
          adminId: session.adminId,
          username: adminUser.username,
          timestamp: new Date()
        });
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Mark 2FA as verified
      session.is2faVerified = true;
      session.pending2fa = false;

      // Update last login
      await database.update(siteAdmins)
        .set({ lastLogin: new Date() })
        .where(eq(siteAdmins.id, session.adminId));

      console.log('✅ 2FA_LOGIN_SUCCESS', {
        adminId: adminUser.id,
        username: adminUser.username,
        timestamp: new Date()
      });

      res.json({
        success: true,
        admin: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          is2faEnabled: adminUser.is2faEnabled
        }
      });

    } catch (error) {
      console.error('❌ 2FA_LOGIN_VERIFY_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to verify 2FA' });
    }
  });

  // POST /api/admin/2fa/disable - Disable 2FA
  app.post('/api/admin/2fa/disable', async (req, res) => {
    try {
      const session = req.session as any;
      const { token } = req.body;

      if (!session.adminId || !session.is2faVerified) {
        return res.status(401).json({ message: 'Admin authentication required' });
      }

      if (!token) {
        return res.status(400).json({ message: 'Current verification code required' });
      }

      // Get admin user
      const admin = await database.select()
        .from(siteAdmins)
        .where(eq(siteAdmins.id, session.adminId))
        .limit(1);

      if (!admin.length) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      const adminUser = admin[0];

      // Verify current token before disabling
      const verified = speakeasy.totp.verify({
        secret: adminUser.totpSecret || '',
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      // Disable 2FA
      await database.update(siteAdmins)
        .set({
          is2faEnabled: false,
          totpSecret: null,
          updatedAt: new Date()
        })
        .where(eq(siteAdmins.id, session.adminId));

      console.log('🔓 2FA_DISABLED', {
        adminId: session.adminId,
        username: adminUser.username,
        timestamp: new Date()
      });

      res.json({
        success: true,
        message: '2FA disabled successfully'
      });

    } catch (error) {
      console.error('❌ 2FA_DISABLE_ERROR', { error: error.message });
      res.status(500).json({ message: 'Failed to disable 2FA' });
    }
  });
}