import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Check, X, AlertCircle } from 'lucide-react';
import { 
  enablePushNotifications, 
  disablePushNotifications, 
  isSubscribedToPushNotifications,
  isPushNotificationSupported,
  getNotificationPermission
} from '@/utils/push-notifications';
import { useRole } from '@/hooks/useRole';

export default function PushNotificationSetup() {
  const { role } = useRole();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    checkPushSupport();
  }, []);

  const checkPushSupport = async () => {
    setIsSupported(isPushNotificationSupported());
    setPermission(getNotificationPermission());
    
    if (isPushNotificationSupported()) {
      const subscribed = await isSubscribedToPushNotifications();
      setIsSubscribed(subscribed);
    }
  };

  const handleEnablePushNotifications = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await enablePushNotifications();
      
      if (result.success) {
        setIsSubscribed(true);
        setPermission('granted');
        setMessage({ type: 'success', text: 'Push notifications enabled successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to enable push notifications' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisablePushNotifications = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await disablePushNotifications();
      
      if (result.success) {
        setIsSubscribed(false);
        setMessage({ type: 'success', text: 'Push notifications disabled successfully!' });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to disable push notifications' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: `Test notification sent! (${result.sentCount} devices)` });
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test notification' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications require a modern browser and HTTPS. Please update your browser or use a different device.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get real-time notifications for shifts, swaps, and important updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {permission === 'granted' && isSubscribed ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Check className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          ) : permission === 'denied' ? (
            <Badge variant="destructive">
              <X className="h-3 w-3 mr-1" />
              Blocked
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Bell className="h-3 w-3 mr-1" />
              Available
            </Badge>
          )}
        </div>

        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : ''}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {!isSubscribed || permission !== 'granted' ? (
            <Button
              onClick={handleEnablePushNotifications}
              disabled={isLoading || permission === 'denied'}
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleDisablePushNotifications}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <BellOff className="h-4 w-4" />
                {isLoading ? 'Disabling...' : 'Disable Notifications'}
              </Button>
              
              <Button
                onClick={handleTestNotification}
                disabled={isLoading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Bell className="h-4 w-4" />
                {isLoading ? 'Sending...' : 'Send Test'}
              </Button>
            </>
          )}
        </div>

        {permission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Push notifications are blocked. Please enable them in your browser settings and refresh this page.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-600">
          <p><strong>You'll receive notifications for:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            {role === 'owner' ? (
              <>
                <li>Staff holiday requests requiring approval</li>
                <li>Emergency shift coverage alerts</li>
                <li>Shift swap requests requiring approval</li>
                <li>Staff attendance issues (no-shows, late arrivals)</li>
                <li>System alerts and important business updates</li>
              </>
            ) : (
              <>
                <li>New shift assignments</li>
                <li>Shift reminders (24 hours before)</li>
                <li>Shift swap requests from colleagues</li>
                <li>Holiday request status updates</li>
                <li>Schedule changes and important updates</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}