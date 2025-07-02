import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import {
  users,
  businessProfiles,
  jobRoles,
  locations,
  departments,
  operatingHours,
  scheduleTemplates,
  shifts,
  opportunities,
  swapRequests,
  assignments,
  holidayRequests,
} from '../shared/schema';

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}
const sql = neon(connectionString);
const db = drizzle(sql);

async function comprehensiveSeed() {
  console.log('🌱 Starting comprehensive database seed...');

  try {
    // Clear existing data in dependency order
    console.log('🗑️  Clearing existing data...');
    await db.delete(holidayRequests);
    await db.delete(assignments);
    await db.delete(swapRequests);
    await db.delete(opportunities);
    await db.delete(shifts);
    await db.delete(scheduleTemplates);
    await db.delete(operatingHours);
    await db.delete(departments);
    await db.delete(locations);
    await db.delete(jobRoles);
    await db.delete(businessProfiles);
    await db.delete(users);

    // Seed Users - 2 tenants with realistic staff
    console.log('👤 Seeding users...');
    await db.insert(users).values([
      // Acme Corp Users
      { username: 'sarah.wilson', password: 'password123', id: 1, firstName: 'Sarah', lastName: 'Wilson', email: 'sarah.wilson@acme-corp.com', tenantId: 'acme-corp', role: 'owner' },
      { username: 'mike.johnson', password: 'password123', id: 2, firstName: 'Mike', lastName: 'Johnson', email: 'mike.johnson@acme-corp.com', tenantId: 'acme-corp', role: 'staff' },
      { username: 'lisa.chen', password: 'password123', id: 3, firstName: 'Lisa', lastName: 'Chen', email: 'lisa.chen@acme-corp.com', tenantId: 'acme-corp', role: 'staff' },
      { username: 'david.rodriguez', password: 'password123', id: 4, firstName: 'David', lastName: 'Rodriguez', email: 'david.rodriguez@acme-corp.com', tenantId: 'acme-corp', role: 'staff' },
      { username: 'emma.thompson', password: 'password123', id: 5, firstName: 'Emma', lastName: 'Thompson', email: 'emma.thompson@acme-corp.com', tenantId: 'acme-corp', role: 'staff' },
      { username: 'alex.kim', password: 'password123', id: 6, firstName: 'Alex', lastName: 'Kim', email: 'alex.kim@acme-corp.com', tenantId: 'acme-corp', role: 'staff' },
      // Beta LLC Users
      { username: 'robert.davis', password: 'password123', id: 7, firstName: 'Robert', lastName: 'Davis', email: 'robert.davis@beta-llc.com', tenantId: 'beta-llc', role: 'owner' },
      { username: 'jennifer.martinez', password: 'password123', id: 8, firstName: 'Jennifer', lastName: 'Martinez', email: 'jennifer.martinez@beta-llc.com', tenantId: 'beta-llc', role: 'staff' },
      { username: 'kevin.brown', password: 'password123', id: 9, firstName: 'Kevin', lastName: 'Brown', email: 'kevin.brown@beta-llc.com', tenantId: 'beta-llc', role: 'staff' },
      { username: 'maria.garcia', password: 'password123', id: 10, firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@beta-llc.com', tenantId: 'beta-llc', role: 'staff' },
      { username: 'james.wilson', password: 'password123', id: 11, firstName: 'James', lastName: 'Wilson', email: 'james.wilson@beta-llc.com', tenantId: 'beta-llc', role: 'staff' },
      { username: 'ashley.taylor', password: 'password123', id: 12, firstName: 'Ashley', lastName: 'Taylor', email: 'ashley.taylor@beta-llc.com', tenantId: 'beta-llc', role: 'staff' },
    ]);

    // Seed Business Profiles
    console.log('🏢 Seeding business profiles...');
    await db.insert(businessProfiles).values([
      {
        tenantId: 'acme-corp',
        name: 'Acme Corp Restaurant',
        ownerName: 'Sarah Wilson',
        address: '123 Main Street, Downtown, NY 10001',
        phone: '(555) 123-4567',
        email: 'info@acme-corp.com',
        website: 'https://acme-corp.com',
        logoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=200&h=200&fit=crop&crop=center',
        description: 'Fine dining restaurant specializing in contemporary American cuisine with exceptional service',
        industry: 'Restaurant & Hospitality',
        businessHours: 'Mon-Sat 11:00 AM - 11:00 PM, Sun 10:00 AM - 10:00 PM',
        businessType: 'Restaurant'
      },
      {
        tenantId: 'beta-llc',
        name: 'Beta LLC Logistics',
        ownerName: 'Robert Davis',
        address: '456 Industrial Drive, Warehouse District, NY 10002',
        phone: '(555) 987-6543',
        email: 'contact@beta-llc.com',
        website: 'https://beta-llc.com',
        logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&h=200&fit=crop&crop=center',
        description: 'Full-service logistics and warehousing solutions with nationwide coverage',
        industry: 'Logistics & Supply Chain',
        businessHours: 'Mon-Fri 6:00 AM - 8:00 PM, Sat 8:00 AM - 4:00 PM',
        businessType: 'Logistics'
      }
    ]);

    // Seed Departments
    console.log('🏬 Seeding departments...');
    await db.insert(departments).values([
      // Acme Corp Departments
      { tenantId: 'acme-corp', name: 'Front of House', description: 'Customer service and dining room operations', managerId: 1, budget: '$25000', isActive: true },
      { tenantId: 'acme-corp', name: 'Kitchen', description: 'Food preparation and cooking operations', managerId: 1, budget: '$35000', isActive: true },
      { tenantId: 'acme-corp', name: 'Bar', description: 'Beverage service and bartending', managerId: 1, budget: '$20000', isActive: true },
      { tenantId: 'acme-corp', name: 'Management', description: 'Administrative and supervisory roles', managerId: 1, budget: '$15000', isActive: true },
      // Beta LLC Departments
      { tenantId: 'beta-llc', name: 'Warehouse Operations', description: 'Storage and inventory management', managerId: 7, budget: '$40000', isActive: true },
      { tenantId: 'beta-llc', name: 'Transportation', description: 'Delivery and logistics coordination', managerId: 7, budget: '$50000', isActive: true },
      { tenantId: 'beta-llc', name: 'Administration', description: 'Office and administrative functions', managerId: 7, budget: '$30000', isActive: true }
    ]);

    // Seed Locations
    console.log('📍 Seeding locations...');
    await db.insert(locations).values([
      // Acme Corp Locations
      { tenantId: 'acme-corp', name: 'FOH Restaurant', description: 'Main dining area with 80 seats', address: '123 Main Street, Floor 1', capacity: 80, isActive: true },
      { tenantId: 'acme-corp', name: 'Bar', description: 'Full bar with cocktail seating for 25', address: '123 Main Street, Floor 1 Front', capacity: 25, isActive: true },
      { tenantId: 'acme-corp', name: 'Office', description: 'Administrative offices and meeting rooms', address: '123 Main Street, Floor 2', capacity: 10, isActive: true },
      // Beta LLC Locations
      { tenantId: 'beta-llc', name: 'Back Office', description: 'Administrative offices and meeting spaces', address: '456 Industrial Drive, Building B', capacity: 15, isActive: true },
      { tenantId: 'beta-llc', name: 'Warehouse', description: 'Main storage and distribution facility', address: '456 Industrial Drive, Building A', capacity: 50, isActive: true }
    ]);

    // Seed Job Roles
    console.log('💼 Seeding job roles...');
    await db.insert(jobRoles).values([
      // Acme Corp Roles
      { tenantId: 'acme-corp', title: 'Server', description: 'Provide excellent table service and customer experience', department: 'Front of House', hourlyRate: '$18.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Bartender', description: 'Craft cocktails and manage bar service', department: 'Bar', hourlyRate: '$22.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Chef', description: 'Lead kitchen operations and menu execution', department: 'Kitchen', hourlyRate: '$28.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Manager', description: 'Oversee daily restaurant operations and staff', department: 'Management', hourlyRate: '$35.00', isActive: true },
      // Beta LLC Roles  
      { tenantId: 'beta-llc', title: 'Clerk', description: 'Handle administrative tasks and documentation', department: 'Administration', hourlyRate: '$16.00', isActive: true },
      { tenantId: 'beta-llc', title: 'Supervisor', description: 'Oversee warehouse operations and staff', department: 'Warehouse Operations', hourlyRate: '$24.00', isActive: true },
      { tenantId: 'beta-llc', title: 'Driver', description: 'Transport goods and manage delivery routes', department: 'Transportation', hourlyRate: '$19.00', isActive: true }
    ]);

    // Seed Operating Hours - Mon–Sat 9:00–18:00, Sun closed
    console.log('⏰ Seeding operating hours...');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const tenant of ['acme-corp', 'beta-llc']) {
      for (const day of days) {
        const isSunday = day === 'sunday';
        await db.insert(operatingHours).values({
          tenantId: tenant,
          dayOfWeek: day as any,
          openTime: isSunday ? null : '09:00',
          closeTime: isSunday ? null : '18:00',
          isOpen: !isSunday,
          breakStartTime: isSunday ? null : '12:00',
          breakEndTime: isSunday ? null : '13:00',
          notes: isSunday ? 'Closed on Sundays' : null
        });
      }
    }

    // Seed Schedule Templates
    console.log('📋 Seeding schedule templates...');
    await db.insert(scheduleTemplates).values([
      // Acme Corp Templates
      {
        tenantId: 'acme-corp',
        name: 'Morning Service',
        description: 'Morning service shift template (9:00–13:00 Mon–Fri)',
        positions: ['Server', 'Chef'],
        assignmentType: 'assigned',
        requiredStaffPerPosition: 2,
        recurrence: 'weekdays',
        isActive: true,
        createdBy: 1
      },
      {
        tenantId: 'acme-corp',
        name: 'Evening Shift',
        description: 'Evening service shift template (17:00–21:00 Tue–Sat)',
        positions: ['Server', 'Bartender', 'Chef'],
        assignmentType: 'assigned',
        requiredStaffPerPosition: 2,
        recurrence: 'custom',
        isActive: true,
        createdBy: 1
      },
      // Beta LLC Templates
      {
        tenantId: 'beta-llc',
        name: 'Warehouse Day Shift',
        description: 'Standard warehouse operations (9:00–17:00)',
        positions: ['Clerk', 'Supervisor'],
        assignmentType: 'assigned',
        requiredStaffPerPosition: 3,
        recurrence: 'weekdays',
        isActive: true,
        createdBy: 7
      }
    ]);

    // Generate realistic shifts for the past month
    console.log('📅 Seeding shifts (20 per tenant)...');
    const today = new Date();
    const shifts_data = [];
    
    // Helper function to get random date in past month
    const getRandomPastDate = () => {
      const daysAgo = Math.floor(Math.random() * 30);
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split('T')[0];
    };

    // Acme Corp shifts (20 shifts)
    const acmeStatuses = ['open', 'assigned', 'claimed', 'confirmed', 'clocked_in', 'completed'];
    const acmeRoles = ['Server', 'Bartender', 'Chef', 'Manager'];
    const acmeStaffIds = [2, 3, 4, 5, 6];
    
    for (let i = 0; i < 20; i++) {
      const isEvening = Math.random() > 0.5;
      shifts_data.push({
        tenantId: 'acme-corp',
        date: getRandomPastDate(),
        startTime: isEvening ? '17:00' : '11:00',
        endTime: isEvening ? '23:00' : '15:00',
        role: acmeRoles[Math.floor(Math.random() * acmeRoles.length)],
        description: isEvening ? 'Evening dinner service' : 'Lunch service shift',
        location: 'FOH Restaurant',
        status: acmeStatuses[Math.floor(Math.random() * acmeStatuses.length)] as any,
        assignmentType: 'assigned' as any,
        requiredStaff: 1,
        assignedTo: Math.random() > 0.3 ? acmeStaffIds[Math.floor(Math.random() * acmeStaffIds.length)] : null,
        claimedBy: null,
        templateId: null,
        createdBy: 1,
        notes: Math.random() > 0.8 ? 'Special event shift' : null
      });
    }
    
    // Beta LLC shifts (20 shifts)
    const betaStatuses = ['open', 'assigned', 'claimed', 'confirmed', 'clocked_in', 'completed'];
    const betaRoles = ['Clerk', 'Supervisor', 'Driver'];
    const betaStaffIds = [8, 9, 10, 11, 12];
    
    for (let i = 0; i < 20; i++) {
      const isLateShift = Math.random() > 0.6;
      shifts_data.push({
        tenantId: 'beta-llc',
        date: getRandomPastDate(),
        startTime: isLateShift ? '14:00' : '09:00',
        endTime: isLateShift ? '22:00' : '17:00',
        role: betaRoles[Math.floor(Math.random() * betaRoles.length)],
        description: isLateShift ? 'Evening warehouse operations' : 'Standard warehouse shift',
        location: 'Warehouse',
        status: betaStatuses[Math.floor(Math.random() * betaStatuses.length)] as any,
        assignmentType: 'assigned' as any,
        requiredStaff: 1,
        assignedTo: Math.random() > 0.3 ? betaStaffIds[Math.floor(Math.random() * betaStaffIds.length)] : null,
        claimedBy: null,
        templateId: null,
        createdBy: 7,
        notes: Math.random() > 0.9 ? 'Overtime authorized' : null
      });
    }
    
    await db.insert(shifts).values(shifts_data);

    // Seed Holiday Requests (3 per tenant + 2 sick days)
    console.log('🏖️ Seeding holiday requests...');
    const getRandomFutureDate = () => {
      const daysAhead = Math.floor(Math.random() * 60) + 7; // 7-67 days ahead
      const date = new Date(today);
      date.setDate(date.getDate() + daysAhead);
      return date.toISOString().split('T')[0];
    };

    await db.insert(holidayRequests).values([
      // Acme Corp Holiday Requests
      {
        tenantId: 'acme-corp',
        requesterId: 2,
        startDate: getRandomFutureDate(),
        endDate: getRandomFutureDate(),
        reason: 'Family vacation to Hawaii',
        status: 'approved',
        requestedAt: new Date('2025-06-15'),
        reviewedAt: new Date('2025-06-16'),
        reviewedBy: 1,
        notes: 'Approved - adequate coverage arranged'
      },
      {
        tenantId: 'acme-corp',
        requesterId: 3,
        startDate: getRandomFutureDate(),
        endDate: getRandomFutureDate(),
        reason: 'Wedding attendance',
        status: 'pending',
        requestedAt: new Date('2025-07-01'),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      },
      {
        tenantId: 'acme-corp',
        requesterId: 4,
        startDate: '2025-06-20',
        endDate: '2025-06-22',
        reason: 'Personal time off',
        status: 'declined',
        requestedAt: new Date('2025-06-10'),
        reviewedAt: new Date('2025-06-12'),
        reviewedBy: 1,
        notes: 'Declined - peak season, insufficient coverage'
      },
      // Acme Sick Days
      {
        tenantId: 'acme-corp',
        requesterId: 5,
        startDate: '2025-07-01',
        endDate: '2025-07-01',
        reason: 'Sick day - flu symptoms',
        status: 'approved',
        requestedAt: new Date('2025-06-30'),
        reviewedAt: new Date('2025-06-30'),
        reviewedBy: 1,
        notes: 'Emergency sick leave approved'
      },
      {
        tenantId: 'acme-corp',
        requesterId: 6,
        startDate: '2025-06-28',
        endDate: '2025-06-29',
        reason: 'Sick day - doctor appointment',
        status: 'approved',
        requestedAt: new Date('2025-06-27'),
        reviewedAt: new Date('2025-06-27'),
        reviewedBy: 1,
        notes: 'Medical appointment approved'
      },
      // Beta LLC Holiday Requests
      {
        tenantId: 'beta-llc',
        requesterId: 8,
        startDate: getRandomFutureDate(),
        endDate: getRandomFutureDate(),
        reason: 'Summer vacation',
        status: 'approved',
        requestedAt: new Date('2025-06-10'),
        reviewedAt: new Date('2025-06-11'),
        reviewedBy: 7,
        notes: 'Approved with temporary replacement scheduled'
      },
      {
        tenantId: 'beta-llc',
        requesterId: 9,
        startDate: getRandomFutureDate(),
        endDate: getRandomFutureDate(),
        reason: 'Medical procedure',
        status: 'pending',
        requestedAt: new Date('2025-07-02'),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      },
      {
        tenantId: 'beta-llc',
        requesterId: 10,
        startDate: '2025-06-25',
        endDate: '2025-06-25',
        reason: 'Sick day',
        status: 'approved',
        requestedAt: new Date('2025-06-24'),
        reviewedAt: new Date('2025-06-24'),
        reviewedBy: 7,
        notes: 'Emergency sick leave approved'
      }
    ]);

    console.log('✅ Comprehensive database seed completed successfully!');
    console.log(`Created:`);
    console.log(`- 12 users (6 per tenant)`);
    console.log(`- 2 business profiles (Acme Corp Restaurant, Beta LLC Logistics)`);
    console.log(`- 7 departments`);
    console.log(`- 5 locations (3 Acme, 2 Beta)`);
    console.log(`- 7 job roles (4 Acme, 3 Beta)`);
    console.log(`- 14 operating hours entries (Mon-Sat 9-18, Sun closed)`);
    console.log(`- 3 schedule templates`);
    console.log(`- 40 shifts (20 per tenant with realistic statuses)`);
    console.log(`- 8 holiday/sick requests (mixed statuses)`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  comprehensiveSeed()
    .then(() => {
      console.log('🎉 Comprehensive seed process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Comprehensive seed process failed:', error);
      process.exit(1);
    });
}

export default comprehensiveSeed;