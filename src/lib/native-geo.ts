/**
 * Native Geolocation Abstraction Layer
 *
 * Uses @capacitor/geolocation on native (Android/iOS) for accurate GPS,
 * falls back to navigator.geolocation on web.
 */

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface GeoCoords {
  lat: number;
  lng: number;
}

/** True when running inside a Capacitor native shell. */
export function isNativeGeo(): boolean {
  return Capacitor.isNativePlatform();
}

/** Request location permission (native only — web prompts automatically on getCurrentPosition). */
export async function requestLocationPermission(): Promise<boolean> {
  if (isNativeGeo()) {
    const status = await Geolocation.requestPermissions();
    return status.location === 'granted' || status.coarseLocation === 'granted';
  }
  // Web: permission is requested on first getCurrentPosition call
  return true;
}

/** Check if location permission is granted. */
export async function checkLocationPermission(): Promise<boolean> {
  if (isNativeGeo()) {
    const status = await Geolocation.checkPermissions();
    return status.location === 'granted' || status.coarseLocation === 'granted';
  }
  return true; // Web: assume granted (will prompt if not)
}

/**
 * Get the current device location.
 * Returns {lat, lng} or null if denied/unavailable.
 */
export async function getCurrentLocation(): Promise<GeoCoords | null> {
  try {
    if (isNativeGeo()) {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false, // faster, less battery
        timeout: 10000,
      });
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
    }
    // Web fallback
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  } catch {
    return null;
  }
}
