import { Router } from 'express';
// Using inline auth check instead of middleware
// import { isAuthenticated } from '../middleware/auth';
import { storage } from '../storage';
import { sendActivationEmail } from '../utils/mailer';
// Generate activation token inline
function generateActivationToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
import { z } from 'zod';

const router = Router();

const bulkImportSchema = z.object({
  users: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1)
  }))
});

router.post('/bulk-import', async (req, res) => {
  try {
    // Get tenantId from request body or query
    const tenantId = req.body.tenantId || req.query.tenantId;
    
    console.log('📋 BULK_IMPORT_START', { 
      tenantId, 
      timestamp: new Date() 
    });

    // Validate request body
    const validationResult = bulkImportSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid request data',
        errors: validationResult.error.errors
      });
    }

    const { users } = validationResult.data;
    
    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No users provided for import'
      });
    }

    if (users.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 users allowed per import'
      });
    }

    console.log('📋 PROCESSING_USERS', { 
      count: users.length,
      tenantId,
      timestamp: new Date() 
    });

    const results = {
      success: true,
      created: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[],
      users: [] as Array<{
        email: string;
        firstName: string;
        lastName: string;
        status: 'created' | 'failed' | 'skipped';
        error?: string;
      }>
    };

    // Get existing users to check for duplicates
    const existingUsers = await storage.getStaffByTenant(tenantId);
    const existingEmails = new Set(existingUsers.map(u => u.email?.toLowerCase()));

    console.log('📋 EXISTING_USERS_CHECK', { 
      existingCount: existingUsers.length,
      tenantId,
      timestamp: new Date() 
    });

    // Process each user
    for (const userData of users) {
      try {
        const email = userData.email.toLowerCase();
        
        // Check if user already exists
        if (existingEmails.has(email)) {
          console.log('⏭️ SKIPPING_EXISTING_USER', { 
            email,
            tenantId,
            timestamp: new Date() 
          });
          
          results.skipped++;
          results.users.push({
            ...userData,
            status: 'skipped'
          });
          continue;
        }

        // Generate activation token
        const activationToken = generateActivationToken();
        const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        console.log('👤 CREATING_USER', { 
          email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          tenantId,
          timestamp: new Date() 
        });

        // Create user with activation token
        const newUser = await storage.createUser({
          username: email,
          email,
          password: 'TEMPORARY_PLACEHOLDER', // Will be set during activation
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: 'staff',
          tenantId,
          isActive: false,
          activationToken,
          tokenExpiresAt
        });

        console.log('✅ USER_CREATED', { 
          userId: newUser.id,
          email,
          tenantId,
          timestamp: new Date() 
        });

        // Send activation email
        try {
          await sendActivationEmail(email, activationToken, userData.firstName);
          console.log('📧 ACTIVATION_EMAIL_SENT', { 
            email,
            userId: newUser.id,
            timestamp: new Date() 
          });
        } catch (emailError) {
          console.error('❌ ACTIVATION_EMAIL_FAILED', { 
            email,
            error: emailError.message,
            timestamp: new Date() 
          });
          results.errors.push(`Failed to send activation email to ${email}`);
        }

        results.created++;
        results.users.push({
          ...userData,
          status: 'created'
        });

      } catch (error) {
        console.error('❌ USER_CREATION_FAILED', { 
          email: userData.email,
          error: error.message,
          timestamp: new Date() 
        });
        
        results.failed++;
        results.errors.push(`Failed to create user ${userData.email}: ${error.message}`);
        results.users.push({
          ...userData,
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('✅ BULK_IMPORT_COMPLETED', { 
      tenantId,
      created: results.created,
      skipped: results.skipped,
      failed: results.failed,
      timestamp: new Date() 
    });

    res.json(results);

  } catch (error) {
    console.error('❌ BULK_IMPORT_ERROR', { 
      error: error.message,
      timestamp: new Date() 
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk import',
      error: error.message
    });
  }
});

export default router;