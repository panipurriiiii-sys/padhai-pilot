'use client';

import { useState, useEffect, useCallback } from 'react';
import { teacherApi } from '../lib/api';

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

export function playLuxuryChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Apple-style calm, luxury chime chord (E5: 659.25Hz -> G#5: 830.61Hz)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    osc1.frequency.exponentialRampToValueAtTime(830.61, now + 0.12);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(987.77, now + 0.22); // B5

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.85);
    osc2.stop(now + 0.85);
  } catch {
    // AudioContext autoplay restrictions or unsupported
  }
}

export function useWebPush(isAuthenticated: boolean) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          const sub = await registration.pushManager.getSubscription();
          setIsSubscribed(!!sub);
        })
        .catch(() => {});
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isAuthenticated) return false;
    setIsRegistering(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setIsRegistering(false);
        return false;
      }

      const vapidKey = await teacherApi.getVapidPublicKey();
      if (!vapidKey) {
        setIsRegistering(false);
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
      }

      const subJson = subscription.toJSON();
      if (subJson.endpoint && subJson.keys) {
        await teacherApi.registerDeviceToken({
          token: subJson.endpoint,
          platform: 'WEB',
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          userAgent: navigator.userAgent,
        });
        setIsSubscribed(true);
        playLuxuryChime();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Web push subscription failed:', err);
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, [isSupported, isAuthenticated]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isRegistering,
    subscribeToPush,
    playChime: playLuxuryChime,
  };
}
