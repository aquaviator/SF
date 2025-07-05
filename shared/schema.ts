import { pgTable, text, varchar, serial, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<"owner" | "staff">(),
  tenantId: text("tenant_id").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  dateOfBirth: text("date_of_birth"), // Using text for date for compatibility
  hireDate: text("hire_date"),
  employeeId: varchar("employee_id", { length: 20 }),
  emergencyContactName: varchar("emergency_contact_name", { length: 100 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  photoUrl: text("photo_url"),
  bio: text("bio"),
  activationToken: varchar("activation_token", { length: 64 }),
  tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
});

// Shifts table
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  role: text("role").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: 'cascade' }),
  status: text("status").notNull().$type<"open" | "claimed" | "assigned" | "confirmed" | "clocked_in" | "clocked_out" | "completed" | "declined" | "cancelled">(),
  assignmentType: text("assignment_type").notNull().$type<"assigned" | "opportunity">().default("assigned"),
  requiredStaff: integer("required_staff").notNull().default(1),
  claimedBy: text("claimed_by").array(), // Array of user IDs who claimed this opportunity
  templateId: integer("template_id").references(() => scheduleTemplates.id, { onDelete: 'cascade' }), // Reference to schedule template if created from template
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
});

// Opportunities table
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  description: text("description").notNull(),
  requirements: text("requirements"),
  isActive: boolean("is_active").notNull().default(true),
});

// Swap requests table
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  originalShiftId: integer("original_shift_id").notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  targetShiftId: integer("target_shift_id").references(() => shifts.id, { onDelete: 'cascade' }),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">(),
  reason: text("reason"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Update schema for partial user updates (for profiles)
export const updateUserSchema = createInsertSchema(users).omit({
  id: true,
  username: true,
  password: true,
  role: true,
  tenantId: true,
}).partial();

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
});

export const insertOpportunitySchema = createInsertSchema(opportunities).omit({
  id: true,
});

export const insertSwapRequestSchema = createInsertSchema(swapRequests).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Opportunity = typeof opportunities.$inferSelect;
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type SwapRequest = typeof swapRequests.$inferSelect;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;

// Assignments table
export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  shiftId: integer("shift_id").notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  assignedTo: integer("assigned_to").notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedBy: integer("assigned_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  notes: text("notes"),
});

// Holiday requests table
export const holidayRequests = pgTable("holiday_requests", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  requesterId: integer("requester_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending").$type<"pending" | "approved" | "rejected" | "declined">(), // Extended for backward compatibility
  type: text("type").default("vacation").$type<"vacation" | "sick" | "personal" | "emergency" | "bereavement" | "maternity" | "paternity" | "study" | "other">(), // New optional field
  priority: text("priority").default("normal").$type<"low" | "normal" | "high" | "urgent">(), // New optional field
  reviewedBy: integer("reviewed_by").references(() => users.id, { onDelete: 'cascade' }),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schedule templates table
export const scheduleTemplates = pgTable("schedule_templates", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  startTime: text("start_time").notNull(), // Time in HH:MM format
  endTime: text("end_time").notNull(), // Time in HH:MM format
  positions: text("positions").array().notNull(), // Array of position/role definitions (deprecated)
  assignmentType: text("assignment_type").notNull().$type<"assigned" | "open_opportunity">(),
  requiredStaffPerPosition: integer("required_staff_per_position").notNull().default(1), // deprecated
  recurrence: text("recurrence").notNull(), // weekly, monthly, custom
  staffAssignments: text("staff_assignments"), // JSON: {position: string, staffIds: number[], slots: number}[] (deprecated)
  slots: jsonb("slots").notNull().default("[]"), // Array of {role: string, staffIds: number[], quantity: number}
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Business profiles table
export const businessProfiles = pgTable("business_profiles", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().unique(),
  name: text("name").notNull(),
  ownerName: text("owner_name"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  ownerProfilePicture: text("owner_profile_picture"),
  description: text("description"),
  businessType: text("business_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Job roles table
export const jobRoles = pgTable("job_roles", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  hourlyRate: text("hourly_rate"), // Using text to allow for flexible formatting like "$15.50"
  responsibilities: text("responsibilities").array(),
  requirements: text("requirements").array(),
  isActive: boolean("is_active").notNull().default(true),
  // Legend settings for calendar display
  legendLabel: text("legend_label"), // Custom display label for calendar (defaults to title if null)
  legendColor: text("legend_color").default("slate"), // Color scheme: green, blue, yellow, purple, indigo, orange, gray, slate
  legendIcon: text("legend_icon"), // Optional icon identifier (for future use)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Locations table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  capacity: integer("capacity"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Departments table
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id, { onDelete: 'cascade' }),
  budget: text("budget"), // Using text for flexible budget formatting
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Operating hours table
export const operatingHours = pgTable("operating_hours", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  dayOfWeek: text("day_of_week").notNull().$type<"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday">(),
  openTime: text("open_time"), // null means closed that day
  closeTime: text("close_time"),
  isOpen: boolean("is_open").notNull().default(true),
  breakStartTime: text("break_start_time"),
  breakEndTime: text("break_end_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Shift policies table - Single policy per tenant
export const shiftPolicies = pgTable("shift_policies", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().unique(), // Only one policy per tenant
  minNoticeHours: integer("min_notice_hours").notNull().default(24),
  maxAdvanceBookingDays: integer("max_advance_booking_days").notNull().default(30),
  cancellationDeadlineHours: integer("cancellation_deadline_hours").notNull().default(4),
  maxStrikePoints: integer("max_strike_points").notNull().default(5),
  strikePointsNoShow: integer("strike_points_no_show").notNull().default(2),
  strikePointsLateCancellation: integer("strike_points_late_cancellation").notNull().default(1),
  resetPeriodDays: integer("reset_period_days").notNull().default(30), // Clean slate period
  lateGracePeriodMinutes: integer("late_grace_period_minutes").notNull().default(15), // Grace period for clock-in
  clockInBufferMinutes: integer("clock_in_buffer_minutes").notNull().default(30), // Time before marking as no-show
  clockOutBufferMinutes: integer("clock_out_buffer_minutes").notNull().default(60), // Time before marking checkout as missing
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  assignedAt: true,
});

export const insertHolidayRequestSchema = createInsertSchema(holidayRequests).omit({
  id: true,
  createdAt: true,
}).extend({
  // Allow backward compatibility for status field - normalize "declined" to "rejected"
  status: z.enum(["pending", "approved", "rejected", "declined"]).optional().default("pending"),
  // New optional fields with smart defaults
  type: z.enum(["vacation", "sick", "personal", "emergency", "bereavement", "maternity", "paternity", "study", "other"]).optional().default("vacation"),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional().default("normal"),
});

export const insertScheduleTemplateSchema = createInsertSchema(scheduleTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobRoleSchema = createInsertSchema(jobRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOperatingHoursSchema = createInsertSchema(operatingHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShiftPolicySchema = createInsertSchema(shiftPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Note: Time entry and staff strike schemas will be defined after their tables

// Analytics tables
export const analyticsReports = pgTable("analytics_reports", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  reportType: text("report_type").notNull().$type<"labor_cost" | "fill_rate" | "time_tracking" | "performance">(),
  title: text("title").notNull(),
  description: text("description"),
  period: text("period").notNull(), // monthly, weekly, daily
  dataPoints: text("data_points").notNull(), // JSON string of chart data
  filters: text("filters"), // JSON string of applied filters
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analyticsMetrics = pgTable("analytics_metrics", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  metricType: text("metric_type").notNull().$type<"kpi" | "target" | "benchmark">(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  unit: text("unit").notNull(),
  category: text("category").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Subscription tables - Seat-based billing
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().unique(),
  status: text("status").notNull().$type<"active" | "trial" | "expired" | "cancelled" | "past_due">(),
  seatsIncluded: integer("seats_included").notNull().default(5), // Number of seats included
  seatsUsed: integer("seats_used").notNull().default(0), // Currently used seats
  pricePerSeat: integer("price_per_seat").notNull().default(300), // £3.00 in pence
  monthlyTotal: integer("monthly_total").notNull().default(1500), // Total monthly cost in pence
  trialDaysRemaining: integer("trial_days_remaining"),
  nextBillingDate: timestamp("next_billing_date").notNull(),
  
  // Stripe integration fields
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID
  stripePriceId: text("stripe_price_id"), // Stripe price ID for the seat billing
  stripeStatus: text("stripe_status"), // Stripe subscription status
  
  // Trial and lifecycle
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Seat-based billing tables
export const seatPricing = pgTable("seat_pricing", {
  id: serial("id").primaryKey(),
  tierName: text("tier_name").notNull(), // "Starter", "Professional", "Enterprise"
  minSeats: integer("min_seats").notNull().default(1),
  maxSeats: integer("max_seats"), // null for unlimited
  pricePerSeat: integer("price_per_seat").notNull(), // in pence (300 = £3.00)
  features: text("features").array().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const seatAllocation = pgTable("seat_allocation", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  seatType: text("seat_type").notNull().$type<"active" | "invited" | "suspended">(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  suspendedAt: timestamp("suspended_at"),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billingHistory = pgTable("billing_history", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id, { onDelete: 'cascade' }),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  seatsCharged: integer("seats_charged").notNull(),
  amountCharged: integer("amount_charged").notNull(), // in pence
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().$type<"pending" | "paid" | "failed" | "refunded">(),
  paidAt: timestamp("paid_at"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().$type<"starter" | "professional" | "enterprise">(),
  monthlyPrice: integer("monthly_price").notNull(), // in cents
  annualPrice: integer("annual_price").notNull(), // in cents
  features: text("features").array().notNull(),
  staffLimit: integer("staff_limit").notNull(), // -1 for unlimited
  shiftsLimit: integer("shifts_limit").notNull(), // -1 for unlimited
  storageLimit: text("storage_limit").notNull(),
  isPopular: boolean("is_popular").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usageMetrics = pgTable("usage_metrics", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  staffUsed: integer("staff_used").notNull().default(0),
  shiftsUsed: integer("shifts_used").notNull().default(0),
  storageUsed: text("storage_used").notNull().default("0GB"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  subscriptionId: integer("subscription_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().$type<"paid" | "pending" | "overdue" | "failed" | "refunded">(),
  description: text("description").notNull(),
  billingPeriodStart: timestamp("billing_period_start").notNull(),
  billingPeriodEnd: timestamp("billing_period_end").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  downloadUrl: text("download_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const billingInfo = pgTable("billing_info", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull().unique(),
  cardLastFour: text("card_last_four").notNull(),
  cardBrand: text("card_brand").notNull(),
  expiryMonth: integer("expiry_month").notNull(),
  expiryYear: integer("expiry_year").notNull(),
  cardholderName: text("cardholder_name").notNull(),
  billingAddress: text("billing_address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Time tracking tables
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  shiftId: integer("shift_id").references(() => shifts.id, { onDelete: 'cascade' }),
  clockInTime: timestamp("clock_in_time"),
  clockOutTime: timestamp("clock_out_time"),
  breakStartTime: timestamp("break_start_time"),
  breakEndTime: timestamp("break_end_time"),
  totalHours: text("total_hours"), // calculated field
  status: text("status").notNull().$type<"on_time" | "late" | "missing" | "early_exit" | "missing_checkout" | "adjusted" | "clocked_in" | "on_break" | "clocked_out">(),
  lateByMinutes: integer("late_by_minutes"), // How late they clocked in
  earlyByMinutes: integer("early_by_minutes"), // How early they clocked out
  scheduledStartTime: timestamp("scheduled_start_time"), // From the shift
  scheduledEndTime: timestamp("scheduled_end_time"), // From the shift
  adjustedBy: integer("adjusted_by").references(() => users.id, { onDelete: 'cascade' }), // Owner who made adjustments
  adjustedAt: timestamp("adjusted_at"), // When adjustment was made
  adjustmentReason: text("adjustment_reason"), // Why it was adjusted
  notes: text("notes"),
  overrideNote: text("override_note"), // Owner override note
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: 'cascade' }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Staff strikes table for policy enforcement
export const staffStrikes = pgTable("staff_strikes", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  points: integer("points").notNull().default(0),
  reason: text("reason").notNull().$type<"no_show" | "late_cancellation" | "manual_adjustment">(),
  shiftId: integer("shift_id").references(() => shifts.id, { onDelete: 'cascade' }), // Reference to the shift that caused the strike
  issuedBy: integer("issued_by").references(() => users.id, { onDelete: 'cascade' }), // Owner who issued the strike (if manual)
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // Based on resetPeriodDays policy
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
});

// Performance tracking tables
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  metricType: text("metric_type").notNull().$type<"attendance" | "punctuality" | "shift_completion" | "rating">(),
  value: text("value").notNull(),
  period: text("period").notNull(), // weekly, monthly, quarterly
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Holiday entitlements table
export const holidayEntitlements = pgTable("holiday_entitlements", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  entitlementDays: integer("entitlement_days").notNull().default(25), // Annual entitlement
  usedDays: integer("used_days").notNull().default(0), // Days already taken
  pendingDays: integer("pending_days").notNull().default(0), // Days in pending requests
  year: integer("year").notNull(), // Which year this entitlement applies to
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalyticsMetricSchema = createInsertSchema(analyticsMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUsageMetricSchema = createInsertSchema(usageMetrics).omit({
  id: true,
  recordedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingInfoSchema = createInsertSchema(billingInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeatPricingSchema = createInsertSchema(seatPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeatAllocationSchema = createInsertSchema(seatAllocation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  recordedAt: true,
});

export const insertHolidayEntitlementSchema = createInsertSchema(holidayEntitlements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffStrikeSchema = createInsertSchema(staffStrikes).omit({
  id: true,
  issuedAt: true,
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type HolidayRequest = typeof holidayRequests.$inferSelect;
export type InsertHolidayRequest = z.infer<typeof insertHolidayRequestSchema>;
export type ScheduleTemplate = typeof scheduleTemplates.$inferSelect;
export type InsertScheduleTemplate = z.infer<typeof insertScheduleTemplateSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type JobRole = typeof jobRoles.$inferSelect;
export type InsertJobRole = z.infer<typeof insertJobRoleSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type OperatingHours = typeof operatingHours.$inferSelect;
export type InsertOperatingHours = z.infer<typeof insertOperatingHoursSchema>;
export type ShiftPolicy = typeof shiftPolicies.$inferSelect;
export type InsertShiftPolicy = z.infer<typeof insertShiftPolicySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type StaffStrike = typeof staffStrikes.$inferSelect;
export type InsertStaffStrike = z.infer<typeof insertStaffStrikeSchema>;

// New types
export type AnalyticsReport = typeof analyticsReports.$inferSelect;
export type InsertAnalyticsReport = z.infer<typeof insertAnalyticsReportSchema>;
export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = z.infer<typeof insertUsageMetricSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type BillingInfo = typeof billingInfo.$inferSelect;
export type InsertBillingInfo = z.infer<typeof insertBillingInfoSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type HolidayEntitlement = typeof holidayEntitlements.$inferSelect;
export type InsertHolidayEntitlement = z.infer<typeof insertHolidayEntitlementSchema>;
export type SeatPricing = typeof seatPricing.$inferSelect;
export type InsertSeatPricing = z.infer<typeof insertSeatPricingSchema>;
export type SeatAllocation = typeof seatAllocation.$inferSelect;
export type InsertSeatAllocation = z.infer<typeof insertSeatAllocationSchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
