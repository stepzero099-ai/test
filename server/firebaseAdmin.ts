import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage, Message } from 'firebase-admin/messaging';

let isInitialized = false;

function initFirebaseAdmin(): App | null {
  const existingApps = getApps();
  if (isInitialized && existingApps.length > 0) {
    return existingApps[0];
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FCM_SERVER_KEY;
  
  if (!serviceAccountJson || !serviceAccountJson.trim()) {
    console.warn('[Firebase Admin] ⚠️ No Firebase credentials found');
    return null;
  }

  try {
    let serviceAccount: any;
    
    if (typeof serviceAccountJson === 'string') {
      try {
        serviceAccount = JSON.parse(serviceAccountJson.trim());
      } catch (parseErr: any) {
        console.error('[Firebase Admin] ❌ JSON parse error:', parseErr.message);
        return null;
      }
    } else {
      serviceAccount = serviceAccountJson;
    }
    
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('[Firebase Admin] ❌ Missing required fields');
      return null;
    }

    if (existingApps.length === 0) {
      initializeApp({
        credential: cert(serviceAccount)
      });
    }

    isInitialized = true;
    console.log(`[Firebase Admin] ✅ Project: ${serviceAccount.project_id}`);
    return getApps()[0] || null;
  } catch (err: any) {
    console.error('[Firebase Admin] ❌ Init failed:', err.message);
    return null;
  }
}

export function isFirebaseAdminReady(): boolean {
  return initFirebaseAdmin() !== null;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  category?: string;
  importance?: string;
  data?: Record<string, string>;
}

/**
 * Sends a real Web Push notification to a list of FCM tokens
 */
export async function sendPushToTokens(tokens: string[], payload: PushPayload): Promise<{
  successCount: number;
  failureCount: number;
  unregisteredTokens: string[];
}> {
  const app = initFirebaseAdmin();
  if (!app || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, unregisteredTokens: [] };
  }

  const messaging = getMessaging(app);
  const unregisteredTokens: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  // Firebase allows up to 500 tokens per multicast
  const batchSize = 500;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const tokenBatch = tokens.slice(i, i + batchSize);

    try {
      const message: MulticastMessage = {
        tokens: tokenBatch,
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: {
          url: payload.url || '/',
          category: payload.category || 'general',
          importance: payload.importance || 'normal',
          ...(payload.data || {})
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: '/icon-192.svg',
            badge: '/icon-192.svg',
            dir: 'rtl',
            lang: 'ar'
          },
          fcmOptions: {
            link: payload.url || '/'
          }
        }
      };

      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            unregisteredTokens.push(tokenBatch[idx]);
          }
        }
      });
    } catch (err: any) {
      console.warn('[Firebase Admin] Multicast push error:', err?.message || err);
      failureCount += tokenBatch.length;
    }
  }

  return { successCount, failureCount, unregisteredTokens };
}

/**
 * Sends a direct test notification to a specific token
 */
export async function sendDirectTestPush(token: string, payload: PushPayload): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const app = initFirebaseAdmin();
  if (!app) {
    return {
      success: false,
      error: 'لم يتم تفعيل FIREBASE_SERVICE_ACCOUNT_JSON في متغيرات بيئة الخادم بعد'
    };
  }

  try {
    const messaging = getMessaging(app);
    const message: Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: {
        url: payload.url || '/',
        category: payload.category || 'test',
        importance: payload.importance || 'breaking',
        ...(payload.data || {})
      },
      webpush: {
        notification: {
          title: payload.title,
          body: payload.body,
          icon: '/icon-192.svg',
          badge: '/icon-192.svg',
          dir: 'rtl',
          lang: 'ar'
        },
        fcmOptions: {
          link: payload.url || '/'
        }
      }
    };

    const messageId = await messaging.send(message);
    return { success: true, messageId };
  } catch (err: any) {
    console.warn('[Firebase Admin] Direct test push failed:', err?.message || err);
    return { success: false, error: err?.message || 'فشل إرسال الإشعار' };
  }
}
