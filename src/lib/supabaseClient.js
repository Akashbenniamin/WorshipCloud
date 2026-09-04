import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'worship_cloud_supabase_config';

export const DEFAULT_SUPABASE_URL = 'https://rvxegccyyjjptivotxag.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2eGVnY2N5eWpqcHRpdm90eGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MTU3MjgsImV4cCI6MjEwNDA5MTcyOH0.I5L1D5oF5Ow57758gD9XjGcge9dHB0DdSuho6nQE5Ww';

let cachedClient = null;
let currentConfigSig = '';

export function getSupabaseConfig() {
  // Check env first
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env'
    };
  }

  // Check localStorage override
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.url && parsed?.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          isConfigured: true,
          source: 'storage'
        };
      }
    }
  } catch (err) {
    console.error('Failed to read Supabase config from localStorage:', err);
  }

  // Built-in project default credentials
  if (DEFAULT_SUPABASE_URL && DEFAULT_SUPABASE_ANON_KEY) {
    return {
      url: DEFAULT_SUPABASE_URL,
      anonKey: DEFAULT_SUPABASE_ANON_KEY,
      isConfigured: true,
      source: 'default'
    };
  }

  return {
    url: '',
    anonKey: '',
    isConfigured: false,
    source: 'none'
  };
}

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    cachedClient = null;
    currentConfigSig = '';
    return null;
  }

  const sig = `${config.url}::${config.anonKey}`;
  if (cachedClient && currentConfigSig === sig) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    currentConfigSig = sig;
    return cachedClient;
  } catch (err) {
    console.error('Error creating Supabase client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url, anonKey) {
  const cleanUrl = (url || '').trim();
  const cleanKey = (anonKey || '').trim();

  if (!cleanUrl || !cleanKey) {
    throw new Error('Both Supabase URL and Anon Key are required');
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
  );

  // Invalidate cache
  cachedClient = null;
  currentConfigSig = '';
  return getSupabaseClient();
}

export function clearSupabaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  cachedClient = null;
  currentConfigSig = '';
}
