import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions, notificationPreferences } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Generate VAPID keys if not provided
let vapidPublicKey: string;
let vapidPrivateKey: string;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
} else {
  // Generate new VAPID keys
  const vapidKeys = webpush.generateVAPIDKeys();
  vapidPublicKey = vapidKeys.publicKey;
  vapidPrivateKey = vapidKeys.privateKey;
  
  console.log('🔑 VAPID keys generated:');
  console.log('Public Key:', vapidPublicKey);
  console.log('Private Key:', vapidPrivateKey);
  console.log('Add these to your environment variables for production');
}

webpush.setVapidDetails(
  'mailto:support@shiftflo.com',
  vapidPublicKey,
  vapidPrivateKey
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  data?: any;
}

export interface NotificationCategory {
  shiftAssignments: boolean;
  reminders: boolean;
  swaps: boolean;
  emergencies: boolean;
}

/**
 * Send push notification to a specific user
 */
export async function notifyUser(
  userId: number,
  tenantId: string,
  payload: PushNotificationPayload,
  category: keyof NotificationCategory = 'shiftAssignments'
): Promise<{ success: boolean; message: string; sentCount: number }> {
  try {
    console.log('📱 PUSH_NOTIFICATION_REQUEST', {
      userId,
      tenantId,
      category,
      title: payload.title,
      timestamp: new Date().toISOString()
    });

    // Get user's notification preferences
    const preferences = await db
      .select()
      .from(notificationPreferences)
      .where(and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.tenantId, tenantId)
      ));

    const userPrefs = preferences[0];

    // Check if user has push notifications enabled for this category
    if (userPrefs && !userPrefs.push) {
      console.log('📱 PUSH_DISABLED_USER', { userId, tenantId });
      return { success: false, message: 'Push notifications disabled for user', sentCount: 0 };
    }

    if (userPrefs && !userPrefs[category]) {
      console.log('📱 PUSH_DISABLED_CATEGORY', { userId, tenantId, category });
      return { success: false, message: `Push notifications disabled for category: ${category}`, sentCount: 0 };
    }

    // Check work hours only setting
    if (userPrefs?.workHoursOnly) {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < 7 || hour > 21) {
        console.log('📱 PUSH_OUTSIDE_WORK_HOURS', { userId, tenantId, hour });
        return { success: false, message: 'Outside work hours', sentCount: 0 };
      }
    }

    // Get all active push subscriptions for the user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.tenantId, tenantId),
        eq(pushSubscriptions.isActive, true)
      ));

    if (subscriptions.length === 0) {
      console.log('📱 NO_PUSH_SUBSCRIPTIONS', { userId, tenantId });
      return { success: false, message: 'No active push subscriptions', sentCount: 0 };
    }

    let sentCount = 0;
    const results = [];

    // Send notification to all user's devices
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload)
        );

        sentCount++;
        results.push({ success: true, subscriptionId: subscription.id });
        
        console.log('📱 PUSH_SENT_SUCCESS', {
          userId,
          tenantId,
          subscriptionId: subscription.id,
          title: payload.title
        });

      } catch (error: any) {
        console.error('📱 PUSH_SEND_ERROR', {
          userId,
          tenantId,
          subscriptionId: subscription.id,
          error: error.message
        });

        // If subscription is invalid, mark it as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db
            .update(pushSubscriptions)
            .set({ isActive: false })
            .where(eq(pushSubscriptions.id, subscription.id));
          
          console.log('📱 PUSH_SUBSCRIPTION_DEACTIVATED', {
            subscriptionId: subscription.id,
            statusCode: error.statusCode
          });
        }

        results.push({ success: false, subscriptionId: subscription.id, error: error.message });
      }
    }

    return {
      success: sentCount > 0,
      message: `Sent to ${sentCount} of ${subscriptions.length} devices`,
      sentCount
    };

  } catch (error: any) {
    console.error('📱 PUSH_NOTIFICATION_ERROR', {
      userId,
      tenantId,
      error: error.message
    });

    return {
      success: false,
      message: `Failed to send push notification: ${error.message}`,
      sentCount: 0
    };
  }
}

/**
 * Send push notification to multiple users
 */
export async function notifyUsers(
  userIds: number[],
  tenantId: string,
  payload: PushNotificationPayload,
  category: keyof NotificationCategory = 'shiftAssignments'
): Promise<{ success: boolean; message: string; totalSent: number }> {
  console.log('📱 BULK_PUSH_NOTIFICATION_REQUEST', {
    userIds,
    tenantId,
    category,
    title: payload.title,
    timestamp: new Date().toISOString()
  });

  let totalSent = 0;
  const results = [];

  for (const userId of userIds) {
    const result = await notifyUser(userId, tenantId, payload, category);
    results.push({ userId, ...result });
    totalSent += result.sentCount;
  }

  return {
    success: totalSent > 0,
    message: `Sent to ${totalSent} devices across ${userIds.length} users`,
    totalSent
  };
}

/**
 * Generate VAPID keys for initial setup
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

/**
 * Get VAPID public key for client registration
 */
export function getVapidPublicKey(): string {
  return vapidPublicKey;
}

// Pre-built notification templates
export const notificationTemplates = {
  shiftAssigned: (shiftDate: string, shiftTime: string, location: string) => ({
    title: 'New Shift Assignment',
    body: `You've been assigned a shift on ${shiftDate} at ${shiftTime} - ${location}`,
    url: '/staff/shifts',
    icon: '/icon-192x192.png'
  }),

  shiftReminder: (shiftTime: string, location: string) => ({
    title: 'Shift Reminder',
    body: `Reminder: Your shift starts at ${shiftTime} - ${location}`,
    url: '/staff/shifts',
    icon: '/icon-192x192.png'
  }),

  swapRequest: (requesterName: string, shiftDate: string) => ({
    title: 'Shift Swap Request',
    body: `${requesterName} wants to swap their shift on ${shiftDate}`,
    url: '/staff/shifts',
    icon: '/icon-192x192.png'
  }),

  holidayRequest: (staffName: string, dates: string) => ({
    title: 'Holiday Request',
    body: `${staffName} has requested time off: ${dates}`,
    url: '/owner/holiday-requests',
    icon: '/icon-192x192.png'
  }),

  emergencyShift: (shiftTime: string, location: string) => ({
    title: 'Emergency Shift Available',
    body: `Urgent: Shift available at ${shiftTime} - ${location}`,
    url: '/staff/shifts',
    icon: '/icon-192x192.png'
  }),

  shiftCancelled: (shiftDate: string, shiftTime: string) => ({
    title: 'Shift Cancelled',
    body: `Your shift on ${shiftDate} at ${shiftTime} has been cancelled`,
    url: '/staff/shifts',
    icon: '/icon-192x192.png'
  })
};