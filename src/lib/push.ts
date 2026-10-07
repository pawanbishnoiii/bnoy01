import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { supabase } from '@/integrations/supabase/client';

const appId = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_APP_ID as string | undefined;
const vapidKey = import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_VAPID_KEY as string | undefined;

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_WEB_API_KEY as string,
  projectId: import.meta.env.VITE_LOVABLE_CONNECTOR_FIREBASE_MESSAGING_PROJECT_ID as string,
  appId: appId as string,
  messagingSenderId: appId?.split(':')[1] ?? '',
};

export type PushStatus =
  | 'registered'
  | 'not-configured'
  | 'unsupported'
  | 'open-in-new-tab'
  | 'denied'
  | 'error';

export type PushResult = { status: PushStatus; token?: string; message?: string };

export const pushConfigured = () =>
  Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && appId && vapidKey && firebaseConfig.messagingSenderId);

const SUB_KEY = 'bnoy_push_subscribed';

export const isSubscribedLocally = () => localStorage.getItem(SUB_KEY) === '1';
export const markSubscribed = (token: string) => {
  localStorage.setItem(SUB_KEY, '1');
  localStorage.setItem('bnoy_push_token', token);
};
export const dismissedAt = () => Number(localStorage.getItem('bnoy_push_dismissed') || 0);
export const markDismissed = () => localStorage.setItem('bnoy_push_dismissed', String(Date.now()));

function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

/** Must be called from a user gesture. */
export async function enablePush(): Promise<PushResult> {
  if (!pushConfigured()) return { status: 'not-configured' };
  if (!('Notification' in window) || !(await isSupported())) return { status: 'unsupported' };
  if (window.top !== window.self) return { status: 'open-in-new-tab' };

  try {
    const permission =
      Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (permission !== 'granted') return { status: 'denied' };

    const query = new URLSearchParams(firebaseConfig as Record<string, string>).toString();
    const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query}`);
    const messaging = getMessaging(getFirebaseApp());
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) return { status: 'denied' };

    const { data: sessionData } = await supabase.auth.getSession();
    await supabase.from('push_subscribers').upsert(
      {
        token,
        user_id: sessionData.session?.user?.id ?? null,
        user_agent: navigator.userAgent,
        platform: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );

    markSubscribed(token);
    return { status: 'registered', token };
  } catch (e) {
    return { status: 'error', message: (e as Error).message };
  }
}

/** Foreground listener — returns an unsubscribe function. */
export async function listenForeground(cb: (p: { title: string; body: string; url?: string; banner?: string }) => void) {
  if (!pushConfigured() || !(await isSupported())) return () => {};
  const messaging = getMessaging(getFirebaseApp());
  return onMessage(messaging, (payload) => {
    const d = (payload.data || {}) as Record<string, string>;
    cb({
      title: d.title || payload.notification?.title || 'Notification',
      body: d.body || payload.notification?.body || '',
      url: d.url,
      banner: d.banner,
    });
  });
}
