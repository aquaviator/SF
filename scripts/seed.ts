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

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
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

    // Seed Users
    console.log('👤 Seeding users...');
    const seedUsers = await db.insert(users).values([
      // Acme Corp Users
      {
        id: '1', 
        firstName: 'Sarah', 
        lastName: 'Wilson', 
        email: 'sarah.wilson@acme-corp.com',
        tenantId: 'acme-corp',
        role: 'owner'
      },
      {
        id: '2',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@acme-corp.com',
        tenantId: 'acme-corp',
        role: 'staff'
      },
      {
        id: '3',
        firstName: 'Lisa',
        lastName: 'Chen',
        email: 'lisa.chen@acme-corp.com',
        tenantId: 'acme-corp',
        role: 'staff'
      },
      {
        id: '4',
        firstName: 'David',
        lastName: 'Rodriguez',
        email: 'david.rodriguez@acme-corp.com',
        tenantId: 'acme-corp',
        role: 'staff'
      },
      {
        id: '5',
        firstName: 'Emma',
        lastName: 'Thompson',
        email: 'emma.thompson@acme-corp.com',
        tenantId: 'acme-corp',
        role: 'staff'
      },
      {
        id: '6',
        firstName: 'Alex',
        lastName: 'Kim',
        email: 'alex.kim@acme-corp.com',
        tenantId: 'acme-corp',
        role: 'staff'
      },
      // Beta LLC Users
      {
        id: '7',
        firstName: 'Robert',
        lastName: 'Davis',
        email: 'robert.davis@beta-llc.com',
        tenantId: 'beta-llc',
        role: 'owner'
      },
      {
        id: '8',
        firstName: 'Jennifer',
        lastName: 'Martinez',
        email: 'jennifer.martinez@beta-llc.com',
        tenantId: 'beta-llc',
        role: 'staff'
      },
      {
        id: '9',
        firstName: 'Kevin',
        lastName: 'Brown',
        email: 'kevin.brown@beta-llc.com',
        tenantId: 'beta-llc',
        role: 'staff'
      },
      {
        id: '10',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@beta-llc.com',
        tenantId: 'beta-llc',
        role: 'staff'
      },
      {
        id: '11',
        firstName: 'James',
        lastName: 'Wilson',
        email: 'james.wilson@beta-llc.com',
        tenantId: 'beta-llc',
        role: 'staff'
      },
      {
        id: '12',
        firstName: 'Ashley',
        lastName: 'Taylor',
        email: 'ashley.taylor@beta-llc.com',
        tenantId: 'beta-llc',
        role: 'staff'
      },
    ]).returning();

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
        description: 'Fine dining restaurant specializing in contemporary American cuisine',
        industry: 'Restaurant & Hospitality',
        businessHours: 'Mon-Sat 11:00 AM - 11:00 PM, Sun 10:00 AM - 10:00 PM',
        socialMediaLinks: JSON.stringify({
          instagram: '@acmecorp_restaurant',
          facebook: 'AcmeCorpRestaurant',
          twitter: '@acmecorp'
        })
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
        description: 'Full-service logistics and warehousing solutions',
        industry: 'Logistics & Supply Chain',
        businessHours: 'Mon-Fri 6:00 AM - 8:00 PM, Sat 8:00 AM - 4:00 PM',
        socialMediaLinks: JSON.stringify({
          linkedin: 'beta-llc-logistics',
          twitter: '@betallc'
        })
      }
    ]);

    // Seed Departments
    console.log('🏬 Seeding departments...');
    await db.insert(departments).values([
      // Acme Corp Departments
      { tenantId: 'acme-corp', name: 'Front of House', description: 'Customer service and dining room operations', isActive: true },
      { tenantId: 'acme-corp', name: 'Kitchen', description: 'Food preparation and cooking', isActive: true },
      { tenantId: 'acme-corp', name: 'Bar', description: 'Beverage service and bartending', isActive: true },
      { tenantId: 'acme-corp', name: 'Management', description: 'Administrative and supervisory roles', isActive: true },
      // Beta LLC Departments
      { tenantId: 'beta-llc', name: 'Warehouse', description: 'Storage and inventory management', isActive: true },
      { tenantId: 'beta-llc', name: 'Transportation', description: 'Delivery and logistics coordination', isActive: true },
      { tenantId: 'beta-llc', name: 'Administration', description: 'Office and administrative functions', isActive: true }
    ]);

    // Seed Locations
    console.log('📍 Seeding locations...');
    await db.insert(locations).values([
      // Acme Corp Locations
      { tenantId: 'acme-corp', name: 'Main Dining Room', description: 'Primary dining area with 80 seats', address: '123 Main Street, Floor 1', capacity: 80, isActive: true },
      { tenantId: 'acme-corp', name: 'Private Dining Room', description: 'Intimate dining space for special events', address: '123 Main Street, Floor 2', capacity: 20, isActive: true },
      { tenantId: 'acme-corp', name: 'Kitchen', description: 'Main kitchen and food preparation area', address: '123 Main Street, Floor 1 Back', capacity: 12, isActive: true },
      { tenantId: 'acme-corp', name: 'Bar Area', description: 'Full bar with cocktail seating', address: '123 Main Street, Floor 1 Front', capacity: 25, isActive: true },
      // Beta LLC Locations
      { tenantId: 'beta-llc', name: 'Main Warehouse', description: 'Primary storage facility', address: '456 Industrial Drive, Building A', capacity: 50, isActive: true },
      { tenantId: 'beta-llc', name: 'Loading Dock', description: 'Truck loading and unloading area', address: '456 Industrial Drive, Dock 1-4', capacity: 8, isActive: true },
      { tenantId: 'beta-llc', name: 'Office Space', description: 'Administrative offices', address: '456 Industrial Drive, Building B', capacity: 15, isActive: true }
    ]);

    // Seed Job Roles
    console.log('💼 Seeding job roles...');
    await db.insert(jobRoles).values([
      // Acme Corp Roles
      { tenantId: 'acme-corp', title: 'Server', description: 'Provide excellent customer service and food service', department: 'Front of House', hourlyRate: '$18.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Bartender', description: 'Prepare cocktails and manage bar service', department: 'Bar', hourlyRate: '$22.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Host/Hostess', description: 'Greet guests and manage seating', department: 'Front of House', hourlyRate: '$16.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Line Cook', description: 'Prepare and cook menu items', department: 'Kitchen', hourlyRate: '$20.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Sous Chef', description: 'Supervise kitchen operations', department: 'Kitchen', hourlyRate: '$28.00', isActive: true },
      { tenantId: 'acme-corp', title: 'Restaurant Manager', description: 'Oversee daily restaurant operations', department: 'Management', hourlyRate: '$35.00', isActive: true },
      // Beta LLC Roles
      { tenantId: 'beta-llc', title: 'Warehouse Associate', description: 'Handle inventory and order fulfillment', department: 'Warehouse', hourlyRate: '$17.00', isActive: true },
      { tenantId: 'beta-llc', title: 'Forklift Operator', description: 'Operate forklift and heavy equipment', department: 'Warehouse', hourlyRate: '$21.00', isActive: true },
      { tenantId: 'beta-llc', title: 'Delivery Driver', description: 'Transport goods to customer locations', department: 'Transportation', hourlyRate: '$19.00', isActive: true },
      { tenantId: 'beta-llc', title: 'Logistics Coordinator', description: 'Coordinate shipments and schedules', department: 'Transportation', hourlyRate: '$24.00', isActive: true },
      { tenantId: 'beta-llc', title: 'Administrative Assistant', description: 'Provide administrative support', department: 'Administration', hourlyRate: '$18.00', isActive: true },
      { tenantId: 'beta-llc', title: 'Operations Supervisor', description: 'Supervise warehouse operations', department: 'Warehouse', hourlyRate: '$30.00', isActive: true }
    ]);

    // Seed Operating Hours
    console.log('⏰ Seeding operating hours...');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Acme Corp Operating Hours (Restaurant)
    for (const day of days) {
      const isWeekend = day === 'sunday';
      await db.insert(operatingHours).values({
        tenantId: 'acme-corp',
        dayOfWeek: day as any,
        openTime: isWeekend ? '10:00' : '11:00',
        closeTime: isWeekend ? '22:00' : '23:00',
        isOpen: true,
        breakStartTime: '15:00',
        breakEndTime: '16:00',
        notes: isWeekend ? 'Sunday brunch menu available' : null
      });
    }

    // Beta LLC Operating Hours (Warehouse - Closed Sunday)
    for (const day of days) {
      const isSunday = day === 'sunday';
      const isSaturday = day === 'saturday';
      await db.insert(operatingHours).values({
        tenantId: 'beta-llc',
        dayOfWeek: day as any,
        openTime: isSunday ? null : (isSaturday ? '08:00' : '06:00'),
        closeTime: isSunday ? null : (isSaturday ? '16:00' : '20:00'),
        isOpen: !isSunday,
        breakStartTime: isSunday ? null : '12:00',
        breakEndTime: isSunday ? null : '13:00',
        notes: isSunday ? 'Closed on Sundays' : null
      });
    }

    // Seed Schedule Templates
    console.log('📋 Seeding schedule templates...');
    await db.insert(scheduleTemplates).values([
      // Acme Corp Templates
      {
        tenantId: 'acme-corp',
        name: 'Lunch Service',
        description: 'Standard lunch shift template',
        positions: ['Server', 'Host/Hostess', 'Line Cook'],
        assignmentType: 'assigned',
        requiredStaffPerPosition: 2,
        recurrence: 'daily',
        isActive: true,
        createdBy: 1
      },
      {
        tenantId: 'acme-corp',
        name: 'Dinner Service',
        description: 'Evening dinner shift template',
        positions: ['Server', 'Bartender', 'Line Cook', 'Sous Chef'],
        assignmentType: 'assigned',
        requiredStaffPerPosition: 3,
        recurrence: 'daily',
        isActive: true,
        createdBy: 1
      },
      // Beta LLC Templates
      {
        tenantId: 'beta-llc',
        name: 'Morning Warehouse',
        description: 'Early morning warehouse operations',
        positions: ['Warehouse Associate', 'Forklift Operator'],
        assignmentType: 'assigned',
        requiredStaffPerPosition: 4,
        recurrence: 'weekdays',
        isActive: true,
        createdBy: 7
      },
      {
        tenantId: 'beta-llc',
        name: 'Delivery Routes',
        description: 'Daily delivery schedule',
        positions: ['Delivery Driver', 'Logistics Coordinator'],
        assignmentType: 'assigned',
        requiredStaffPerPosition: 2,
        recurrence: 'weekdays',
        isActive: true,
        createdBy: 7
      }
    ]);

    // Generate realistic shifts for the past month
    console.log('📅 Seeding shifts...');
    const today = new Date();
    const shifts_data = [];
    
    // Generate 20 shifts per tenant over past 30 days
    for (let i = 0; i < 20; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const shiftDate = new Date(today);
      shiftDate.setDate(shiftDate.getDate() - daysAgo);
      
      // Acme Corp shifts
      const acmeStatuses = ['open', 'assigned', 'claimed', 'clocked_in', 'completed'];
      const acmeRoles = ['Server', 'Bartender', 'Line Cook', 'Host/Hostess'];
      const acmeStaffIds = [2, 3, 4, 5, 6];
      
      shifts_data.push({
        tenantId: 'acme-corp',
        date: shiftDate.toISOString().split('T')[0],
        startTime: Math.random() > 0.5 ? '11:00' : '17:00',
        endTime: Math.random() > 0.5 ? '15:00' : '23:00',
        role: acmeRoles[Math.floor(Math.random() * acmeRoles.length)],
        description: 'Restaurant service shift',
        location: 'Main Dining Room',
        status: acmeStatuses[Math.floor(Math.random() * acmeStatuses.length)] as any,
        assignmentType: 'assigned' as any,
        requiredStaff: 1,
        assignedTo: Math.random() > 0.3 ? acmeStaffIds[Math.floor(Math.random() * acmeStaffIds.length)] : null,
        claimedBy: null,
        templateId: null,
        createdBy: 1,
        notes: Math.random() > 0.7 ? 'Special event shift' : null
      });
      
      // Beta LLC shifts
      const betaStatuses = ['open', 'assigned', 'claimed', 'clocked_in', 'completed'];
      const betaRoles = ['Warehouse Associate', 'Forklift Operator', 'Delivery Driver'];
      const betaStaffIds = [8, 9, 10, 11, 12];
      
      shifts_data.push({
        tenantId: 'beta-llc',
        date: shiftDate.toISOString().split('T')[0],
        startTime: Math.random() > 0.5 ? '06:00' : '14:00',
        endTime: Math.random() > 0.5 ? '14:00' : '20:00',
        role: betaRoles[Math.floor(Math.random() * betaRoles.length)],
        description: 'Warehouse operations shift',
        location: 'Main Warehouse',
        status: betaStatuses[Math.floor(Math.random() * betaStatuses.length)] as any,
        assignmentType: 'assigned' as any,
        requiredStaff: 1,
        assignedTo: Math.random() > 0.3 ? betaStaffIds[Math.floor(Math.random() * betaStaffIds.length)] : null,
        claimedBy: null,
        templateId: null,
        createdBy: 7,
        notes: Math.random() > 0.8 ? 'Overtime shift' : null
      });
    }
    
    await db.insert(shifts).values(shifts_data);

    // Seed Holiday Requests
    console.log('🏖️ Seeding holiday requests...');
    await db.insert(holidayRequests).values([
      // Acme Corp Holiday Requests
      {
        tenantId: 'acme-corp',
        userId: '2',
        startDate: '2025-07-15',
        endDate: '2025-07-17',
        reason: 'Family vacation',
        status: 'approved',
        requestedAt: new Date('2025-06-15'),
        reviewedAt: new Date('2025-06-16'),
        reviewedBy: '1',
        notes: 'Approved - adequate coverage arranged'
      },
      {
        tenantId: 'acme-corp',
        userId: '3',
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        reason: 'Wedding attendance',
        status: 'pending',
        requestedAt: new Date('2025-07-01'),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      },
      {
        tenantId: 'acme-corp',
        userId: '4',
        startDate: '2025-06-20',
        endDate: '2025-06-22',
        reason: 'Personal time off',
        status: 'declined',
        requestedAt: new Date('2025-06-10'),
        reviewedAt: new Date('2025-06-12'),
        reviewedBy: '1',
        notes: 'Declined - peak season, insufficient coverage'
      },
      // Beta LLC Holiday Requests
      {
        tenantId: 'beta-llc',
        userId: '8',
        startDate: '2025-07-10',
        endDate: '2025-07-14',
        reason: 'Summer vacation',
        status: 'approved',
        requestedAt: new Date('2025-06-10'),
        reviewedAt: new Date('2025-06-11'),
        reviewedBy: '7',
        notes: 'Approved with temporary replacement scheduled'
      },
      {
        tenantId: 'beta-llc',
        userId: '9',
        startDate: '2025-08-15',
        endDate: '2025-08-16',
        reason: 'Medical appointment',
        status: 'pending',
        requestedAt: new Date('2025-07-02'),
        reviewedAt: null,
        reviewedBy: null,
        notes: null
      },
      {
        tenantId: 'beta-llc',
        userId: '10',
        startDate: '2025-06-25',
        endDate: '2025-06-25',
        reason: 'Sick day',
        status: 'approved',
        requestedAt: new Date('2025-06-24'),
        reviewedAt: new Date('2025-06-24'),
        reviewedBy: '7',
        notes: 'Emergency sick leave approved'
      }
    ]);

    // Seed Time Entries (for completed shifts)
    console.log('⏱️ Seeding time entries...');
    const timeEntries_data = [];
    
    // Generate time entries for some completed shifts
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 14); // Last 2 weeks
      const entryDate = new Date(today);
      entryDate.setDate(entryDate.getDate() - daysAgo);
      
      const startHour = 8 + Math.floor(Math.random() * 4); // 8-11 AM start
      const duration = 6 + Math.floor(Math.random() * 4); // 6-9 hour shifts
      
      const clockInTime = new Date(entryDate);
      clockInTime.setHours(startHour, 0, 0, 0);
      
      const clockOutTime = new Date(clockInTime);
      clockOutTime.setHours(clockInTime.getHours() + duration);
      
      // Break times
      const breakStart = new Date(clockInTime);
      breakStart.setHours(clockInTime.getHours() + 3); // 3 hours after start
      const breakEnd = new Date(breakStart);
      breakEnd.setMinutes(breakStart.getMinutes() + 30); // 30 min break
      
      const tenantId = Math.random() > 0.5 ? 'acme-corp' : 'beta-llc';
      const staffIds = tenantId === 'acme-corp' ? [2, 3, 4, 5, 6] : [8, 9, 10, 11, 12];
      
      timeEntries_data.push({
        tenantId,
        userId: staffIds[Math.floor(Math.random() * staffIds.length)].toString(),
        date: entryDate.toISOString().split('T')[0],
        clockInTime,
        clockOutTime,
        breakStartTime: Math.random() > 0.3 ? breakStart : null,
        breakEndTime: Math.random() > 0.3 ? breakEnd : null,
        totalHours: duration - (Math.random() > 0.3 ? 0.5 : 0), // Subtract break time
        notes: Math.random() > 0.8 ? 'Overtime shift' : null,
        status: 'completed' as any
      });
    }
    
    await db.insert(timeEntries).values(timeEntries_data);

    console.log('✅ Database seed completed successfully!');
    console.log(`Created:`);
    console.log(`- 12 users (2 tenants)`);
    console.log(`- 2 business profiles`);
    console.log(`- 7 departments`);
    console.log(`- 7 locations`);
    console.log(`- 12 job roles`);
    console.log(`- 14 operating hours entries`);
    console.log(`- 4 schedule templates`);
    console.log(`- 40 shifts`);
    console.log(`- 6 holiday requests`);
    console.log(`- 15 time entries`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seed process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seed process failed:', error);
      process.exit(1);
    });
}

export default seed;