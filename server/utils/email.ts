import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { getDomainFromDatabase } from '../setup/domainSetup';
import { storage } from '../storage';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GOOGLE_DELEGATED_EMAIL,
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});

// Simple handlebars-like template engine
function compileTemplate(template: string, data: any): string {
  let compiled = template;
  
  // Handle {{#if}} blocks
  compiled = compiled.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    return data[condition] ? content : '';
  });
  
  // Handle {{#unless}} blocks
  compiled = compiled.replace(/\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, content) => {
    return !data[condition] ? content : '';
  });
  
  // Handle {{else}} within {{#if}} blocks
  compiled = compiled.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, ifContent, elseContent) => {
    return data[condition] ? ifContent : elseContent;
  });
  
  // Handle regular variables
  compiled = compiled.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || '';
  });
  
  return compiled;
}

// Base email sending function
async function sendEmail(options: {
  to: string;
  subject: string;
  template: string;
  data: any;
  tenantId?: string;
  userId?: number;
  shiftId?: number;
  type?: string;
}): Promise<void> {
  const { to, subject, template, data, tenantId, userId, shiftId, type } = options;
  
  // Load template
  const templatePath = path.join(process.cwd(), 'server', 'emails', template);
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Compile template with data
  const html = compileTemplate(templateContent, data);
  
  // Get domain info
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  
  // Add standard links to data
  const baseUrl = `${protocol}://${activeDomain}`;
  const enhancedData = {
    ...data,
    baseUrl,
    loginLink: `${baseUrl}/login`,
    unsubscribeLink: `${baseUrl}/settings/notifications`,
  };
  
  // Final template compilation with enhanced data
  const finalHtml = compileTemplate(html, enhancedData);
  
  console.log('📧 OPERATIONAL_EMAIL_SENDING', {
    to,
    subject,
    template,
    type,
    tenantId,
    userId,
    shiftId,
    timestamp: new Date()
  });
  
  try {
    // Send email
    await transporter.sendMail({
      from: process.env.GOOGLE_DELEGATED_EMAIL,
      to,
      subject,
      html: finalHtml,
    });
    
    console.log('✅ OPERATIONAL_EMAIL_SENT', {
      to,
      subject,
      template,
      type,
      timestamp: new Date()
    });
    
    // Log to activity logs (skip if user doesn't exist to avoid foreign key constraint)
    // This is optional logging and shouldn't prevent email sending
    try {
      if (tenantId && userId) {
        await storage.createActivityLog({
          tenantId,
          userId,
          action: 'email_sent',
          resourceType: 'notification',
          resourceId: shiftId?.toString() || 'system',
          details: `Email sent: ${type || 'notification'} to ${to}`,
          ipAddress: '127.0.0.1', // Server-side email
          userAgent: 'ShiftFlo-EmailService'
        });
      }
    } catch (activityLogError) {
      // Don't fail email sending if activity log fails
      console.warn('📝 ACTIVITY_LOG_WARNING', {
        error: activityLogError.message,
        timestamp: new Date()
      });
    }
    
  } catch (error) {
    console.error('❌ OPERATIONAL_EMAIL_FAILED', {
      to,
      subject,
      template,
      type,
      error: error.message,
      timestamp: new Date()
    });
    throw error;
  }
}

// Check if user has email notifications enabled
async function checkEmailPreferences(userId: number): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    // For now, assume emails are enabled by default
    // In the future, check user notification preferences
    return true;
  } catch (error) {
    console.error('Failed to check email preferences:', error);
    return false; // Default to not sending if we can't check
  }
}

export async function sendShiftAssignmentEmail(shift: any, staff: any): Promise<void> {
  const emailEnabled = await checkEmailPreferences(staff.id);
  if (!emailEnabled) {
    console.log('📧 SHIFT_ASSIGNMENT_EMAIL_SKIPPED', {
      staffId: staff.id,
      reason: 'Email notifications disabled',
      timestamp: new Date()
    });
    return;
  }
  
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const baseUrl = `${protocol}://${activeDomain}`;
  
  const data = {
    staffName: `${staff.firstName} ${staff.lastName}`,
    shiftDate: new Date(shift.date).toLocaleDateString(),
    startTime: shift.startTime,
    endTime: shift.endTime,
    role: shift.role,
    location: shift.location,
    description: shift.description,
    acceptLink: `${baseUrl}/my-work?action=accept&shiftId=${shift.id}`,
    declineLink: `${baseUrl}/my-work?action=decline&shiftId=${shift.id}`,
    loginLink: `${baseUrl}/login`,
    unsubscribeLink: `${baseUrl}/settings/notifications`,
  };
  
  await sendEmail({
    to: staff.email,
    subject: `New Shift Assignment - ${shift.role} on ${data.shiftDate}`,
    template: 'shift-assigned.hbs',
    data,
    tenantId: staff.tenantId,
    userId: staff.id,
    shiftId: shift.id,
    type: 'shift_assignment'
  });
}

export async function sendShiftReminderEmail(shift: any, staff: any): Promise<void> {
  const emailEnabled = await checkEmailPreferences(staff.id);
  if (!emailEnabled) {
    console.log('📧 SHIFT_REMINDER_EMAIL_SKIPPED', {
      staffId: staff.id,
      reason: 'Email notifications disabled',
      timestamp: new Date()
    });
    return;
  }
  
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const baseUrl = `${protocol}://${activeDomain}`;
  
  // Calculate hours until shift starts
  const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
  const now = new Date();
  const hoursUntilStart = Math.ceil((shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  const data = {
    staffName: `${staff.firstName} ${staff.lastName}`,
    shiftDate: new Date(shift.date).toLocaleDateString(),
    startTime: shift.startTime,
    endTime: shift.endTime,
    role: shift.role,
    location: shift.location,
    hoursUntilStart,
    clockInLink: `${baseUrl}/my-work?action=clock-in&shiftId=${shift.id}`,
    shiftsLink: `${baseUrl}/my-work`,
    unsubscribeLink: `${baseUrl}/settings/notifications`,
  };
  
  await sendEmail({
    to: staff.email,
    subject: `Shift Reminder - ${shift.role} starting in ${hoursUntilStart} hours`,
    template: 'shift-reminder.hbs',
    data,
    tenantId: staff.tenantId,
    userId: staff.id,
    shiftId: shift.id,
    type: 'shift_reminder'
  });
}

export async function sendSwapRequestEmail(swap: any, target: any, requester: any): Promise<void> {
  const emailEnabled = await checkEmailPreferences(target.id);
  if (!emailEnabled) {
    console.log('📧 SWAP_REQUEST_EMAIL_SKIPPED', {
      targetId: target.id,
      reason: 'Email notifications disabled',
      timestamp: new Date()
    });
    return;
  }
  
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const baseUrl = `${protocol}://${activeDomain}`;
  
  const data = {
    recipientName: `${target.firstName} ${target.lastName}`,
    requesterName: `${requester.firstName} ${requester.lastName}`,
    originalShiftDate: new Date(swap.originalShift.date).toLocaleDateString(),
    originalStartTime: swap.originalShift.startTime,
    originalEndTime: swap.originalShift.endTime,
    originalRole: swap.originalShift.role,
    originalLocation: swap.originalShift.location,
    targetShiftDate: new Date(swap.targetShift.date).toLocaleDateString(),
    targetStartTime: swap.targetShift.startTime,
    targetEndTime: swap.targetShift.endTime,
    targetRole: swap.targetShift.role,
    targetLocation: swap.targetShift.location,
    reason: swap.reason,
    approveLink: `${baseUrl}/my-work?action=approve-swap&swapId=${swap.id}`,
    declineLink: `${baseUrl}/my-work?action=decline-swap&swapId=${swap.id}`,
    shiftsLink: `${baseUrl}/my-work`,
    unsubscribeLink: `${baseUrl}/settings/notifications`,
  };
  
  await sendEmail({
    to: target.email,
    subject: `Shift Swap Request from ${requester.firstName} ${requester.lastName}`,
    template: 'swap-request.hbs',
    data,
    tenantId: target.tenantId,
    userId: target.id,
    shiftId: swap.originalShift.id,
    type: 'swap_request'
  });
}

export async function sendHolidayRequestEmail(request: any, owner: any, staff: any): Promise<void> {
  const emailEnabled = await checkEmailPreferences(owner.id);
  if (!emailEnabled) {
    console.log('📧 HOLIDAY_REQUEST_EMAIL_SKIPPED', {
      ownerId: owner.id,
      reason: 'Email notifications disabled',
      timestamp: new Date()
    });
    return;
  }
  
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const baseUrl = `${protocol}://${activeDomain}`;
  
  const data = {
    ownerName: `${owner.firstName} ${owner.lastName}`,
    staffName: `${staff.firstName} ${staff.lastName}`,
    requestType: request.requestType || 'Holiday',
    startDate: new Date(request.startDate).toLocaleDateString(),
    endDate: new Date(request.endDate).toLocaleDateString(),
    daysRequested: request.daysRequested,
    reason: request.reason,
    submittedDate: new Date(request.createdAt).toLocaleDateString(),
    remainingEntitlement: request.remainingEntitlement || 'N/A',
    carryOver: request.carryOver,
    approveLink: `${baseUrl}/owner/requests?action=approve&requestId=${request.id}`,
    declineLink: `${baseUrl}/owner/requests?action=decline&requestId=${request.id}`,
    requestsLink: `${baseUrl}/owner/requests`,
    unsubscribeLink: `${baseUrl}/settings/notifications`,
  };
  
  await sendEmail({
    to: owner.email,
    subject: `Holiday Request - ${staff.firstName} ${staff.lastName} (${request.daysRequested} days)`,
    template: 'holiday-request.hbs',
    data,
    tenantId: owner.tenantId,
    userId: owner.id,
    shiftId: request.id,
    type: 'holiday_request'
  });
}

export async function sendHolidayStatusUpdateEmail(request: any, staff: any, owner: any): Promise<void> {
  const emailEnabled = await checkEmailPreferences(staff.id);
  if (!emailEnabled) {
    console.log('📧 HOLIDAY_STATUS_EMAIL_SKIPPED', {
      staffId: staff.id,
      reason: 'Email notifications disabled',
      timestamp: new Date()
    });
    return;
  }
  
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const baseUrl = `${protocol}://${activeDomain}`;
  
  const approved = request.status === 'approved';
  
  const data = {
    staffName: `${staff.firstName} ${staff.lastName}`,
    ownerName: `${owner.firstName} ${owner.lastName}`,
    requestType: request.requestType || 'Holiday',
    startDate: new Date(request.startDate).toLocaleDateString(),
    endDate: new Date(request.endDate).toLocaleDateString(),
    daysRequested: request.daysRequested,
    approved,
    processedDate: new Date(request.updatedAt).toLocaleDateString(),
    ownerNotes: request.ownerNotes,
    remainingEntitlement: request.remainingEntitlement || 'N/A',
    carryOver: request.carryOver,
    holidaysLink: `${baseUrl}/my-work?tab=holidays`,
    shiftsLink: `${baseUrl}/my-work`,
    unsubscribeLink: `${baseUrl}/settings/notifications`,
  };
  
  await sendEmail({
    to: staff.email,
    subject: `Holiday Request ${approved ? 'Approved' : 'Declined'} - ${request.requestType || 'Holiday'}`,
    template: 'holiday-status.hbs',
    data,
    tenantId: staff.tenantId,
    userId: staff.id,
    shiftId: request.id,
    type: 'holiday_status'
  });
}

export async function sendEmergencyShiftAlert(shift: any, eligibleStaff: any[], reason: string): Promise<void> {
  const activeDomain = await getDomainFromDatabase();
  const isLocalhost = activeDomain.includes('localhost');
  const protocol = isLocalhost ? 'http' : 'https';
  const baseUrl = `${protocol}://${activeDomain}`;
  
  // Calculate time until shift starts
  const shiftStart = new Date(`${shift.date}T${shift.startTime}`);
  const now = new Date();
  const hoursUntilStart = Math.ceil((shiftStart.getTime() - now.getTime()) / (1000 * 60 * 60));
  const isStartingSoon = hoursUntilStart <= 2;
  
  const promises = eligibleStaff.map(async (staff) => {
    const emailEnabled = await checkEmailPreferences(staff.id);
    if (!emailEnabled) {
      console.log('📧 EMERGENCY_ALERT_EMAIL_SKIPPED', {
        staffId: staff.id,
        reason: 'Email notifications disabled',
        timestamp: new Date()
      });
      return;
    }
    
    const data = {
      staffName: `${staff.firstName} ${staff.lastName}`,
      shiftDate: new Date(shift.date).toLocaleDateString(),
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role,
      location: shift.location,
      reason,
      isStartingSoon,
      timeUntilStart: hoursUntilStart > 0 ? `${hoursUntilStart} hours` : 'very soon',
      claimLink: `${baseUrl}/opportunities?action=claim&shiftId=${shift.id}`,
      contactLink: `${baseUrl}/contact`,
      unsubscribeLink: `${baseUrl}/settings/notifications`,
    };
    
    await sendEmail({
      to: staff.email,
      subject: `🚨 URGENT: Emergency Coverage Needed - ${shift.role}`,
      template: 'emergency-alert.hbs',
      data,
      tenantId: staff.tenantId,
      userId: staff.id,
      shiftId: shift.id,
      type: 'emergency_alert'
    });
  });
  
  await Promise.all(promises);
  
  console.log('✅ EMERGENCY_ALERTS_SENT', {
    shiftId: shift.id,
    staffCount: eligibleStaff.length,
    reason,
    timestamp: new Date()
  });
}