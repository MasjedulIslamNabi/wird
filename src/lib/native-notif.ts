/**
 * Native Notification Abstraction Layer
 *
 * Provides a unified API for scheduling notifications that work both in the
 * browser (PWA) and in the Capacitor native shell (Android/iOS).
 *
 * - On native (Capacitor): uses @capacitor/local-notifications, which schedules
 *   via Android's AlarmManager / iOS's UNUserNotificationCenter. Notifications
 *   fire even when the app is fully killed.
 * - On web: falls back to the Web Notification API (page-level, only works
 *   when the app is open).
 *
 * Usage:
 *   import { scheduleAdhan, scheduleVerseReminder, cancelAll } from '@/lib/native-notif';
 *   await scheduleAdhan('Fajr', new Date('2026-07-15T05:30:00'));
 *   await scheduleVerseReminder(new Date(Date.now() + 60*60*1000), verseData);
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// ─── Capability detection ──────────────────────────────────────────────────

/** True when running inside a Capacitor native shell (Android/iOS). */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/** True when running in a browser (PWA or regular tab). */
export function isWeb(): boolean {
  return !isNative();
}

// ─── Notification IDs (must be unique integers, stable across schedules) ────

// Adhan alarm: IDs 1000-1999 (1000 + prayerIndex*100 + dayOffset)
// Pre-prayer reminder: IDs 2000-2999
// Verse reminder: IDs 3000-3999
// Test notifications: IDs 9000-9999

export const NOTIF_ID_BASE = {
  adhan: 1000,
  prePrayer: 2000,
  verse: 3000,
  test: 9000,
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdhanNotifPayload {
  prayerName: string;
  isFajr: boolean;
  scheduledAt: Date;
}

export interface VerseNotifPayload {
  title: string;
  body: string;
  dir?: 'ltr' | 'rtl';
  lang?: string;
  scheduledAt: Date;
}

// ─── Permission ─────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    const result = await LocalNotifications.checkPermissions();
    return result.display === 'granted';
  }
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission === 'granted';
  }
  return false;
}

// ─── Scheduling ─────────────────────────────────────────────────────────────

/**
 * Schedule the Adhan alarm notification for a specific prayer time.
 * On native, this fires even when the app is killed.
 */
export async function scheduleAdhan(
  payload: AdhanNotifPayload,
  notifId: number,
): Promise<void> {
  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: `🕌 ${payload.prayerName} Prayer Time`,
          body: `It's time for ${payload.prayerName} prayer. Tap to listen to the Adhan.`,
          // Use the Fajr adhan sound for Fajr, general adhan for others
          sound: payload.isFajr ? 'adhan-fajr.mp3' : 'adhan.mp3',
          schedule: {
            at: payload.scheduledAt,
            allowWhileIdle: true, // fires even in Doze mode
          },
          smallIcon: 'ic_stat_icon',
          iconColor: '#0D4B3C',
          ongoing: false,
          actionTypeId: 'ADHAN_ACTION',
          extra: {
            type: 'adhan',
            prayerName: payload.prayerName,
            isFajr: payload.isFajr,
          },
        },
      ],
    });
  } else {
    // Web fallback: schedule via setTimeout (only works while app is open)
    const delay = payload.scheduledAt.getTime() - Date.now();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification(`🕌 ${payload.prayerName} Prayer Time`, {
            body: `It's time for ${payload.prayerName} prayer. Tap to listen to the Adhan.`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `wird-adhan-${payload.prayerName}-${payload.scheduledAt.toDateString()}`,
            requireInteraction: true,
            silent: false,
            data: { url: '/', type: 'adhan', prayerName: payload.prayerName },
          });
          n.onclick = () => { n.close(); window.focus(); };
        }
      }, delay);
    }
  }
}

/**
 * Schedule a pre-prayer reminder notification (e.g. "Fajr in 15 minutes").
 */
export async function schedulePrePrayerReminder(
  prayerName: string,
  prayerTime: Date,
  advanceMinutes: number,
  notifId: number,
): Promise<void> {
  const reminderTime = new Date(prayerTime.getTime() - advanceMinutes * 60 * 1000);
  if (reminderTime.getTime() <= Date.now()) return; // skip past times

  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: `🕌 ${prayerName} Prayer in ${advanceMinutes} min`,
          body: `Prepare for ${prayerName} prayer at ${prayerTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}.`,
          schedule: {
            at: reminderTime,
            allowWhileIdle: true,
          },
          smallIcon: 'ic_stat_icon',
          iconColor: '#0D4B3C',
          extra: { type: 'prePrayer', prayerName },
        },
      ],
    });
  } else {
    const delay = reminderTime.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification(`🕌 ${prayerName} Prayer in ${advanceMinutes} min`, {
            body: `Prepare for ${prayerName} prayer.`,
            icon: '/icon-192.png',
            tag: `wird-preprayer-${prayerName}-${reminderTime.toDateString()}`,
            requireInteraction: false,
            silent: false,
          });
          n.onclick = () => { n.close(); window.focus(); };
        }
      }, delay);
    }
  }
}

/**
 * Schedule a Quran verse reminder notification.
 */
export async function scheduleVerseReminder(
  payload: VerseNotifPayload,
  notifId: number,
): Promise<void> {
  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: notifId,
          title: payload.title,
          body: payload.body,
          schedule: {
            at: payload.scheduledAt,
            allowWhileIdle: true,
          },
          smallIcon: 'ic_stat_icon',
          iconColor: '#0D4B3C',
          extra: { type: 'verse', dir: payload.dir, lang: payload.lang },
        },
      ],
    });
  } else {
    const delay = payload.scheduledAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          const n = new Notification(payload.title, {
            body: payload.body,
            icon: '/icon-192.png',
            tag: `wird-verse-${Date.now()}`,
            requireInteraction: false,
            silent: false,
            ...(payload.dir ? { dir: payload.dir } : {}),
            ...(payload.lang ? { lang: payload.lang } : {}),
          });
          n.onclick = () => { n.close(); window.focus(); };
        }
      }, delay);
    }
  }
}

/**
 * Send an immediate test notification (used by Settings "Test" buttons).
 */
export async function sendTestNotification(
  title: string,
  body: string,
  sound?: string,
): Promise<void> {
  if (isNative()) {
    // Schedule 1 second in the future (LocalNotifications doesn't have a "show now" API)
    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIF_ID_BASE.test + Math.floor(Math.random() * 999),
          title,
          body,
          sound: sound || undefined,
          schedule: { at: new Date(Date.now() + 1000) },
          smallIcon: 'ic_stat_icon',
          iconColor: '#0D4B3C',
          extra: { type: 'test' },
        },
      ],
    });
  } else {
    if ('Notification' in window && Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        icon: '/icon-192.png',
        tag: `wird-test-${Date.now()}`,
        requireInteraction: false,
        silent: false,
      });
      n.onclick = () => { n.close(); window.focus(); };
    }
  }
}

// ─── Cancellation ───────────────────────────────────────────────────────────

/** Cancel all pending Wird notifications. */
export async function cancelAllNotifications(): Promise<void> {
  if (isNative()) {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  }
  // Web fallback: no-op (setTimeout-based notifications can't be easily cancelled
  // without tracking handles — the page reload effectively cancels them)
}

/** Cancel notifications by ID range (e.g. cancel all adhan notifications). */
export async function cancelNotificationsInRange(
  startId: number,
  endId: number,
): Promise<void> {
  if (isNative()) {
    const pending = await LocalNotifications.getPending();
    const toCancel = pending.notifications
      .filter((n) => n.id >= startId && n.id <= endId)
      .map((n) => ({ id: n.id }));
    if (toCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: toCancel });
    }
  }
}

// ─── Notification click handling (native only) ──────────────────────────────

/**
 * Register a listener for notification clicks (native only).
 * On web, clicks are handled inline via `notification.onclick`.
 */
export function onNotificationClick(
  callback: (data: { type: string; prayerName?: string; [key: string]: unknown }) => void,
): () => void {
  if (!isNative()) return () => {};

  const handle = LocalNotifications.addListener(
    'localNotificationReceived',
    (notification) => {
      const extra = (notification.extra || {}) as Record<string, unknown>;
      callback({
        type: (extra.type as string) || 'unknown',
        prayerName: extra.prayerName as string | undefined,
        ...extra,
      });
    },
  );

  // Return an unsubscribe function
  return () => { handle.then((h) => h.remove()); };
}
