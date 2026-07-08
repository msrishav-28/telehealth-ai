import { useState, useEffect, useCallback } from 'react';

export type NotificationPermission = 'default' | 'granted' | 'denied';

interface UsePushNotificationsOptions {
  vapidKey?: string;
  onSubscriptionChange?: (subscription: PushSubscription | null) => void;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { vapidKey, onSubscriptionChange } = options;
  
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Get existing subscription
  useEffect(() => {
    if (!isSupported) return;

    const getSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
        onSubscriptionChange?.(existingSubscription);
      } catch (error) {
        console.error('Error getting push subscription:', error);
      }
    };

    getSubscription();
  }, [isSupported, onSubscriptionChange]);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    setIsLoading(true);
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<PushSubscription> => {
    if (!isSupported) {
      throw new Error('Push notifications are not supported');
    }

    if (permission !== 'granted') {
      const newPermission = await requestPermission();
      if (newPermission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscriptionOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
      };

      if (vapidKey) {
        subscriptionOptions.applicationServerKey = vapidKey;
      }

      const newSubscription = await registration.pushManager.subscribe(subscriptionOptions);
      
      setSubscription(newSubscription);
      onSubscriptionChange?.(newSubscription);
      
      return newSubscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission, vapidKey, requestPermission, onSubscriptionChange]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!subscription) {
      throw new Error('No active subscription to unsubscribe from');
    }

    setIsLoading(true);

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      onSubscriptionChange?.(null);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [subscription, onSubscriptionChange]);

  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<void> => {
    if (!isSupported) {
      throw new Error('Notifications are not supported');
    }

    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
      throw error;
    }
  }, [isSupported, permission]);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    isSubscribed: !!subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
}