import { 
  users, shifts, holidayRequests, scheduleTemplates, businessProfiles, jobRoles, 
  locations, departments, operatingHours, shiftPolicies, analyticsReports,
  analyticsMetrics, activityLogs, subscriptions, subscriptionPlans, usageMetrics,
  invoices, billingInfo, timeEntries, performanceMetrics
} from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function completeSeed() {
  console.log("🌱 Starting comprehensive database seeding...");

  try {
    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await db.delete(performanceMetrics);
    await db.delete(timeEntries);
    await db.delete(billingInfo);
    await db.delete(invoices);
    await db.delete(usageMetrics);
    await db.delete(subscriptions);
    await db.delete(activityLogs);
    await db.delete(analyticsMetrics);
    await db.delete(analyticsReports);
    await db.delete(shiftPolicies);
    await db.delete(operatingHours);
    await db.delete(departments);
    await db.delete(locations);
    await db.delete(jobRoles);
    await db.delete(businessProfiles);
    await db.delete(scheduleTemplates);
    await db.delete(holidayRequests);
    await db.delete(shifts);
    await db.delete(users);

    // Insert subscription plans first (no dependencies)
    console.log("📋 Creating subscription plans...");
    await db.insert(subscriptionPlans).values([
      {
        id: "starter",
        name: "Starter",
        type: "starter",
        monthlyPrice: 1900, // $19.00 in cents
        annualPrice: 19000, // $190.00 in cents
        features: ["Up to 10 staff members", "100 shifts per month", "Basic reporting", "Email support"],
        staffLimit: 10,
        shiftsLimit: 100,
        storageLimit: "10GB",
        isPopular: false,
        isActive: true,
      },
      {
        id: "professional",
        name: "Professional",
        type: "professional",
        monthlyPrice: 4900, // $49.00 in cents
        annualPrice: 49000, // $490.00 in cents
        features: ["Up to 50 staff members", "Unlimited shifts", "Advanced analytics", "Priority support", "API access"],
        staffLimit: 50,
        shiftsLimit: -1,
        storageLimit: "100GB",
        isPopular: true,
        isActive: true,
      },
      {
        id: "enterprise",
        name: "Enterprise",
        type: "enterprise",
        monthlyPrice: 9900, // $99.00 in cents
        annualPrice: 99000, // $990.00 in cents
        features: ["Unlimited staff", "Unlimited shifts", "Custom integrations", "24/7 phone support", "Dedicated account manager", "Custom reporting"],
        staffLimit: -1,
        shiftsLimit: -1,
        storageLimit: "1TB",
        isPopular: false,
        isActive: true,
      },
    ]);

    // Create users for both tenants
    console.log("👥 Creating users...");
    const insertedUsers = await db.insert(users).values([
      // Acme Corp Restaurant users
      { username: "sarah.wilson", password: "password123", role: "owner", tenantId: "acme-corp", firstName: "Sarah", lastName: "Wilson", email: "sarah@acmecorp.com", isActive: true },
      { username: "mike.johnson", password: "password123", role: "staff", tenantId: "acme-corp", firstName: "Mike", lastName: "Johnson", email: "mike@acmecorp.com", isActive: true },
      { username: "lisa.chen", password: "password123", role: "staff", tenantId: "acme-corp", firstName: "Lisa", lastName: "Chen", email: "lisa@acmecorp.com", isActive: true },
      { username: "david.rodriguez", password: "password123", role: "staff", tenantId: "acme-corp", firstName: "David", lastName: "Rodriguez", email: "david@acmecorp.com", isActive: true },
      { username: "emma.thompson", password: "password123", role: "staff", tenantId: "acme-corp", firstName: "Emma", lastName: "Thompson", email: "emma@acmecorp.com", isActive: true },
      { username: "alex.kim", password: "password123", role: "staff", tenantId: "acme-corp", firstName: "Alex", lastName: "Kim", email: "alex@acmecorp.com", isActive: true },
      
      // Beta LLC Logistics users
      { username: "robert.davis", password: "password123", role: "owner", tenantId: "beta-llc", firstName: "Robert", lastName: "Davis", email: "robert@betallc.com", isActive: true },
      { username: "jennifer.martinez", password: "password123", role: "staff", tenantId: "beta-llc", firstName: "Jennifer", lastName: "Martinez", email: "jennifer@betallc.com", isActive: true },
      { username: "kevin.brown", password: "password123", role: "staff", tenantId: "beta-llc", firstName: "Kevin", lastName: "Brown", email: "kevin@betallc.com", isActive: true },
      { username: "maria.garcia", password: "password123", role: "staff", tenantId: "beta-llc", firstName: "Maria", lastName: "Garcia", email: "maria@betallc.com", isActive: true },
      { username: "james.wilson", password: "password123", role: "staff", tenantId: "beta-llc", firstName: "James", lastName: "Wilson", email: "james@betallc.com", isActive: true },
      { username: "ashley.taylor", password: "password123", role: "staff", tenantId: "beta-llc", firstName: "Ashley", lastName: "Taylor", email: "ashley@betallc.com", isActive: true },
    ]).returning();

    // Create business profiles
    console.log("🏢 Creating business profiles...");
    await db.insert(businessProfiles).values([
      {
        tenantId: "acme-corp",
        name: "Acme Corp Restaurant",
        ownerName: "Sarah Wilson",
        address: "123 Main Street, Downtown, NY 10001",
        phone: "+1 (555) 123-4567",
        email: "contact@acmecorp.com",
        website: "https://acmecorp.com",
        description: "A premium fine dining restaurant specializing in contemporary American cuisine with locally sourced ingredients.",
        businessType: "Restaurant & Food Service",
      },
      {
        tenantId: "beta-llc",
        name: "Beta LLC Logistics",
        ownerName: "Robert Davis",
        address: "456 Industrial Blvd, Warehouse District, TX 75201",
        phone: "+1 (555) 987-6543",
        email: "info@betallc.com",
        website: "https://betallc.com",
        description: "Full-service logistics and warehouse management company providing distribution solutions for retail and e-commerce.",
        businessType: "Logistics & Distribution",
      },
    ]);

    // Create subscriptions
    console.log("💳 Creating subscriptions...");
    await db.insert(subscriptions).values([
      {
        tenantId: "acme-corp",
        planId: "professional",
        status: "trial",
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        trialDaysRemaining: 15,
      },
      {
        tenantId: "beta-llc",
        planId: "enterprise",
        status: "active",
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        endDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000), // ~9 months from now
        trialDaysRemaining: null,
      },
    ]);

    // Create billing info
    console.log("💰 Creating billing info...");
    await db.insert(billingInfo).values([
      {
        tenantId: "acme-corp",
        cardLastFour: "4242",
        cardBrand: "Visa",
        expiryMonth: 12,
        expiryYear: 2026,
        cardholderName: "Sarah Wilson",
        billingAddress: "123 Main Street, Downtown, NY 10001",
        city: "New York",
        postalCode: "10001",
        country: "United States",
      },
      {
        tenantId: "beta-llc",
        cardLastFour: "5555",
        cardBrand: "Mastercard",
        expiryMonth: 8,
        expiryYear: 2027,
        cardholderName: "Beta LLC",
        billingAddress: "456 Industrial Blvd, Warehouse District, TX 75201",
        city: "Dallas",
        postalCode: "75201",
        country: "United States",
      },
    ]);

    // Create usage metrics
    console.log("📊 Creating usage metrics...");
    await db.insert(usageMetrics).values([
      {
        tenantId: "acme-corp",
        staffUsed: 6,
        shiftsUsed: 45,
        storageUsed: "12.5GB",
        recordedAt: new Date(),
      },
      {
        tenantId: "beta-llc",
        staffUsed: 6,
        shiftsUsed: 67,
        storageUsed: "24.8GB",
        recordedAt: new Date(),
      },
    ]);

    // Create invoices
    console.log("🧾 Creating invoices...");
    await db.insert(invoices).values([
      {
        tenantId: "beta-llc",
        subscriptionId: 2,
        invoiceNumber: "INV-2025-001",
        amount: 9900,
        currency: "USD",
        status: "paid",
        description: "Enterprise Plan - Monthly Subscription",
        billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: new Date(),
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        downloadUrl: "/api/invoices/INV-2025-001/download",
      },
      {
        tenantId: "beta-llc",
        subscriptionId: 2,
        invoiceNumber: "INV-2025-002",
        amount: 9900,
        currency: "USD",
        status: "pending",
        description: "Enterprise Plan - Monthly Subscription",
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        paidAt: null,
        downloadUrl: null,
      },
    ]);

    // Create job roles
    console.log("💼 Creating job roles...");
    await db.insert(jobRoles).values([
      // Acme Corp Restaurant roles
      { tenantId: "acme-corp", title: "Server", description: "Front-of-house service staff", hourlyRate: "$18.00", responsibilities: ["Take orders", "Serve food", "Customer service"], requirements: ["1+ years experience", "Food safety cert"], isActive: true },
      { tenantId: "acme-corp", title: "Bartender", description: "Bar service and cocktail preparation", hourlyRate: "$22.00", responsibilities: ["Mix drinks", "Bar maintenance", "Customer interaction"], requirements: ["Mixology skills", "21+ years old"], isActive: true },
      { tenantId: "acme-corp", title: "Chef", description: "Kitchen food preparation", hourlyRate: "$28.00", responsibilities: ["Food prep", "Cooking", "Quality control"], requirements: ["Culinary degree", "3+ years experience"], isActive: true },
      { tenantId: "acme-corp", title: "Manager", description: "Operations management", hourlyRate: "$35.00", responsibilities: ["Staff oversight", "Operations", "Customer relations"], requirements: ["Management experience", "Leadership skills"], isActive: true },
      
      // Beta LLC Logistics roles
      { tenantId: "beta-llc", title: "Clerk", description: "Warehouse operations clerk", hourlyRate: "$16.00", responsibilities: ["Inventory management", "Data entry", "Order processing"], requirements: ["High school diploma", "Computer skills"], isActive: true },
      { tenantId: "beta-llc", title: "Supervisor", description: "Warehouse supervisor", hourlyRate: "$24.00", responsibilities: ["Team leadership", "Quality control", "Safety oversight"], requirements: ["2+ years experience", "Leadership skills"], isActive: true },
      { tenantId: "beta-llc", title: "Driver", description: "Delivery and transportation", hourlyRate: "$19.00", responsibilities: ["Vehicle operation", "Delivery coordination", "Route optimization"], requirements: ["Valid CDL", "Clean driving record"], isActive: true },
    ]);

    // Create departments
    console.log("🏬 Creating departments...");
    await db.insert(departments).values([
      // Acme Corp Restaurant departments
      { tenantId: "acme-corp", name: "Front of House", description: "Customer-facing dining service", managerId: 1, budget: "$45,000", isActive: true },
      { tenantId: "acme-corp", name: "Kitchen", description: "Food preparation and cooking", managerId: 1, budget: "$38,000", isActive: true },
      { tenantId: "acme-corp", name: "Bar", description: "Beverage service and preparation", managerId: 1, budget: "$28,000", isActive: true },
      { tenantId: "acme-corp", name: "Management", description: "Restaurant operations and administration", managerId: 1, budget: "$55,000", isActive: true },
      
      // Beta LLC Logistics departments
      { tenantId: "beta-llc", name: "Warehouse Operations", description: "Storage and inventory management", managerId: 7, budget: "$65,000", isActive: true },
      { tenantId: "beta-llc", name: "Transportation", description: "Delivery and logistics coordination", managerId: 7, budget: "$85,000", isActive: true },
      { tenantId: "beta-llc", name: "Administration", description: "Business operations and management", managerId: 7, budget: "$75,000", isActive: true },
    ]);

    // Create locations
    console.log("📍 Creating locations...");
    await db.insert(locations).values([
      // Acme Corp Restaurant locations
      { tenantId: "acme-corp", name: "FOH Restaurant", description: "Main dining area", address: "123 Main Street - Dining Room", capacity: 80, isActive: true },
      { tenantId: "acme-corp", name: "Bar", description: "Bar and lounge area", address: "123 Main Street - Bar Area", capacity: 25, isActive: true },
      { tenantId: "acme-corp", name: "Office", description: "Administrative office", address: "123 Main Street - Back Office", capacity: 10, isActive: true },
      
      // Beta LLC Logistics locations
      { tenantId: "beta-llc", name: "Warehouse", description: "Main warehouse facility", address: "456 Industrial Blvd - Warehouse Floor", capacity: 50, isActive: true },
      { tenantId: "beta-llc", name: "Back Office", description: "Administrative offices", address: "456 Industrial Blvd - Office Suite", capacity: 15, isActive: true },
    ]);

    // Create operating hours
    console.log("⏰ Creating operating hours...");
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
    const operatingHoursData = [];
    
    for (const tenantId of ["acme-corp", "beta-llc"]) {
      for (const day of days) {
        if (day === "sunday") {
          // Closed on Sunday
          operatingHoursData.push({
            tenantId,
            dayOfWeek: day,
            openTime: null,
            closeTime: null,
            isOpen: false,
            breakStartTime: null,
            breakEndTime: null,
            notes: "Closed",
          });
        } else {
          // Open Monday-Saturday 9:00-18:00 with lunch break
          operatingHoursData.push({
            tenantId,
            dayOfWeek: day,
            openTime: "09:00",
            closeTime: "18:00",
            isOpen: true,
            breakStartTime: "12:00",
            breakEndTime: "13:00",
            notes: "Regular business hours",
          });
        }
      }
    }
    await db.insert(operatingHours).values(operatingHoursData);

    // Create shift policies
    console.log("📋 Creating shift policies...");
    await db.insert(shiftPolicies).values([
      // Acme Corp policies
      { tenantId: "acme-corp", name: "Minimum Shift Duration", description: "Minimum hours for a shift", value: "4", unit: "hours", isActive: true },
      { tenantId: "acme-corp", name: "Break Requirement", description: "Required break time", value: "30", unit: "minutes", isActive: true },
      { tenantId: "acme-corp", name: "Overtime Threshold", description: "Hours before overtime pay", value: "8", unit: "hours", isActive: true },
      { tenantId: "acme-corp", name: "Advance Notice", description: "Required schedule notice", value: "7", unit: "days", isActive: true },
      
      // Beta LLC policies
      { tenantId: "beta-llc", name: "Minimum Shift Duration", description: "Minimum hours for a shift", value: "6", unit: "hours", isActive: true },
      { tenantId: "beta-llc", name: "Break Requirement", description: "Required break time", value: "45", unit: "minutes", isActive: true },
      { tenantId: "beta-llc", name: "Overtime Threshold", description: "Hours before overtime pay", value: "8", unit: "hours", isActive: true },
      { tenantId: "beta-llc", name: "Safety Training", description: "Required safety training", value: "40", unit: "hours", isActive: true },
    ]);

    // Create schedule templates
    console.log("📅 Creating schedule templates...");
    await db.insert(scheduleTemplates).values([
      // Acme Corp templates
      {
        tenantId: "acme-corp",
        name: "Morning Service",
        description: "Standard morning shift template",
        positions: ["Server", "Chef"],
        assignmentType: "assigned",
        requiredStaffPerPosition: 2,
        recurrence: "weekly",
        isActive: true,
        createdBy: 1,
      },
      {
        tenantId: "acme-corp",
        name: "Evening Shift",
        description: "Dinner service template",
        positions: ["Server", "Bartender", "Chef"],
        assignmentType: "assigned",
        requiredStaffPerPosition: 3,
        recurrence: "weekly",
        isActive: true,
        createdBy: 1,
      },
      
      // Beta LLC template
      {
        tenantId: "beta-llc",
        name: "Warehouse Day Shift",
        description: "Standard warehouse operations",
        positions: ["Clerk", "Supervisor"],
        assignmentType: "assigned",
        requiredStaffPerPosition: 4,
        recurrence: "weekly",
        isActive: true,
        createdBy: 7,
      },
    ]);

    // Create realistic shifts with varied patterns
    console.log("📋 Creating shifts...");
    const shiftStatuses = ["open", "assigned", "confirmed", "claimed", "clocked_in", "completed"] as const;
    const shiftsData = [];
    
    // Acme Corp shifts (20 shifts)
    for (let i = 0; i < 20; i++) {
      const isLunch = i % 2 === 0;
      const roles = ["Server", "Bartender", "Chef", "Manager"];
      const role = roles[i % roles.length];
      const assignedIds = [null, 2, 3, 4, 5, 6];
      
      shiftsData.push({
        tenantId: "acme-corp",
        date: new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: isLunch ? "11:00" : "17:00",
        endTime: isLunch ? "15:00" : "23:00",
        role: role,
        description: isLunch ? "Lunch service shift" : "Evening dinner service",
        location: "FOH Restaurant",
        assignedTo: assignedIds[i % assignedIds.length],
        status: shiftStatuses[i % shiftStatuses.length],
        assignmentType: "assigned",
        requiredStaff: 1,
        claimedBy: null,
        templateId: i % 2 === 0 ? 1 : 2,
        notes: i % 5 === 0 ? "Special event shift" : null,
        createdBy: 1,
      });
    }
    
    // Beta LLC shifts (20 shifts)
    for (let i = 0; i < 20; i++) {
      const isDayShift = i % 2 === 0;
      const roles = ["Clerk", "Supervisor", "Driver"];
      const role = roles[i % roles.length];
      const assignedIds = [null, 8, 9, 10, 11, 12];
      
      shiftsData.push({
        tenantId: "beta-llc",
        date: new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        startTime: isDayShift ? "09:00" : "14:00",
        endTime: isDayShift ? "17:00" : "22:00",
        role: role,
        description: isDayShift ? "Standard warehouse shift" : "Evening warehouse operations",
        location: "Warehouse",
        assignedTo: assignedIds[i % assignedIds.length],
        status: shiftStatuses[i % shiftStatuses.length],
        assignmentType: "assigned",
        requiredStaff: 1,
        claimedBy: null,
        templateId: 3,
        notes: i % 4 === 0 ? "Overtime authorized" : null,
        createdBy: 7,
      });
    }
    
    await db.insert(shifts).values(shiftsData);

    // Create holiday requests
    console.log("🏖️ Creating holiday requests...");
    await db.insert(holidayRequests).values([
      // Acme Corp requests
      {
        tenantId: "acme-corp",
        requesterId: 2,
        startDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: "Family vacation to Hawaii",
        status: "approved",
        reviewedBy: 1,
        reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        reviewNotes: null,
      },
      {
        tenantId: "acme-corp",
        requesterId: 3,
        startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: "Wedding attendance",
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      },
      {
        tenantId: "acme-corp",
        requesterId: 4,
        startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: "Personal time off",
        status: "declined",
        reviewedBy: 1,
        reviewedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
        reviewNotes: null,
      },
      {
        tenantId: "acme-corp",
        requesterId: 5,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: "Sick day - flu symptoms",
        status: "approved",
        reviewedBy: 1,
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reviewNotes: null,
      },
      {
        tenantId: "acme-corp",
        requesterId: 6,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: "Sick day - doctor appointment",
        status: "approved",
        reviewedBy: 1,
        reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        reviewNotes: null,
      },
      
      // Beta LLC requests
      {
        tenantId: "beta-llc",
        requesterId: 8,
        startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: "Summer vacation with family",
        status: "approved",
        reviewedBy: 7,
        reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reviewNotes: null,
      },
      {
        tenantId: "beta-llc",
        requesterId: 9,
        startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: "Medical procedure",
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
        reviewNotes: null,
      },
      {
        tenantId: "beta-llc",
        requesterId: 10,
        startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: "Sick day - stomach flu",
        status: "approved",
        reviewedBy: 7,
        reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        reviewNotes: null,
      },
    ]);

    // Create analytics reports
    console.log("📊 Creating analytics reports...");
    await db.insert(analyticsReports).values([
      {
        tenantId: "acme-corp",
        reportType: "labor_cost",
        title: "Monthly Labor Cost Analysis",
        description: "Labor cost breakdown by department and role",
        period: "monthly",
        dataPoints: JSON.stringify([
          { month: "Jan", cost: 12500, budget: 15000 },
          { month: "Feb", cost: 13200, budget: 15000 },
          { month: "Mar", cost: 14100, budget: 15000 },
          { month: "Apr", cost: 13800, budget: 15000 },
        ]),
        filters: JSON.stringify({ department: "all", role: "all" }),
        createdBy: 1,
      },
      {
        tenantId: "acme-corp",
        reportType: "fill_rate",
        title: "Shift Fill Rate Performance",
        description: "Weekly shift fill rate by department",
        period: "weekly",
        dataPoints: JSON.stringify([
          { week: "Week 1", fillRate: 85, target: 90 },
          { week: "Week 2", fillRate: 92, target: 90 },
          { week: "Week 3", fillRate: 88, target: 90 },
          { week: "Week 4", fillRate: 95, target: 90 },
        ]),
        filters: JSON.stringify({ department: "all" }),
        createdBy: 1,
      },
      {
        tenantId: "beta-llc",
        reportType: "performance",
        title: "Staff Performance Metrics",
        description: "Monthly performance tracking for warehouse staff",
        period: "monthly",
        dataPoints: JSON.stringify([
          { metric: "Attendance", score: 94, target: 95 },
          { metric: "Productivity", score: 87, target: 85 },
          { metric: "Safety", score: 98, target: 100 },
          { metric: "Quality", score: 91, target: 90 },
        ]),
        filters: JSON.stringify({ department: "warehouse", period: "current_month" }),
        createdBy: 7,
      },
    ]);

    // Create analytics metrics
    console.log("📈 Creating analytics metrics...");
    await db.insert(analyticsMetrics).values([
      // Acme Corp metrics
      { tenantId: "acme-corp", metricType: "kpi", name: "Average Labor Cost", value: "13650", unit: "USD", category: "finance", isPublic: true },
      { tenantId: "acme-corp", metricType: "kpi", name: "Shift Fill Rate", value: "90", unit: "percent", category: "operations", isPublic: true },
      { tenantId: "acme-corp", metricType: "target", name: "Monthly Budget", value: "15000", unit: "USD", category: "finance", isPublic: true },
      { tenantId: "acme-corp", metricType: "benchmark", name: "Industry Average Fill Rate", value: "85", unit: "percent", category: "operations", isPublic: true },
      
      // Beta LLC metrics
      { tenantId: "beta-llc", metricType: "kpi", name: "Warehouse Efficiency", value: "87", unit: "percent", category: "operations", isPublic: true },
      { tenantId: "beta-llc", metricType: "kpi", name: "Safety Score", value: "98", unit: "percent", category: "safety", isPublic: true },
      { tenantId: "beta-llc", metricType: "target", name: "Monthly Productivity Target", value: "85", unit: "percent", category: "operations", isPublic: true },
      { tenantId: "beta-llc", metricType: "benchmark", name: "Industry Safety Standard", value: "95", unit: "percent", category: "safety", isPublic: true },
    ]);

    // Create activity logs
    console.log("📝 Creating activity logs...");
    await db.insert(activityLogs).values([
      // Recent activities for Acme Corp
      { tenantId: "acme-corp", userId: 1, action: "created", resourceType: "shift", resourceId: "1", details: "Created new evening shift for Server", ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0" },
      { tenantId: "acme-corp", userId: 2, action: "claimed", resourceType: "shift", resourceId: "5", details: "Claimed available shift", ipAddress: "192.168.1.101", userAgent: "Mozilla/5.0" },
      { tenantId: "acme-corp", userId: 1, action: "approved", resourceType: "holiday_request", resourceId: "1", details: "Approved vacation request", ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0" },
      { tenantId: "acme-corp", userId: 3, action: "submitted", resourceType: "holiday_request", resourceId: "2", details: "Submitted wedding leave request", ipAddress: "192.168.1.102", userAgent: "Mozilla/5.0" },
      { tenantId: "acme-corp", userId: 1, action: "updated", resourceType: "business_profile", resourceId: "1", details: "Updated restaurant operating hours", ipAddress: "192.168.1.100", userAgent: "Mozilla/5.0" },
      
      // Recent activities for Beta LLC
      { tenantId: "beta-llc", userId: 7, action: "created", resourceType: "shift", resourceId: "25", details: "Created warehouse morning shift", ipAddress: "10.0.0.50", userAgent: "Mozilla/5.0" },
      { tenantId: "beta-llc", userId: 8, action: "clocked_in", resourceType: "time_entry", resourceId: "1", details: "Started shift at 09:00", ipAddress: "10.0.0.51", userAgent: "Mozilla/5.0" },
      { tenantId: "beta-llc", userId: 7, action: "approved", resourceType: "holiday_request", resourceId: "6", details: "Approved summer vacation", ipAddress: "10.0.0.50", userAgent: "Mozilla/5.0" },
      { tenantId: "beta-llc", userId: 9, action: "submitted", resourceType: "holiday_request", resourceId: "7", details: "Submitted medical leave request", ipAddress: "10.0.0.52", userAgent: "Mozilla/5.0" },
      { tenantId: "beta-llc", userId: 7, action: "updated", resourceType: "subscription", resourceId: "2", details: "Updated billing information", ipAddress: "10.0.0.50", userAgent: "Mozilla/5.0" },
    ]);

    // Create time entries
    console.log("⏱️ Creating time entries...");
    await db.insert(timeEntries).values([
      // Acme Corp time entries
      {
        tenantId: "acme-corp",
        userId: 2,
        shiftId: 1,
        clockInTime: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        clockOutTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        breakStartTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        breakEndTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
        totalHours: "3.5",
        status: "clocked_out",
        notes: "Lunch shift completed",
        approvedBy: 1,
        approvedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        tenantId: "acme-corp",
        userId: 3,
        shiftId: 2,
        clockInTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        clockOutTime: null,
        breakStartTime: null,
        breakEndTime: null,
        totalHours: null,
        status: "clocked_in",
        notes: "Currently working evening shift",
        approvedBy: null,
        approvedAt: null,
      },
      
      // Beta LLC time entries
      {
        tenantId: "beta-llc",
        userId: 8,
        shiftId: 21,
        clockInTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        clockOutTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        breakStartTime: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        breakEndTime: new Date(Date.now() - 3.25 * 60 * 60 * 1000), // 3.25 hours ago
        totalHours: "7.0",
        status: "clocked_out",
        notes: "Standard warehouse shift",
        approvedBy: 7,
        approvedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        tenantId: "beta-llc",
        userId: 9,
        shiftId: 22,
        clockInTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        clockOutTime: null,
        breakStartTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        breakEndTime: null,
        totalHours: null,
        status: "on_break",
        notes: "Taking lunch break",
        approvedBy: null,
        approvedAt: null,
      },
    ]);

    // Create performance metrics
    console.log("🎯 Creating performance metrics...");
    await db.insert(performanceMetrics).values([
      // Acme Corp performance metrics
      { tenantId: "acme-corp", userId: 2, metricType: "attendance", value: "95", period: "monthly", notes: "Excellent attendance record" },
      { tenantId: "acme-corp", userId: 2, metricType: "punctuality", value: "92", period: "monthly", notes: "Usually on time" },
      { tenantId: "acme-corp", userId: 2, metricType: "shift_completion", value: "100", period: "monthly", notes: "All shifts completed" },
      { tenantId: "acme-corp", userId: 3, metricType: "attendance", value: "88", period: "monthly", notes: "Some absences this month" },
      { tenantId: "acme-corp", userId: 3, metricType: "rating", value: "4.2", period: "monthly", notes: "Customer service rating" },
      { tenantId: "acme-corp", userId: 4, metricType: "attendance", value: "97", period: "monthly", notes: "Very reliable" },
      { tenantId: "acme-corp", userId: 4, metricType: "punctuality", value: "98", period: "monthly", notes: "Always on time" },
      
      // Beta LLC performance metrics
      { tenantId: "beta-llc", userId: 8, metricType: "attendance", value: "94", period: "monthly", notes: "Good attendance" },
      { tenantId: "beta-llc", userId: 8, metricType: "punctuality", value: "89", period: "monthly", notes: "Occasionally late" },
      { tenantId: "beta-llc", userId: 9, metricType: "attendance", value: "100", period: "monthly", notes: "Perfect attendance" },
      { tenantId: "beta-llc", userId: 9, metricType: "shift_completion", value: "100", period: "monthly", notes: "All shifts completed on time" },
      { tenantId: "beta-llc", userId: 10, metricType: "attendance", value: "91", period: "monthly", notes: "Some sick days" },
      { tenantId: "beta-llc", userId: 11, metricType: "rating", value: "4.7", period: "monthly", notes: "Excellent work quality" },
    ]);

    console.log("✅ Complete database seeding finished successfully!");
    console.log("📊 Database now contains:");
    console.log("  - 12 users across 2 tenants");
    console.log("  - 40 shifts with realistic patterns");
    console.log("  - 8 holiday requests with mixed statuses");
    console.log("  - 3 subscription plans and 2 active subscriptions");
    console.log("  - 2 complete business profiles with billing info");
    console.log("  - 7 job roles, 7 departments, 5 locations");
    console.log("  - 14 operating hours, 8 shift policies");
    console.log("  - 3 analytics reports, 8 analytics metrics");
    console.log("  - 10 activity logs, 4 time entries");
    console.log("  - 13 performance metrics across all staff");
    console.log("  - Complete subscription and billing data");
    console.log("🎉 All static data has been replaced with authentic database content!");

  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

completeSeed()
  .then(() => {
    console.log("🌱 Seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });