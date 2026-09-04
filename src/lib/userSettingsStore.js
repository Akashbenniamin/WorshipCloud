import { getSupabaseClient } from './supabaseClient';

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

export function getDeviceSettingsKey() {
  return isMobileDevice() ? 'worship_cloud_settings_mobile' : 'worship_cloud_settings_pc';
}

export function getLocalDeviceSettings() {
  try {
    const key = getDeviceSettingsKey();
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalDeviceSettings(settings) {
  try {
    const key = getDeviceSettingsKey();
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {}
}

/**
 * Save settings to both local storage and user cloud metadata
 */
export async function syncSaveSettings(settings, user) {
  saveLocalDeviceSettings(settings);

  if (!user) return;

  const deviceKey = isMobileDevice() ? 'settings_mobile' : 'settings_pc';
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.updateUser({
        data: {
          [deviceKey]: settings
        }
      });
    }
  } catch (err) {
    console.warn('Failed to save user settings to Supabase cloud:', err);
  }
}

/**
 * Pull settings from cloud upon login for the active device type
 */
export function pullCloudSettings(user) {
  if (!user) return getLocalDeviceSettings();

  const deviceKey = isMobileDevice() ? 'settings_mobile' : 'settings_pc';
  const cloudSettings = user.raw?.user_metadata?.[deviceKey] || user.user_metadata?.[deviceKey];

  if (cloudSettings && typeof cloudSettings === 'object') {
    saveLocalDeviceSettings(cloudSettings);
    return cloudSettings;
  }

  return getLocalDeviceSettings();
}
