import { db } from '../server/db';
import { 
  users, shifts, timeEntries, holidayRequests, swapRequests, staffStrikes,
  businessProfiles, jobRoles, locations, operatingHours, shiftPolicies,
  holidayEntitlements, assignments
} from '../shared/schema';
import { sql } from 'drizzle-orm';

const DRY_RUN = process.argv.includes('--dry-run');

async function seed() {
  console.log(DRY_RUN ? '🧪 DRY RUN MODE - SQL will be logged only' : '🌱 SEEDING DATABASE');
  
  try {
    if (!DRY_RUN) {
      // Drop and recreate all tables
      await db.execute(sql`DROP SCHEMA public CASCADE`);
      await db.execute(sql`CREATE SCHEMA public`);
      await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);
      
      // Recreate tables (in production, use proper migrations)
      console.log('📋 Recreating tables...');
    }

    const tenants = ['democorp', 'acmeinc'];
    
    for (const tenantId of tenants) {
      console.log(`🏢 Seeding tenant: ${tenantId}`);
      
      // Business Profile
      const businessProfile = {
        tenantId,
        name: tenantId === 'democorp' ? 'Demo Corporation' : 'Acme Industries',
        ownerName: tenantId === 'democorp' ? 'Demo Owner' : 'Acme Owner',
        industry: tenantId === 'democorp' ? 'Technology' : 'Manufacturing',
        employeeCount: '50-100',
        address: `123 ${tenantId.toUpperCase()} Street`,
        phone: '+1-555-0100',
        email: `contact@${tenantId}.com`,
        website: `https://${tenantId}.com`,
        description: `Leading ${tenantId === 'democorp' ? 'technology' : 'manufacturing'} company`,
        logoUrl: null,
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h'
      };

      if (DRY_RUN) {
        console.log('INSERT INTO business_profiles:', businessProfile);
      } else {
        await db.insert(businessProfiles).values(businessProfile);
      }

      // Users (1 owner + 4 staff)
      const usersData = [
        {
          tenantId,
          username: `${tenantId}.owner`,
          password: 'password123',
          role: 'owner' as const,
          firstName: tenantId === 'democorp' ? 'Demo' : 'Acme',
          lastName: 'Owner',
          email: `owner@${tenantId}.com`,
          isActive: true,
          phone: '+1-555-0101',
          address: `789 Owner Lane`,
          dateOfBirth: null,
          hireDate: '2020-01-15',
          employeeId: 'OWN001',
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '+1-555-0102',
          photoUrl: null,
          bio: null
        },
        ...Array.from({ length: 4 }, (_, i) => ({
          tenantId,
          username: `${tenantId}.staff${i + 1}`,
          password: 'password123',
          role: 'staff' as const,
          firstName: `Staff${i + 1}`,
          lastName: 'Member',
          email: `staff${i + 1}@${tenantId}.com`,
          isActive: true,
          phone: `+1-555-010${i + 3}`,
          address: `${100 + i} Staff Street`,
          dateOfBirth: null,
          hireDate: '2023-06-01',
          employeeId: `STF00${i + 1}`,
          emergencyContactName: `Emergency${i + 1}`,
          emergencyContactPhone: `+1-555-020${i + 1}`,
          photoUrl: null,
          bio: null
        }))
      ];

      if (DRY_RUN) {
        console.log('INSERT INTO users:', usersData);
      } else {
        await db.insert(users).values(usersData);
      }

      // Job Roles
      const jobRolesData = [
        {
          tenantId,
          title: 'Manager',
          description: 'Team manager',
          hourlyRate: '25.00',
          responsibilities: ['Manage team', 'Schedule shifts'],
          requirements: ['Leadership experience'],
          isActive: true,
          legendLabel: 'MGR',
          legendColor: '#3B82F6',
          legendIcon: 'crown'
        },
        {
          tenantId,
          title: 'Associate',
          description: 'General associate',
          hourlyRate: '15.00',
          responsibilities: ['Customer service', 'Daily tasks'],
          requirements: ['High school diploma'],
          isActive: true,
          legendLabel: 'ASSOC',
          legendColor: '#10B981',
          legendIcon: 'user'
        }
      ];

      if (DRY_RUN) {
        console.log('INSERT INTO job_roles:', jobRolesData);
      } else {
        await db.insert(jobRoles).values(jobRolesData);
      }

      // Locations
      const locationsData = [
        {
          tenantId,
          name: 'Main Office',
          address: `123 Main St, ${tenantId.toUpperCase()}`,
          isActive: true
        },
        {
          tenantId,
          name: 'Branch Office',
          address: `456 Branch Ave, ${tenantId.toUpperCase()}`,
          isActive: true
        }
      ];

      if (DRY_RUN) {
        console.log('INSERT INTO locations:', locationsData);
      } else {
        await db.insert(locations).values(locationsData);
      }

      // Shift Policy
      const policyData = {
        tenantId,
        minNoticeHours: 24,
        maxAdvanceBookingDays: 30,
        autoApproveSwaps: false,
        requireManagerApproval: true,
        resetPeriodDays: 90,
        lateGracePeriodMinutes: 10,
        clockInBufferMinutes: 15,
        clockOutBufferMinutes: 30
      };

      if (DRY_RUN) {
        console.log('INSERT INTO shift_policies:', policyData);
      } else {
        await db.insert(shiftPolicies).values(policyData);
      }

      // Generate 2 months of shifts (1 past, 1 future)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
      
      for (let d = 0; d < 60; d++) {
        const shiftDate = new Date(startDate);
        shiftDate.setDate(startDate.getDate() + d);
        
        // Create 2-3 shifts per day
        const shiftsPerDay = Math.floor(Math.random() * 2) + 2;
        
        for (let s = 0; s < shiftsPerDay; s++) {
          const startHour = 8 + (s * 8); // 8AM, 4PM shifts
          const endHour = startHour + 8;
          
          const shift = {
            tenantId,
            date: shiftDate.toISOString().split('T')[0],
            role: s === 0 ? 'Manager' : 'Associate',
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${endHour.toString().padStart(2, '0')}:00`,
            location: s === 0 ? 'Main Office' : 'Branch Office',
            description: `${s === 0 ? 'Management' : 'General'} shift`,
            status: Math.random() > 0.1 ? 'assigned' : 'open',
            assignedTo: Math.random() > 0.1 ? Math.floor(Math.random() * 4) + 2 : null, // Assign to staff 2-5
            createdBy: 1,
            assignmentType: 'shift',
            maxCapacity: 1,
            currentCapacity: Math.random() > 0.1 ? 1 : 0,
            templateId: null
          };

          if (DRY_RUN) {
            console.log('INSERT INTO shifts:', shift);
          } else {
            const [insertedShift] = await db.insert(shifts).values(shift).returning();
            
            // Create time entries for past shifts
            if (shiftDate < today && shift.assignedTo) {
              const clockIn = new Date(shiftDate);
              clockIn.setHours(startHour, Math.floor(Math.random() * 15)); // Random 0-15 min late
              
              const clockOut = Math.random() > 0.05 ? new Date(shiftDate) : null;
              if (clockOut) {
                clockOut.setHours(endHour, Math.floor(Math.random() * 30)); // Random 0-30 min variation
              }

              const timeEntry = {
                tenantId,
                userId: shift.assignedTo,
                shiftId: insertedShift.id,
                clockInTime: clockIn,
                clockOutTime: clockOut,
                breakStartTime: null,
                breakEndTime: null,
                totalHours: clockOut ? 
                  ((clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)).toFixed(2) : null,
                status: clockOut ? 'clocked_out' : 'clocked_in',
                lateByMinutes: clockIn.getMinutes(),
                earlyByMinutes: null,
                scheduledStartTime: new Date(`${shift.date} ${shift.startTime}`),
                scheduledEndTime: new Date(`${shift.date} ${shift.endTime}`),
                adjustedBy: null,
                adjustedAt: null,
                adjustmentReason: null,
                notes: 'Regular shift',
                overrideNote: null,
                approvedBy: null,
                approvedAt: null
              };

              await db.insert(timeEntries).values(timeEntry);

              // Occasionally create strikes
              if (Math.random() > 0.9) {
                const strike = {
                  tenantId,
                  userId: shift.assignedTo,
                  shiftId: insertedShift.id,
                  reason: Math.random() > 0.5 ? 'late_arrival' : 'no_show',
                  points: Math.random() > 0.5 ? 1 : 2,
                  isActive: true,
                  notes: 'Automatically generated strike',
                  issuedBy: 1,
                  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
                };

                await db.insert(staffStrikes).values(strike);
              }
            }
          }
        }
      }

      // Holiday Requests
      const holidayRequestsData = Array.from({ length: 3 }, (_, i) => ({
        tenantId,
        requesterId: i + 2, // Staff members
        startDate: new Date(Date.now() + (i * 7 + 14) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + (i * 7 + 16) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: `Holiday request ${i + 1}`,
        status: i === 0 ? 'approved' : 'pending',
        type: 'vacation',
        priority: 'normal',
        reviewedBy: i === 0 ? 1 : null,
        reviewedAt: i === 0 ? new Date() : null,
        reviewNotes: i === 0 ? 'Approved' : null
      }));

      if (DRY_RUN) {
        console.log('INSERT INTO holiday_requests:', holidayRequestsData);
      } else {
        await db.insert(holidayRequests).values(holidayRequestsData);
      }

      // Holiday Entitlements
      const entitlementsData = Array.from({ length: 4 }, (_, i) => ({
        tenantId,
        userId: i + 2, // Staff members
        totalDays: 20,
        usedDays: Math.floor(Math.random() * 5),
        remainingDays: 20 - Math.floor(Math.random() * 5),
        year: new Date().getFullYear()
      }));

      if (DRY_RUN) {
        console.log('INSERT INTO holiday_entitlements:', entitlementsData);
      } else {
        await db.insert(holidayEntitlements).values(entitlementsData);
      }

      console.log(`✅ Completed seeding for ${tenantId}`);
    }

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0));
}

export { seed };