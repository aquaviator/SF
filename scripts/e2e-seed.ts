import { db } from "../server/db";
import {
  users,
  businessProfiles,
  shiftPolicies,
  shifts,
  timeEntries,
  staffStrikes,
  holidayRequests,
  jobRoles,
  locations,
  holidayEntitlements,
  type InsertUser,
  type InsertBusinessProfile,
  type InsertShiftPolicy,
  type InsertShift,
  type InsertTimeEntry,
  type InsertStaffStrike,
  type InsertHolidayRequest,
  type InsertJobRole,
  type InsertLocation,
  type InsertHolidayEntitlement,
} from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Complete End-to-End Seed Script
 * Populates database with realistic multi-tenant business data
 */
async function e2eSeed() {
  console.log("🧹 Starting complete database reset...");

  // Step 1: Truncate all tables and reset sequences
  const tables = [
    "staff_strikes",
    "time_entries", 
    "holiday_entitlements",
    "holiday_requests",
    "shifts",
    "shift_policies", 
    "locations",
    "job_roles",
    "business_profiles",
    "users"
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`));
      console.log(`✅ Truncated ${table}`);
    } catch (error) {
      console.log(`⚠️  Table ${table} may not exist, continuing...`);
    }
  }

  // Step 2: Create two businesses with distinct tenant IDs
  const businessData: InsertBusinessProfile[] = [
    {
      tenantId: "acme-corp",
      name: "Acme Corporation Restaurant",
      description: "Fine dining restaurant with multiple service areas",
      ownerName: "Sarah Johnson", 
      address: "123 Main Street, Downtown",
      phone: "+1-555-0123",
      email: "contact@acme-corp.com",
      website: "https://acme-corp.com",
      businessType: "Restaurant",
      timezone: "America/New_York",
    },
    {
      tenantId: "globex-ltd",
      name: "Globex Ltd Security Services", 
      description: "Professional security and surveillance services",
      ownerName: "Marcus Williams",
      address: "456 Business Park, Corporate District", 
      phone: "+1-555-0456",
      email: "info@globex-ltd.com",
      website: "https://globex-ltd.com",
      businessType: "Security",
      timezone: "America/New_York",
    },
  ];

  console.log("🏢 Creating businesses...");
  const insertedBusinesses = await db.insert(businessProfiles).values(businessData).returning();
  console.log(`✅ Created ${insertedBusinesses.length} businesses`);

  // Step 3: Create realistic shift policies for each business
  const policyData: InsertShiftPolicy[] = [
    {
      tenantId: "acme-corp",
      minNoticeHours: 24,
      maxAdvanceBookingDays: 14,
      allowSwaps: true,
      requireApproval: false,
      maxStrikePoints: 6,
      resetPeriodDays: 90,
      lateGracePeriodMinutes: 10,
      clockInBufferMinutes: 15,
      clockOutBufferMinutes: 30,
    },
    {
      tenantId: "globex-ltd", 
      minNoticeHours: 48,
      maxAdvanceBookingDays: 21,
      allowSwaps: true,
      requireApproval: true,
      maxStrikePoints: 3,
      resetPeriodDays: 60,
      lateGracePeriodMinutes: 5,
      clockInBufferMinutes: 10,
      clockOutBufferMinutes: 15,
    },
  ];

  console.log("📋 Creating shift policies...");
  const insertedPolicies = await db.insert(shiftPolicies).values(policyData).returning();
  console.log(`✅ Created ${insertedPolicies.length} shift policies`);

  // Step 4: Create job roles for each business
  const jobRoleData: InsertJobRole[] = [
    // Acme Corp Restaurant roles
    {
      tenantId: "acme-corp",
      title: "Head Chef",
      description: "Lead kitchen operations and food preparation",
      hourlyRate: "28.50",
      responsibilities: ["Menu planning", "Kitchen supervision", "Quality control"],
      requirements: ["Culinary degree", "5+ years experience"],
      legendLabel: "Chef",
      legendColor: "#e74c3c",
      legendIcon: "chef-hat",
    },
    {
      tenantId: "acme-corp", 
      title: "Server",
      description: "Customer service and table management",
      hourlyRate: "15.00",
      responsibilities: ["Take orders", "Serve food", "Process payments"],
      requirements: ["Customer service experience"],
      legendLabel: "Server",
      legendColor: "#3498db", 
      legendIcon: "utensils",
    },
    {
      tenantId: "acme-corp",
      title: "Bartender", 
      description: "Beverage preparation and bar management",
      hourlyRate: "18.00",
      responsibilities: ["Mix drinks", "Manage bar inventory", "Check IDs"],
      requirements: ["Bartending certification", "21+ years old"],
      legendLabel: "Bartender",
      legendColor: "#9b59b6",
      legendIcon: "wine-glass",
    },
    {
      tenantId: "acme-corp",
      title: "Manager",
      description: "Shift supervision and team leadership", 
      hourlyRate: "25.00",
      responsibilities: ["Staff supervision", "Customer escalations", "Daily reports"],
      requirements: ["Management experience", "Leadership skills"],
      legendLabel: "Manager",
      legendColor: "#f39c12",
      legendIcon: "users",
    },
    // Globex Ltd Security roles
    {
      tenantId: "globex-ltd",
      title: "Security Guard",
      description: "Patrol and surveillance duties",
      hourlyRate: "22.00", 
      responsibilities: ["Site patrol", "Monitor cameras", "Incident reports"],
      requirements: ["Security license", "Clean background check"],
      legendLabel: "Guard",
      legendColor: "#2c3e50",
      legendIcon: "shield",
    },
    {
      tenantId: "globex-ltd",
      title: "Supervisor",
      description: "Team leadership and coordination",
      hourlyRate: "28.00",
      responsibilities: ["Team oversight", "Client relations", "Schedule management"],
      requirements: ["Leadership experience", "Security background"],
      legendLabel: "Supervisor", 
      legendColor: "#27ae60",
      legendIcon: "user-check",
    },
    {
      tenantId: "globex-ltd",
      title: "Specialist",
      description: "Advanced security operations",
      hourlyRate: "32.00",
      responsibilities: ["Advanced surveillance", "Emergency response", "Training"],
      requirements: ["Specialized training", "5+ years experience"],
      legendLabel: "Specialist",
      legendColor: "#8e44ad",
      legendIcon: "eye",
    },
  ];

  console.log("👔 Creating job roles...");
  const insertedJobRoles = await db.insert(jobRoles).values(jobRoleData).returning();
  console.log(`✅ Created ${insertedJobRoles.length} job roles`);

  // Step 5: Create locations for each business
  const locationData: InsertLocation[] = [
    // Acme Corp locations
    {
      tenantId: "acme-corp",
      name: "Main Dining Room",
      address: "123 Main Street, Downtown",
      description: "Primary dining area with 40 tables",
    },
    {
      tenantId: "acme-corp", 
      name: "Private Dining",
      address: "123 Main Street, Downtown",
      description: "Exclusive dining room for events",
    },
    {
      tenantId: "acme-corp",
      name: "Bar Area", 
      address: "123 Main Street, Downtown",
      description: "Full service bar with lounge seating",
    },
    // Globex Ltd locations
    {
      tenantId: "globex-ltd",
      name: "Corporate Plaza",
      address: "456 Business Park, Corporate District",
      description: "Main office building security",
    },
    {
      tenantId: "globex-ltd",
      name: "Warehouse District",
      address: "789 Industrial Way, Warehouse District", 
      description: "Industrial complex security",
    },
  ];

  console.log("📍 Creating locations...");
  const insertedLocations = await db.insert(locations).values(locationData).returning();
  console.log(`✅ Created ${insertedLocations.length} locations`);

  // Step 6: Create users for each business
  const userData: InsertUser[] = [
    // Acme Corp users
    {
      tenantId: "acme-corp",
      username: "sarah.johnson",
      password: "password123",
      role: "owner",
      firstName: "Sarah",
      lastName: "Johnson", 
      email: "sarah@acme-corp.com",
      phone: "+1-555-0100",
      isActive: true,
      hireDate: "2020-01-15",
      address: "789 Owner Lane",
      emergencyContactName: "John Johnson",
      emergencyContactPhone: "+1-555-0101",
    },
    {
      tenantId: "acme-corp",
      username: "mike.chen",
      password: "password123", 
      role: "staff",
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@acme-corp.com",
      phone: "+1-555-0201",
      isActive: true,
      hireDate: "2022-03-10",
      address: "123 Chef Street",
      emergencyContactName: "Lisa Chen",
      emergencyContactPhone: "+1-555-0202",
    },
    {
      tenantId: "acme-corp",
      username: "emma.davis",
      password: "password123",
      role: "staff", 
      firstName: "Emma",
      lastName: "Davis",
      email: "emma.davis@acme-corp.com",
      phone: "+1-555-0301",
      isActive: true,
      hireDate: "2023-05-20",
      address: "456 Server Ave",
      emergencyContactName: "Tom Davis",
      emergencyContactPhone: "+1-555-0302",
    },
    {
      tenantId: "acme-corp",
      username: "alex.martinez",
      password: "password123",
      role: "staff",
      firstName: "Alex", 
      lastName: "Martinez",
      email: "alex.martinez@acme-corp.com",
      phone: "+1-555-0401",
      isActive: true,
      hireDate: "2022-11-08",
      address: "789 Bartender Blvd",
      emergencyContactName: "Maria Martinez",
      emergencyContactPhone: "+1-555-0402",
    },
    {
      tenantId: "acme-corp",
      username: "jamie.wilson",
      password: "password123",
      role: "staff",
      firstName: "Jamie",
      lastName: "Wilson",
      email: "jamie.wilson@acme-corp.com", 
      phone: "+1-555-0501",
      isActive: true,
      hireDate: "2021-09-12",
      address: "321 Manager Road",
      emergencyContactName: "Sam Wilson",
      emergencyContactPhone: "+1-555-0502",
    },
    {
      tenantId: "acme-corp",
      username: "taylor.brown",
      password: "password123",
      role: "staff",
      firstName: "Taylor",
      lastName: "Brown",
      email: "taylor.brown@acme-corp.com",
      phone: "+1-555-0601", 
      isActive: true,
      hireDate: "2023-08-14",
      address: "654 Staff Street",
      emergencyContactName: "Kelly Brown",
      emergencyContactPhone: "+1-555-0602",
    },
    // Globex Ltd users
    {
      tenantId: "globex-ltd",
      username: "marcus.williams",
      password: "password123",
      role: "owner",
      firstName: "Marcus",
      lastName: "Williams",
      email: "marcus@globex-ltd.com",
      phone: "+1-555-1100",
      isActive: true,
      hireDate: "2019-06-01",
      address: "987 Executive Drive",
      emergencyContactName: "Linda Williams", 
      emergencyContactPhone: "+1-555-1101",
    },
    {
      tenantId: "globex-ltd",
      username: "david.garcia",
      password: "password123",
      role: "staff",
      firstName: "David",
      lastName: "Garcia",
      email: "david.garcia@globex-ltd.com",
      phone: "+1-555-1201",
      isActive: true,
      hireDate: "2021-04-15",
      address: "123 Security Lane",
      emergencyContactName: "Rosa Garcia",
      emergencyContactPhone: "+1-555-1202",
    },
    {
      tenantId: "globex-ltd",
      username: "lisa.anderson",
      password: "password123",
      role: "staff",
      firstName: "Lisa",
      lastName: "Anderson", 
      email: "lisa.anderson@globex-ltd.com",
      phone: "+1-555-1301",
      isActive: true,
      hireDate: "2022-07-20",
      address: "456 Guard Way",
      emergencyContactName: "Robert Anderson",
      emergencyContactPhone: "+1-555-1302",
    },
    {
      tenantId: "globex-ltd",
      username: "james.lopez",
      password: "password123",
      role: "staff",
      firstName: "James",
      lastName: "Lopez",
      email: "james.lopez@globex-ltd.com",
      phone: "+1-555-1401",
      isActive: true,
      hireDate: "2020-12-10",
      address: "789 Supervisor St",
      emergencyContactName: "Ana Lopez",
      emergencyContactPhone: "+1-555-1402",
    },
    {
      tenantId: "globex-ltd",
      username: "sarah.kim",
      password: "password123",
      role: "staff",
      firstName: "Sarah",
      lastName: "Kim",
      email: "sarah.kim@globex-ltd.com",
      phone: "+1-555-1501",
      isActive: true,
      hireDate: "2023-01-25",
      address: "321 Specialist Ave",
      emergencyContactName: "Daniel Kim",
      emergencyContactPhone: "+1-555-1502",
    },
  ];

  console.log("👥 Creating users...");
  const insertedUsers = await db.insert(users).values(userData).returning();
  console.log(`✅ Created ${insertedUsers.length} users`);

  // Step 7: Create holiday entitlements for staff
  const staffUsers = insertedUsers.filter(user => user.role === "staff");
  const currentYear = new Date().getFullYear();
  const entitlementData: InsertHolidayEntitlement[] = staffUsers.map(user => ({
    tenantId: user.tenantId,
    userId: user.id,
    entitlementDays: 25, // Default 25 days annual leave
    usedDays: Math.floor(Math.random() * 8), // 0-7 days used
    pendingDays: Math.floor(Math.random() * 3), // 0-2 days pending  
    year: currentYear, // Current year
  }));

  console.log("🏖️ Creating holiday entitlements...");
  const insertedEntitlements = await db.insert(holidayEntitlements).values(entitlementData).returning();
  console.log(`✅ Created ${insertedEntitlements.length} holiday entitlements`);

  // Step 8: Generate shifts for past 60 days and next 30 days
  const today = new Date();
  const shifts90Days: InsertShift[] = [];
  
  // Helper to get a random staff member for a tenant
  const getRandomStaff = (tenantId: string) => {
    const tenantStaff = staffUsers.filter(user => user.tenantId === tenantId);
    return tenantStaff[Math.floor(Math.random() * tenantStaff.length)];
  };

  // Helper to get job roles for a tenant
  const getTenantJobRoles = (tenantId: string) => {
    return insertedJobRoles.filter(role => role.tenantId === tenantId);
  };

  // Helper to get locations for a tenant
  const getTenantLocations = (tenantId: string) => {
    return insertedLocations.filter(loc => loc.tenantId === tenantId);
  };

  console.log("📅 Generating shifts for 90 days...");
  
  // Generate for both businesses
  for (const business of insertedBusinesses) {
    const tenantJobRoles = getTenantJobRoles(business.tenantId);
    const tenantLocations = getTenantLocations(business.tenantId);
    const tenantStaff = staffUsers.filter(user => user.tenantId === business.tenantId);

    // Generate 90 days of shifts (60 past + 30 future)
    for (let dayOffset = -60; dayOffset <= 30; dayOffset++) {
      const shiftDate = new Date(today);
      shiftDate.setDate(today.getDate() + dayOffset);
      
      // Generate 3-5 shifts per day
      const shiftsPerDay = 3 + Math.floor(Math.random() * 3);
      
      for (let shiftNum = 0; shiftNum < shiftsPerDay; shiftNum++) {
        const staff = getRandomStaff(business.tenantId);
        const jobRole = tenantJobRoles[Math.floor(Math.random() * tenantJobRoles.length)];
        const location = tenantLocations[Math.floor(Math.random() * tenantLocations.length)];
        
        // Different shift patterns
        let startTime: string, endTime: string;
        if (shiftNum === 0) {
          startTime = "08:00";
          endTime = "16:00";
        } else if (shiftNum === 1) {
          startTime = "16:00"; 
          endTime = "00:00";
        } else {
          startTime = "00:00";
          endTime = "08:00";
        }

        // Determine shift status based on date
        let status: "assigned" | "confirmed" | "completed" | "cancelled" | "clocked_in" | "clocked_out";
        if (dayOffset < 0) {
          // Past shifts - mostly completed
          const rand = Math.random();
          if (rand < 0.8) status = "completed";
          else if (rand < 0.9) status = "clocked_out"; 
          else status = "cancelled";
        } else if (dayOffset === 0) {
          // Today's shifts - mix of statuses
          const rand = Math.random();
          if (rand < 0.3) status = "clocked_in";
          else if (rand < 0.6) status = "confirmed";
          else status = "assigned";
        } else {
          // Future shifts
          status = Math.random() < 0.7 ? "confirmed" : "assigned";
        }

        shifts90Days.push({
          tenantId: business.tenantId,
          date: shiftDate.toISOString().split('T')[0],
          startTime,
          endTime,
          role: jobRole.title,
          location: location.name,
          assignedTo: staff?.id || null,
          status,
          title: `${jobRole.title} - ${location.name}`,
          description: `${jobRole.title} shift at ${location.name}`,
          createdBy: insertedUsers.find(u => u.tenantId === business.tenantId && u.role === "owner")?.id || 1,
        });
      }
    }
  }

  // Insert shifts in batches to avoid memory issues
  const batchSize = 100;
  let totalShifts = 0;
  for (let i = 0; i < shifts90Days.length; i += batchSize) {
    const batch = shifts90Days.slice(i, i + batchSize);
    const insertedBatch = await db.insert(shifts).values(batch).returning();
    totalShifts += insertedBatch.length;
    if (i % 500 === 0) {
      console.log(`📊 Inserted ${totalShifts} shifts so far...`);
    }
  }
  console.log(`✅ Created ${totalShifts} total shifts`);

  // Step 9: Get all shifts for time entry generation
  const allShifts = await db.select().from(shifts);
  const pastShifts = allShifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    return shiftDate < today && shift.assignedTo;
  });

  console.log("⏰ Generating time entries for past shifts...");
  
  const timeEntryData: InsertTimeEntry[] = [];
  
  for (const shift of pastShifts) {
    const shiftDate = shift.date;
    const shiftStart = new Date(`${shiftDate} ${shift.startTime}`);
    const shiftEnd = new Date(`${shiftDate} ${shift.endTime}`);
    
    // Handle overnight shifts
    if (shiftEnd <= shiftStart) {
      shiftEnd.setDate(shiftEnd.getDate() + 1);
    }

    const rand = Math.random();
    
    // Skip 10% - these will become no-show strikes
    if (rand < 0.1) continue;
    
    let clockInTime: string;
    let clockOutTime: string | null = null;
    let lateBy = 0;
    
    // 60% on-time, 20% late, 10% missing already handled above
    if (rand < 0.7) {
      // On-time check-in (within 15 minutes early to 5 minutes late)
      const variance = -15 + Math.random() * 20; // -15 to +5 minutes
      const actualClockIn = new Date(shiftStart.getTime() + variance * 60000);
      clockInTime = actualClockIn.toTimeString().slice(0, 5);
      lateBy = Math.max(0, variance);
    } else {
      // Late check-in (5-30 minutes late)
      const lateMinutes = 5 + Math.random() * 25;
      const actualClockIn = new Date(shiftStart.getTime() + lateMinutes * 60000);
      clockInTime = actualClockIn.toTimeString().slice(0, 5);
      lateBy = lateMinutes;
    }
    
    // Clock out logic: 70% on-time, 20% early, 10% missing
    const clockOutRand = Math.random();
    if (clockOutRand < 0.9) { // 90% have clock out
      let actualClockOut: Date;
      if (clockOutRand < 0.7) {
        // On-time clock out (within 30 minutes of end time)
        const variance = -15 + Math.random() * 45; // -15 to +30 minutes
        actualClockOut = new Date(shiftEnd.getTime() + variance * 60000);
      } else {
        // Early clock out (15-60 minutes early)
        const earlyMinutes = 15 + Math.random() * 45;
        actualClockOut = new Date(shiftEnd.getTime() - earlyMinutes * 60000);
      }
      clockOutTime = actualClockOut.toTimeString().slice(0, 5);
    }
    
    // Calculate total hours if both times exist
    let totalHours = 0;
    if (clockOutTime) {
      const clockInDateTime = new Date(`${shiftDate} ${clockInTime}`);
      let clockOutDateTime = new Date(`${shiftDate} ${clockOutTime}`);
      
      // Handle overnight shifts
      if (clockOutDateTime <= clockInDateTime) {
        clockOutDateTime.setDate(clockOutDateTime.getDate() + 1);
      }
      
      totalHours = (clockOutDateTime.getTime() - clockInDateTime.getTime()) / (1000 * 60 * 60);
    }

    // Create full timestamp objects
    const clockInDateTime = new Date(`${shiftDate} ${clockInTime}`);
    let clockOutDateTime = clockOutTime ? new Date(`${shiftDate} ${clockOutTime}`) : null;
    
    // Handle overnight clock out
    if (clockOutDateTime && clockOutDateTime <= clockInDateTime) {
      clockOutDateTime.setDate(clockOutDateTime.getDate() + 1);
    }

    timeEntryData.push({
      tenantId: shift.tenantId,
      userId: shift.assignedTo!,
      shiftId: shift.id,
      clockInTime: clockInDateTime,
      clockOutTime: clockOutDateTime,
      totalHours: totalHours.toString(),
      lateByMinutes: Math.round(lateBy),
      status: clockOutTime ? "clocked_out" : "clocked_in",
      notes: lateBy > 10 ? `Late by ${Math.round(lateBy)} minutes` : null,
    });
  }

  // Insert time entries in batches
  let totalTimeEntries = 0;
  for (let i = 0; i < timeEntryData.length; i += batchSize) {
    const batch = timeEntryData.slice(i, i + batchSize);
    const insertedBatch = await db.insert(timeEntries).values(batch).returning();
    totalTimeEntries += insertedBatch.length;
    if (i % 500 === 0) {
      console.log(`⏱️  Inserted ${totalTimeEntries} time entries so far...`);
    }
  }
  console.log(`✅ Created ${totalTimeEntries} time entries`);

  // Step 10: Generate strikes based on missing shifts and policy violations
  console.log("🚨 Generating strikes based on violations...");
  
  const strikeData: InsertStaffStrike[] = [];
  const policies = await db.select().from(shiftPolicies);
  
  // No-show strikes (shifts with no time entries)
  const shiftsWithTimeEntries = new Set(timeEntryData.map(te => te.shiftId));
  const noShowShifts = pastShifts.filter(shift => !shiftsWithTimeEntries.has(shift.id));
  
  for (const shift of noShowShifts) {
    const policy = policies.find(p => p.tenantId === shift.tenantId);
    if (!policy) continue;
    
    const strikeDate = new Date(shift.date);
    const expiryDate = new Date(strikeDate);
    expiryDate.setDate(expiryDate.getDate() + policy.resetPeriodDays);
    
    strikeData.push({
      tenantId: shift.tenantId,
      userId: shift.assignedTo!,
      points: 2, // No-show = 2 points
      reason: "No Show",
      description: `Failed to show up for ${shift.role} shift on ${shift.date}`,
      shiftId: shift.id,
      issuedAt: strikeDate,
      expiresAt: expiryDate,
      isActive: expiryDate > today,
    });
  }
  
  // Late arrival strikes (late by more than grace period)
  for (const timeEntry of timeEntryData) {
    const shift = allShifts.find(s => s.id === timeEntry.shiftId);
    const policy = policies.find(p => p.tenantId === timeEntry.tenantId);
    if (!shift || !policy || !timeEntry.lateBy) continue;
    
    if (timeEntry.lateBy > policy.lateGracePeriodMinutes) {
      const strikeDate = new Date(timeEntry.date);
      const expiryDate = new Date(strikeDate);
      expiryDate.setDate(expiryDate.getDate() + policy.resetPeriodDays);
      
      strikeData.push({
        tenantId: timeEntry.tenantId,
        userId: timeEntry.userId,
        points: 1, // Late arrival = 1 point
        reason: "Late Arrival",
        description: `Late by ${timeEntry.lateBy} minutes for ${shift.role} shift`,
        shiftId: shift.id,
        issuedAt: strikeDate.toISOString(),
        expiresAt: expiryDate.toISOString(),
        isActive: expiryDate > today,
      });
    }
  }

  if (strikeData.length > 0) {
    const insertedStrikes = await db.insert(staffStrikes).values(strikeData).returning();
    console.log(`✅ Created ${insertedStrikes.length} strikes`);
  } else {
    console.log(`✅ No strikes needed`);
  }

  // Step 11: Generate holiday requests
  console.log("🏖️ Creating holiday requests...");
  
  const holidayRequestData: InsertHolidayRequest[] = [];
  
  for (const business of insertedBusinesses) {
    const tenantStaff = staffUsers.filter(user => user.tenantId === business.tenantId);
    
    // Create 2-3 requests per business
    const requestCount = 2 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < requestCount; i++) {
      const staff = tenantStaff[Math.floor(Math.random() * tenantStaff.length)];
      const requestDate = new Date(today);
      requestDate.setDate(today.getDate() - Math.floor(Math.random() * 60)); // Past 60 days
      
      const startDate = new Date(requestDate);
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30)); // Future date
      
      const duration = 1 + Math.floor(Math.random() * 5); // 1-5 days
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + duration - 1);
      
      const statuses = ["pending", "approved", "rejected"];
      const types = ["vacation", "sick", "personal", "emergency"];
      
      holidayRequestData.push({
        tenantId: business.tenantId,
        requesterId: staff.id,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        reason: `${duration} day ${types[Math.floor(Math.random() * types.length)]} request`,
        status: statuses[Math.floor(Math.random() * statuses.length)] as "pending" | "approved" | "rejected",
        requestedAt: requestDate,
        type: types[Math.floor(Math.random() * types.length)] as "vacation" | "sick" | "personal" | "emergency",
        totalDays: duration,
      });
    }
  }

  if (holidayRequestData.length > 0) {
    const insertedRequests = await db.insert(holidayRequests).values(holidayRequestData).returning();
    console.log(`✅ Created ${insertedRequests.length} holiday requests`);
  }

  // Step 12: Validation and summary
  console.log("\n📊 FINAL SUMMARY");
  console.log("================");
  
  const finalCounts = {
    businesses: insertedBusinesses.length,
    users: insertedUsers.length,
    jobRoles: insertedJobRoles.length,
    locations: insertedLocations.length,
    shifts: totalShifts,
    timeEntries: totalTimeEntries,
    strikes: strikeData.length,
    holidayRequests: holidayRequestData.length,
    entitlements: insertedEntitlements.length,
  };

  Object.entries(finalCounts).forEach(([key, count]) => {
    console.log(`✅ ${key}: ${count}`);
  });

  // Verify relationships
  console.log("\n🔍 RELATIONSHIP VALIDATION");
  console.log("===========================");
  
  const relationshipChecks = [
    { table: "users", field: "tenantId", valid: insertedUsers.every(u => ["acme-corp", "globex-ltd"].includes(u.tenantId)) },
    { table: "shifts", field: "assignedTo", valid: allShifts.every(s => !s.assignedTo || insertedUsers.some(u => u.id === s.assignedTo)) },
    { table: "timeEntries", field: "shiftId", valid: timeEntryData.every(te => allShifts.some(s => s.id === te.shiftId)) },
    { table: "strikes", field: "userId", valid: strikeData.every(st => insertedUsers.some(u => u.id === st.userId)) },
  ];

  relationshipChecks.forEach(check => {
    console.log(`${check.valid ? "✅" : "❌"} ${check.table}.${check.field} relationships`);
  });

  console.log("\n🎉 End-to-end seed completed successfully!");
  console.log(`💾 Database populated with realistic multi-tenant data`);
  console.log(`🏢 Two businesses: Acme Corp (restaurant) and Globex Ltd (security)`);
  console.log(`📈 90 days of shift history with realistic time tracking and strikes`);
}

// Execute the seed script
e2eSeed()
  .then(() => {
    console.log("✅ Seed script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });