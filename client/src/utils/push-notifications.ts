// Push notification utilities for the client
import { apiRequest } from '@/lib/queryClient';

// We'll get the VAPID public key from the server
let VAPID_PUBLIC_KEY: string | null = null;

// Fetch VAPID public key from server
async function getVapidPublicKey(): Promise<string> {
  if (VAPID_PUBLIC_KEY) {
    return VAPID_PUBLIC_KEY;
  }
  
  try {
    const response = await fetch('/api/notifications/vapid-public-key');
    const data = await response.json();
    VAPID_PUBLIC_KEY = data.publicKey;
    return VAPID_PUBLIC_KEY;
  } catch (error) {
    throw new Error('Failed to get VAPID public key');
  }
}

export interface PushSubscriptionData {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const permission = await Notification.requestPermission();
  console.log('🔔 Notification permission:', permission);
  return permission;
}

/**
 * Register service worker and get push subscription
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushNotificationSupported()) {
    throw new Error('Service Worker is not supported');
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  console.log('👷 Service Worker registered:', registration);

  // Wait for the service worker to be ready
  await navigator.serviceWorker.ready;

  return registration;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscriptionData> {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await registerServiceWorker();
  
  // Check if already subscribed
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) {
    console.log('📱 Already subscribed to push notifications');
    return extractSubscriptionData(existingSubscription);
  }

  // Get VAPID public key from server
  const vapidKey = await getVapidPublicKey();
  
  // Subscribe to push notifications
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey)
  });

  console.log('📱 Push subscription created:', subscription);
  return extractSubscriptionData(subscription);
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    return false;
  }

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return false;
  }

  const result = await subscription.unsubscribe();
  console.log('📱 Push subscription removed:', result);
  return result;
}

/**
 * Send subscription to server
 */
export async function sendSubscriptionToServer(subscriptionData: PushSubscriptionData): Promise<void> {
  try {
    const response = await apiRequest('POST', '/api/notifications/subscribe', subscriptionData);
    console.log('📡 Subscription sent to server:', response);
  } catch (error) {
    console.error('❌ Failed to send subscription to server:', error);
    throw error;
  }
}

/**
 * Remove subscription from server
 */
export async function removeSubscriptionFromServer(): Promise<void> {
  try {
    const response = await apiRequest('DELETE', '/api/notifications/unsubscribe', {});
    console.log('📡 Subscription removed from server:', response);
  } catch (error) {
    console.error('❌ Failed to remove subscription from server:', error);
    throw error;
  }
}

/**
 * Complete push notification setup
 */
export async function enablePushNotifications(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isPushNotificationSupported()) {
      return { success: false, message: 'Push notifications are not supported in this browser' };
    }

    const subscriptionData = await subscribeToPushNotifications();
    await sendSubscriptionToServer(subscriptionData);

    return { success: true, message: 'Push notifications enabled successfully' };
  } catch (error: any) {
    console.error('❌ Failed to enable push notifications:', error);
    return { success: false, message: error.message || 'Failed to enable push notifications' };
  }
}

/**
 * Disable push notifications
 */
export async function disablePushNotifications(): Promise<{ success: boolean; message: string }> {
  try {
    await removeSubscriptionFromServer();
    await unsubscribeFromPushNotifications();

    return { success: true, message: 'Push notifications disabled successfully' };
  } catch (error: any) {
    console.error('❌ Failed to disable push notifications:', error);
    return { success: false, message: error.message || 'Failed to disable push notifications' };
  }
}

/**
 * Check if user is currently subscribed
 */
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('❌ Error checking push subscription:', error);
    return false;
  }
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

function extractSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
  const p256dh = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');
  
  if (!p256dh || !auth) {
    throw new Error('Failed to get subscription keys');
  }

  return {
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(p256dh),
    auth: arrayBufferToBase64(auth)
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}