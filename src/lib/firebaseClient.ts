import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { Category, UserPreferences } from '../types';

let isClientMessagingSupported: boolean | null = null;

export async function checkMessagingSupported(): Promise<boolean> {
  if (isClientMessagingSupported !== null) return isClientMessagingSupported;
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    isClientMessagingSupported = false;
    return false;
  }
  try {
    isClientMessagingSupported = await isSupported();
    return isClientMessagingSupported;
  } catch (e) {
    isClientMessagingSupported = false;
    return false;
  }
}

export function getClientPushToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('khabar_push_token');
}

/**
 * Requests notification permission from user and obtains FCM Web Push token
 */
export async function requestAndRegisterWebPush(
  prefs?: Partial<UserPreferences>,
  customVapidKey?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return { success: false, error: 'المتصفح لا يدعم التنبيهات الفورية (Notification API غير متوفرة)' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'تم رفض إذن التنبيهات من قبل المستخدم' };
    }

    // Verify Firebase web client configuration exists
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    if (
      !firebaseConfig.apiKey ||
      !firebaseConfig.projectId ||
      !firebaseConfig.messagingSenderId ||
      !firebaseConfig.appId
    ) {
      return {
        success: false,
        error: 'لم يتم ضبط إعدادات Firebase للإشعارات بعد من قبل مسؤول الموقع (متغيرات VITE_FIREBASE_* غير مكتملة)'
      };
    }

    const vapidKey =
      customVapidKey ||
      import.meta.env.VITE_FIREBASE_VAPID_KEY ||
      import.meta.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      return {
        success: false,
        error: 'لم يتم تحديد مفتاح VAPID العام لـ Firebase (VITE_FIREBASE_VAPID_KEY)'
      };
    }

    // Register service worker
    let swReg: ServiceWorkerRegistration;
    if ('serviceWorker' in navigator) {
      swReg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
    } else {
      return { success: false, error: 'تعذر تهيئة Service Worker للإشعارات' };
    }

    // Check Firebase messaging support
    const supported = await checkMessagingSupported();
    if (!supported) {
      return { success: false, error: 'Firebase Cloud Messaging غير مدعوم في هذا المتصفح' };
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const messaging = getMessaging(app);

    let fcmToken: string;
    try {
      fcmToken = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: swReg
      });
    } catch (fcmErr: any) {
      console.error('[FCM Client] getToken error:', fcmErr);
      return {
        success: false,
        error: `فشل الحصول على رمز الإشعار من Firebase: ${fcmErr?.message || 'تأكد من صحة مفتاح VAPID وإعدادات المشروع'}`
      };
    }

    if (!fcmToken) {
      return {
        success: false,
        error: 'تعذر إنشاء رمز الاشتراك (FCM Token فارغ)'
      };
    }

    // Set up foreground message listener
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground notification received:', payload);
      if (payload.notification) {
        new Notification(payload.notification.title || 'خبر اللحظة | عاجل', {
          body: payload.notification.body,
          icon: '/icon-192.svg',
          dir: 'rtl',
          lang: 'ar'
        });
      }
    });

    // Save token locally
    localStorage.setItem('khabar_push_token', fcmToken);

    // Register token with backend server
    const categories = prefs?.categories || ['politics', 'conflicts', 'economy', 'technology', 'sports', 'health', 'misc'];
    const frequency = prefs?.notificationFrequency || 'both';

    const subscribeRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: fcmToken,
        categories,
        frequency
      })
    });

    if (!subscribeRes.ok) {
      const errData = await subscribeRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || 'فشل حفظ رمز الاشتراك في الخادم'
      };
    }

    return { success: true, token: fcmToken };
  } catch (err: any) {
    console.error('[Web Push Registration Failed]:', err);
    return { success: false, error: err?.message || 'تعذر تسجيل الإشعارات' };
  }
}

/**
 * Triggers a real test notification from server
 */
export async function sendServerTestNotification(params?: {
  title?: string;
  body?: string;
  category?: Category;
  importance?: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const token = getClientPushToken();
  try {
    const res = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token || undefined,
        title: params?.title || 'خبر اللحظة | تنبيه فوري تجريبي',
        body: params?.body || 'تأكيد وصول التنبيهات الفورية المشتركة بنجاح.',
        category: params?.category || 'politics',
        importance: params?.importance || 'breaking'
      })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || 'فشل استدعاء الخادم' };
  }
}
