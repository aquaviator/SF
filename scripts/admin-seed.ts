import { db } from '../server/db';
import { 
  siteAdmins, 
  platformSettings, 
  supportTickets, 
  pricingPlans, 
  promoCodes, 
  landingPages,
  mailingList,
  tenants,
  users
} from '../shared/schema';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';

async function seedAdminData() {
  console.log('🌱 SEEDING_ADMIN_DATA_START', { timestamp: new Date() });

  try {
    // Clear existing admin data
    await db.delete(landingPages);
    await db.delete(promoCodes);
    await db.delete(pricingPlans);
    await db.delete(supportTickets);
    await db.delete(platformSettings);
    await db.delete(mailingList);
    await db.delete(siteAdmins);

    console.log('🗑️ CLEARED_EXISTING_ADMIN_DATA');

    // 1. Create Site Admins
    const hashedPassword = await bcrypt.hash('password123', 10);
    const secret2FA = speakeasy.generateSecret({
      name: 'ShiftFlo Admin Portal',
      issuer: 'ShiftFlo'
    });

    const adminUsers = [
      {
        username: 'admin',
        email: 'admin@shiftflo.com',
        password: hashedPassword,
        role: 'super_admin' as const,
        is2faEnabled: false, // Disabled for development
        totpSecret: null,
        isActive: true,
        lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        ipWhitelist: ['127.0.0.1', '::1'], // localhost
        sessionTimeout: 3600 // 1 hour
      },
      {
        username: 'support',
        email: 'support@shiftflo.com',
        password: hashedPassword,
        role: 'support' as const,
        is2faEnabled: false,
        totpSecret: null,
        isActive: true,
        lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        ipWhitelist: ['127.0.0.1', '::1'],
        sessionTimeout: 3600
      },
      {
        username: 'finance',
        email: 'finance@shiftflo.com',
        password: hashedPassword,
        role: 'finance' as const,
        is2faEnabled: true,
        totpSecret: secret2FA.base32,
        isActive: true,
        lastLoginAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        ipWhitelist: ['127.0.0.1', '::1'],
        sessionTimeout: 1800 // 30 minutes
      },
      {
        username: 'marketing',
        email: 'marketing@shiftflo.com',
        password: hashedPassword,
        role: 'marketing' as const,
        is2faEnabled: false,
        totpSecret: null,
        isActive: true,
        lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        ipWhitelist: ['127.0.0.1', '::1'],
        sessionTimeout: 3600
      }
    ];

    const insertedAdmins = await db.insert(siteAdmins).values(adminUsers).returning();
    console.log('✅ CREATED_SITE_ADMINS', { count: adminUsers.length });

    // Get the actual IDs for foreign key references
    const adminId = insertedAdmins[0].id; // super_admin
    const supportId = insertedAdmins[1].id; // support
    const financeId = insertedAdmins[2].id; // finance  
    const marketingId = insertedAdmins[3].id; // marketing

    // 2. Create Platform Settings
    const platformConfig = [
      {
        key: 'maintenance_mode',
        value: 'false',
        description: 'Enable maintenance mode to block user access',
        category: 'system',
        updatedBy: adminId
      },
      {
        key: 'registration_enabled',
        value: 'true',
        description: 'Allow new business registrations',
        category: 'system',
        updatedBy: adminId
      },
      {
        key: 'max_seats_per_tenant',
        value: '1000',
        description: 'Maximum seats allowed per tenant',
        category: 'limits',
        updatedBy: adminId
      },
      {
        key: 'trial_duration_days',
        value: '14',
        description: 'Default trial duration in days',
        category: 'billing',
        updatedBy: financeId
      },
      {
        key: 'stripe_webhook_endpoint',
        value: 'https://api.shiftflo.com/webhooks/stripe',
        description: 'Stripe webhook endpoint URL',
        category: 'integrations',
        updatedBy: financeId
      },
      {
        key: 'support_email',
        value: 'support@shiftflo.com',
        description: 'Primary support contact email',
        category: 'contact',
        updatedBy: supportId
      },
      {
        key: 'analytics_tracking_id',
        value: 'GA-SHIFTFLO-001',
        description: 'Google Analytics tracking ID',
        category: 'analytics',
        updatedBy: marketingId
      },
      {
        key: 'feature_flags',
        value: '{"newDashboard":true,"aiScheduling":false,"mobileApp":true}',
        description: 'JSON object containing feature flags',
        category: 'features',
        updatedBy: adminId
      }
    ];

    await db.insert(platformSettings).values(platformConfig);
    console.log('✅ CREATED_PLATFORM_SETTINGS', { count: platformConfig.length });

    // 3. Create Seat-Based Pricing (Single Plan)
    const plans = [
      {
        name: 'ShiftFlo Pro',
        pricePerSeat: 3.00,
        features: [
          'Unlimited shifts and schedules',
          'Staff time tracking',
          'Assignment management',
          'Strike system automation',
          'Analytics dashboard',
          'Mobile app access',
          'Email support',
          'Business branding'
        ],
        isActive: true,
        maxSeats: null, // Unlimited seats
        billingInterval: 'monthly' as const
      }
    ];

    await db.insert(pricingPlans).values(plans);
    console.log('✅ CREATED_PRICING_PLANS', { count: plans.length });

    // 4. Create Promo Codes
    const promoCodes_data = [
      {
        code: 'WELCOME20',
        discountType: 'percentage' as const,
        discountValue: 20.00,
        validFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxUses: 100,
        currentUses: 23,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: true,
        description: 'Welcome discount for new customers',
        createdBy: marketingId
      },
      {
        code: 'EARLY50',
        discountType: 'percentage' as const,
        discountValue: 50.00,
        validFrom: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Started 14 days ago
        validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        maxUses: 50,
        currentUses: 12,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        isActive: true,
        description: 'Early adopter discount',
        createdBy: marketingId
      },
      {
        code: 'FIXED10',
        discountType: 'fixed' as const,
        discountValue: 10.00,
        validFrom: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
        validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        maxUses: 200,
        currentUses: 67,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        isActive: true,
        description: 'Fixed £10 discount',
        createdBy: marketingId
      }
    ];

    await db.insert(promoCodes).values(promoCodes_data);
    console.log('✅ CREATED_PROMO_CODES', { count: promoCodes_data.length });

    // 5. Create Support Tickets (using actual tenant data if available)
    const tickets = [
      {
        subject: 'Unable to clock in - mobile app issue',
        description: 'Staff members are reporting they cannot clock in using the mobile app. The button appears greyed out even during their scheduled shifts.',
        status: 'open' as const,
        priority: 'high' as const,
        tenantId: 'template-business',
        assignedAdminId: supportId,
        tags: ['mobile', 'clock-in', 'urgent']
      },
      {
        subject: 'Request for additional seats',
        description: 'We need to add 10 more seats to our subscription for new staff members joining next month.',
        status: 'in_progress' as const,
        priority: 'medium' as const,
        tenantId: 'dialabeer',
        assignedAdminId: financeId,
        tags: ['billing', 'seats', 'expansion']
      },
      {
        subject: 'Holiday entitlement calculation error',
        description: 'The system is showing incorrect holiday entitlements for part-time staff. It appears to be calculating based on full-time hours.',
        status: 'open' as const,
        priority: 'medium' as const,
        tenantId: 'template-business',
        assignedAdminId: supportId,
        tags: ['holidays', 'calculations', 'part-time']
      },
      {
        subject: 'Custom logo upload failing',
        description: 'Business logo upload keeps failing with "file too large" error even for small images under 1MB.',
        status: 'resolved' as const,
        priority: 'low' as const,
        tenantId: 'dialabeer',
        assignedAdminId: supportId,
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tags: ['upload', 'logo', 'resolved']
      },
      {
        subject: 'Integration with payroll system',
        description: 'Need help setting up API integration with our existing payroll system (Sage). Looking for technical documentation and support.',
        status: 'in_progress' as const,
        priority: 'high' as const,
        assignedAdminId: adminId,
        tags: ['integration', 'api', 'payroll', 'sage']
      },
      {
        subject: 'Shift pattern template not saving',
        description: 'Created a recurring shift template but it\'s not saving properly. The template disappears after refresh.',
        status: 'open' as const,
        priority: 'medium' as const,
        tenantId: 'template-business',
        assignedAdminId: supportId,
        tags: ['templates', 'saving', 'recurring']
      }
    ];

    await db.insert(supportTickets).values(tickets);
    console.log('✅ CREATED_SUPPORT_TICKETS', { count: tickets.length });

    // 6. Create Mailing List Subscribers (Skip for now if table doesn't exist)
    try {
      const subscribers = [
        {
          email: 'john.manager@restaurant.com',
          source: 'website',
          isActive: true
        },
        {
          email: 'sarah.ops@retailchain.co.uk',
          source: 'referral',
          isActive: true
        },
        {
          email: 'mike.supervisor@warehouse.net',
          source: 'social',
          isActive: true
        },
        {
          email: 'emma.hr@healthcare.org',
          source: 'webinar',
          isActive: true
        },
        {
          email: 'david.owner@cafe.local',
          source: 'website',
          isActive: false
        }
      ];

      await db.insert(mailingList).values(subscribers);
      console.log('✅ CREATED_MAILING_LIST', { count: subscribers.length });
    } catch (error) {
      console.log('⚠️ SKIPPED_MAILING_LIST', 'Table may not exist yet');
    }

    // 7. Create Sample Landing Pages
    const sampleLayouts = [
      {
        tenantId: 'template-business',
        layout: [
          {
            id: 'hero_1',
            type: 'hero',
            title: 'Welcome to Template Business',
            content: 'Streamline your workforce management with our comprehensive shift scheduling platform.',
            buttonText: 'Get Started',
            buttonUrl: '/register',
            imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200'
          },
          {
            id: 'features_1',
            type: 'features',
            title: 'Why Choose ShiftFlo?',
            content: 'Built for modern businesses that value efficiency and employee satisfaction.'
          },
          {
            id: 'pricing_1',
            type: 'pricing',
            title: 'Simple, Transparent Pricing',
            content: 'Pay only for what you use with our flexible seat-based pricing.'
          },
          {
            id: 'cta_1',
            type: 'cta',
            title: 'Ready to Transform Your Scheduling?',
            content: 'Join thousands of businesses already using ShiftFlo.',
            buttonText: 'Start Free Trial',
            buttonUrl: '/register'
          }
        ],
        isActive: true
      },
      {
        tenantId: 'dialabeer',
        layout: [
          {
            id: 'hero_2',
            type: 'hero',
            title: 'Welcome to Dialabeer',
            content: 'Efficient staff scheduling for our growing restaurant business.',
            buttonText: 'Join Our Team',
            buttonUrl: '/register',
            imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1200'
          },
          {
            id: 'text_1',
            type: 'text',
            title: 'About Dialabeer',
            content: 'We are a fast-growing restaurant focused on providing excellent food and service. Our team is our greatest asset, and we use cutting-edge tools to ensure smooth operations.'
          },
          {
            id: 'cta_2',
            type: 'cta',
            title: 'Ready to Join Our Team?',
            content: 'We are always looking for talented individuals to join our restaurant family.',
            buttonText: 'Apply Now',
            buttonUrl: '/staff-portal'
          }
        ],
        isActive: true
      }
    ];

    await db.insert(landingPages).values(sampleLayouts);
    console.log('✅ CREATED_LANDING_PAGES', { count: sampleLayouts.length });

    console.log('🎉 ADMIN_SEED_COMPLETE', { 
      timestamp: new Date(),
      summary: {
        admins: adminUsers.length,
        settings: platformConfig.length,
        plans: 1, // Single seat-based plan
        promoCodes: promoCodes_data.length,
        tickets: tickets.length,
        subscribers: 0, // Skipped if table doesn't exist
        landingPages: sampleLayouts.length
      }
    });

    console.log('🔐 ADMIN_CREDENTIALS', {
      message: 'Development admin accounts created',
      accounts: [
        { username: 'admin', role: 'super_admin', password: 'password123', '2fa': 'disabled' },
        { username: 'support', role: 'support', password: 'password123', '2fa': 'disabled' },
        { username: 'finance', role: 'finance', password: 'password123', '2fa': 'enabled (dev: disabled)' },
        { username: 'marketing', role: 'marketing', password: 'password123', '2fa': 'disabled' }
      ]
    });

  } catch (error) {
    console.error('❌ ADMIN_SEED_ERROR', { error: error.message });
    throw error;
  }
}

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdminData()
    .then(() => {
      console.log('✅ Admin seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin seeding failed:', error);
      process.exit(1);
    });
}

export { seedAdminData };