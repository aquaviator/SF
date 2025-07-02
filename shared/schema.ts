import { pgTable, text, varchar, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  assignedTo: integer("assigned_to"),
  status: text("status").notNull().$type<"open" | "claimed" | "assigned" | "confirmed" | "clocked_in" | "clocked_out" | "completed" | "declined" | "cancelled">(),
  assignmentType: text("assignment_type").notNull().$type<"assigned" | "opportunity">().default("assigned"),
  requiredStaff: integer("required_staff").notNull().default(1),
  claimedBy: text("claimed_by").array(), // Array of user IDs who claimed this opportunity
  templateId: integer("template_id"), // Reference to schedule template if created from template
  notes: text("notes"),
  createdBy: integer("created_by").notNull(),
});

// Opportunities table
export const opportunities = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  shiftId: integer("shift_id").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  isActive: boolean("is_active").notNull().default(true),
});

// Swap requests table
export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  requesterId: integer("requester_id").notNull(),
  originalShiftId: integer("original_shift_id").notNull(),
  targetShiftId: integer("target_shift_id"),
  status: text("status").notNull().$type<"pending" | "approved" | "rejected">(),
  reason: text("reason"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

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
  shiftId: integer("shift_id").notNull(),
  assignedTo: integer("assigned_to").notNull(),
  assignedBy: integer("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  notes: text("notes"),
});

// Holiday requests table
export const holidayRequests = pgTable("holiday_requests", {
  id: serial("id").primaryKey(),
  tenantId: text("tenant_id").notNull(),
  requesterId: integer("requester_id").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  reviewedBy: integer("reviewed_by"),
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
  positions: text("positions").array().notNull(), // Array of position/role definitions
  assignmentType: text("assignment_type").notNull().$type<"assigned" | "open_opportunity">(),
  requiredStaffPerPosition: integer("required_staff_per_position").notNull().default(1),
  recurrence: text("recurrence").notNull(), // weekly, monthly, custom
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").notNull(),
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
  managerId: integer("manager_id"),
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

export const insertAssignmentSchema = createInsertSchema(assignments).omit({
  id: true,
  assignedAt: true,
});

export const insertHolidayRequestSchema = createInsertSchema(holidayRequests).omit({
  id: true,
  createdAt: true,
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
